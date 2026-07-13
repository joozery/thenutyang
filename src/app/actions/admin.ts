'use server';

import { revalidatePath } from 'next/cache';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { FinancialDocument } from '@/models/FinancialDocument';
import { disburseStock, receiveStock } from '@/app/actions/warehouse';
import { createQuoteFromBooking } from '@/app/actions/documents';
import {
  pushMessage,
  buildQuoteFlexMessage,
  buildConfirmMessage,
  buildReadyMessage,
  buildCancelMessage,
} from '@/lib/line';

type ActionResult = { ok: true } | { ok: false; error: string };

async function getBooking(ref: string) {
  await connectDB();
  const booking = await Booking.findOne({ ref });
  if (!booking) throw new Error(`ไม่พบการจอง ${ref}`);
  return booking;
}

export async function sendLineQuote(ref: string): Promise<ActionResult> {
  try {
    const booking = await getBooking(ref);
    if (!booking.lineUserId) {
      return { ok: false, error: 'ลูกค้ายังไม่ได้ส่งหมายเลขการจองมาทาง LINE' };
    }
    await pushMessage(booking.lineUserId, [buildQuoteFlexMessage(booking.toObject())]);
    revalidatePath('/admin/bookings');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function confirmBooking(ref: string): Promise<ActionResult> {
  try {
    const booking = await getBooking(ref);
    await Booking.updateOne({ ref }, { status: 'confirmed' });
    if (booking.lineUserId) {
      await pushMessage(booking.lineUserId, [buildConfirmMessage(booking.toObject())]);
    }
    revalidatePath('/admin/bookings');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function markReady(ref: string): Promise<ActionResult> {
  try {
    const booking = await getBooking(ref);

    if (booking.status !== 'completed') {
      await Booking.updateOne({ ref }, { status: 'completed' });

      // ตัดสต๊อกจริงเมื่องานเสร็จ/ติดตั้งยางแล้ว — ข้ามถ้า tireId ไม่ใช่ Product จริง (เช่น booking จาก LINE chatbot ที่ยังใช้ id เก่า)
      if (isValidObjectId(booking.tireId)) {
        const result = await disburseStock(booking.tireId, booking.quantity, booking.ref, `ตัดสต๊อกจากการจอง ${booking.ref}`);
        if (result.error) console.error(`[markReady] disburseStock failed for ${ref}: ${result.error}`);
      }
    }

    if (booking.lineUserId) {
      await pushMessage(booking.lineUserId, [buildReadyMessage(booking.toObject())]);
    }
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/warehouse');
    revalidatePath('/admin/products');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function createQuoteForBooking(ref: string): Promise<ActionResult> {
  try {
    const booking = await getBooking(ref);
    const existing = await FinancialDocument.findOne({ bookingId: booking._id }).lean();
    if (existing) return { ok: false, error: 'มีใบเสนอราคาสำหรับการจองนี้อยู่แล้ว' };

    await createQuoteFromBooking(booking.toObject());
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/documents');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateMileageAfter(ref: string, mileageAfter: number): Promise<ActionResult> {
  try {
    if (!Number.isFinite(mileageAfter) || mileageAfter < 0) return { ok: false, error: 'เลขไมล์ไม่ถูกต้อง' };
    await connectDB();
    await Booking.updateOne({ ref }, { mileageAfter });
    revalidatePath('/admin/bookings');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function adminUpdatePaymentStatus(ref: string, data: {
  depositStatus?: string;
  depositSlipUrl?: string;
  balanceStatus?: string;
  balanceSlipUrl?: string;
  balancePaymentMethod?: string;
}): Promise<ActionResult> {
  try {
    const update: Record<string, unknown> = {};
    if (data.depositStatus !== undefined) {
      update.depositStatus = data.depositStatus;
      if (data.depositStatus === 'verified') update.depositPaidAt = new Date();
    }
    if (data.depositSlipUrl) update.depositSlipUrl = data.depositSlipUrl;
    if (data.balanceStatus !== undefined) {
      update.balanceStatus = data.balanceStatus;
      if (data.balanceStatus === 'paid') update.balancePaidAt = new Date();
    }
    if (data.balanceSlipUrl) update.balanceSlipUrl = data.balanceSlipUrl;
    if (data.balancePaymentMethod !== undefined) update.balancePaymentMethod = data.balancePaymentMethod;
    await connectDB();
    await Booking.updateOne({ ref }, update);

    // ยืนยันมัดจำแล้ว → ใส่ยอดมัดจำเข้าเอกสารที่ผูกกับการจอง (ใบเสนอราคา ฯลฯ)
    // เพื่อให้ตอนพิมพ์/ส่งต่อเป็นใบเสร็จ แสดง "มัดจำที่ได้รับแล้ว" และยอดคงเหลือถูกต้อง
    // และออก "ใบจอง" (RES) ให้อัตโนมัติถ้ายังไม่มี
    if (data.depositStatus === 'verified') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const booking = await Booking.findOne({ ref }).lean() as any;
      if (booking) {
        const deposit = booking.depositAmount ?? 0;
        await FinancialDocument.updateMany(
          { bookingId: booking._id, status: { $ne: 'cancelled' } },
          { depositAmount: deposit },
        );

        const hasBookingNote = await FinancialDocument.findOne({ bookingId: booking._id, type: 'booking_note' }).lean();
        if (!hasBookingNote && deposit > 0) {
          const { generateDocNumber } = await import('@/lib/documents');
          const docNumber = await generateDocNumber('booking_note');
          const qty = booking.quantity ?? 1;
          const subtotal = qty * (booking.tirePrice ?? 0);
          const vatAmount = subtotal * 0.07;
          await FinancialDocument.create({
            docNumber,
            type: 'booking_note',
            source: 'booking',
            bookingId: booking._id,
            bookingRef: booking.orderRef ?? booking.ref ?? '',
            customerName: booking.customerType === 'corporate' && booking.companyName ? booking.companyName : (booking.name ?? ''),
            customerPhone: booking.phone ?? '',
            customerCar: [booking.carBrand, booking.carModel, booking.licensePlate ? `ทะเบียน ${booking.licensePlate}` : ''].filter(Boolean).join(' '),
            customerAddress: booking.address ?? '',
            customerTaxId: booking.taxId ?? '',
            items: [{ description: booking.tireName ?? '', qty, unitPrice: booking.tirePrice ?? 0, discount: 0, lineTotal: subtotal }],
            subtotal,
            discountTotal: 0,
            vatRate: 7,
            vatAmount,
            grandTotal: subtotal + vatAmount,
            depositAmount: deposit,
            paymentMethod: 'pending',
            status: 'deposit_paid',
            issuedAt: new Date(),
            note: `มัดจำรับแล้ว ฿${deposit.toLocaleString()} (จอง ${booking.ref})`,
          });
        }
      }
      revalidatePath('/admin/documents');
    }

    revalidatePath('/admin/bookings');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function approveQuote(ref: string): Promise<ActionResult> {
  try {
    const booking = await getBooking(ref);
    const doc = await FinancialDocument.findOneAndUpdate(
      { bookingId: booking._id },
      { status: 'approved' },
      { new: true }
    );
    if (!doc) return { ok: false, error: 'ไม่พบใบเสนอราคา' };
    await Booking.updateOne({ ref }, { status: 'confirmed' });
    if (booking.lineUserId) {
      await pushMessage(booking.lineUserId, [buildConfirmMessage(booking.toObject())]);
    }
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/documents');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function rejectQuote(ref: string): Promise<ActionResult> {
  try {
    const booking = await getBooking(ref);
    const doc = await FinancialDocument.findOneAndUpdate(
      { bookingId: booking._id },
      { status: 'rejected' },
      { new: true }
    );
    if (!doc) return { ok: false, error: 'ไม่พบใบเสนอราคา' };
    await Booking.updateOne({ ref }, { status: 'cancelled' });
    if (booking.lineUserId) {
      await pushMessage(booking.lineUserId, [buildCancelMessage(booking.toObject())]);
    }
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/documents');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function cancelBooking(ref: string): Promise<ActionResult> {
  try {
    const booking = await getBooking(ref);
    const wasCompleted = booking.status === 'completed';

    await Booking.updateOne({ ref }, { status: 'cancelled' });

    // ถ้างานเสร็จไปแล้ว (ตัดสต๊อกไปแล้ว) แล้วมายกเลิกทีหลัง ต้องคืนสต๊อก
    if (wasCompleted && isValidObjectId(booking.tireId)) {
      const result = await receiveStock(booking.tireId, booking.quantity, booking.ref, `คืนสต๊อกจากการยกเลิกการจอง ${booking.ref}`);
      if (result.error) console.error(`[cancelBooking] receiveStock failed for ${ref}: ${result.error}`);
    }

    if (booking.lineUserId) {
      await pushMessage(booking.lineUserId, [buildCancelMessage(booking.toObject())]);
    }
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/warehouse');
    revalidatePath('/admin/products');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteBooking(ref: string): Promise<ActionResult> {
  try {
    const booking = await getBooking(ref);

    // ถ้างานเสร็จ (ตัดสต๊อกไปแล้ว) ต้องคืนสต๊อกก่อนลบ
    if (booking.status === 'completed' && isValidObjectId(booking.tireId)) {
      const result = await receiveStock(booking.tireId, booking.quantity, booking.ref, `คืนสต๊อกจากการลบการจอง ${booking.ref}`);
      if (result.error) console.error(`[deleteBooking] receiveStock failed for ${ref}: ${result.error}`);
    }

    await FinancialDocument.deleteMany({ bookingId: booking._id });
    await Booking.deleteOne({ ref });

    revalidatePath('/admin/bookings');
    revalidatePath('/admin/documents');
    revalidatePath('/admin/warehouse');
    revalidatePath('/admin/products');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
