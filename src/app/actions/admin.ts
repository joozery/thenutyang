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
