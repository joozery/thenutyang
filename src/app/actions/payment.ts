'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { PaymentSettings } from '@/models/PaymentSettings';
import { Expense } from '@/models/Expense';
import { verifySlip } from '@/lib/slip2go';
import { uploadImage } from './upload';

type ActionResult = { error?: string; ok?: boolean; verified?: boolean; verifyReason?: string };

export async function uploadDepositSlip(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const orderRef = formData.get('ref') as string;
    if (!orderRef) return { error: 'ไม่พบหมายเลขการจอง' };

    const file = formData.get('file') as File | null;
    if (!file) return { error: 'ไม่พบไฟล์สลิป' };

    await connectDB();
    // ตะกร้าอาจมีหลายรุ่นยาง (หลาย Booking) ใต้ orderRef เดียว — รวมยอดมัดจำของทุกรายการที่ต้องมัดจำ ชำระทีเดียวจบ
    const bookings = await Booking.find({ orderRef, depositStatus: { $ne: 'not_required' } });
    if (bookings.length === 0) return { error: 'ไม่พบการจองนี้ หรือไม่มียอดมัดจำที่ต้องชำระ' };

    const totalDeposit = bookings.reduce((sum, b) => sum + b.depositAmount, 0);

    let url: string;
    try {
      ({ url } = await uploadImage(formData, 'slips'));
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ' };
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { verified, reason } = await verifySlip(fileBuffer, file.name, file.type, totalDeposit);

    await Booking.updateMany(
      { orderRef, depositStatus: { $ne: 'not_required' } },
      {
        depositSlipUrl: url,
        depositStatus: verified ? 'verified' : 'submitted',
        depositVerifyNote: reason,
        ...(verified ? { depositPaidAt: new Date() } : {}),
      }
    );

    revalidatePath('/booking/success');
    revalidatePath('/admin/payments');
    return { ok: true, verified, verifyReason: reason };
  } catch (err) {
    console.error('[uploadDepositSlip]', err);
    return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}

export async function uploadBalanceSlip(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const orderRef = formData.get('ref') as string;
    if (!orderRef) return { error: 'ไม่พบหมายเลขการจอง' };

    const file = formData.get('file') as File | null;
    if (!file) return { error: 'ไม่พบไฟล์สลิป' };

    await connectDB();
    const bookings = await Booking.find({ orderRef });
    if (bookings.length === 0) return { error: 'ไม่พบการจองนี้' };
    if (bookings.every((b) => b.balanceStatus === 'paid')) return { error: 'ชำระยอดคงเหลือครบแล้ว' };

    const remaining = bookings.reduce((sum, b) => {
      const totalAmount = b.tirePrice * b.quantity;
      const itemRemaining = b.depositStatus === 'verified' ? totalAmount - b.depositAmount : totalAmount;
      return sum + itemRemaining;
    }, 0);
    if (remaining <= 0) return { error: 'ไม่มียอดคงเหลือต้องชำระ' };

    let url: string;
    try {
      ({ url } = await uploadImage(formData, 'slips'));
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ' };
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { verified, reason } = await verifySlip(fileBuffer, file.name, file.type, remaining);

    // ยอดที่ Slip2Go ตรวจสอบคือยอดรวมทั้งกลุ่ม (ถ้าตะกร้ามีหลายรุ่นยาง) — ไม่ต้องเซ็ต balanceReceivedAmount ต่อรายการ
    // ปล่อยเป็น null เพื่อให้ finance.ts ใช้ยอดที่ต้องชำระของแต่ละรายการแทน (เคสนี้โอนตรงผ่านสลิป ไม่มีค่าธรรมเนียมหัก)
    await Booking.updateMany(
      { orderRef },
      verified
        ? { balanceSlipUrl: url, balanceVerifyNote: reason, balanceStatus: 'paid', balancePaymentMethod: 'transfer', balancePaidAt: new Date() }
        : { balanceSlipUrl: url, balanceVerifyNote: reason }
    );

    revalidatePath('/booking/success');
    revalidatePath('/booking/confirm');
    revalidatePath('/admin/payments');
    return { ok: true, verified, verifyReason: reason };
  } catch (err) {
    console.error('[uploadBalanceSlip]', err);
    return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}

export async function updateDepositAmount(ref: string, amount: number): Promise<ActionResult> {
  try {
    if (!Number.isFinite(amount) || amount < 0) return { error: 'จำนวนเงินไม่ถูกต้อง' };
    await connectDB();
    await Booking.updateOne({ ref }, { depositAmount: amount });
    revalidatePath('/admin/payments');
    return { ok: true };
  } catch (err) {
    console.error('[updateDepositAmount]', err);
    return { error: 'บันทึกไม่สำเร็จ' };
  }
}

export async function verifyDepositManually(ref: string): Promise<ActionResult> {
  try {
    await connectDB();
    await Booking.updateOne({ ref }, { depositStatus: 'verified', depositPaidAt: new Date() });

    // ประทับมัดจำเข้าเอกสาร + ออกใบจอง RES — พฤติกรรมเดียวกับปุ่มยืนยันในหน้าจอง
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const booking = await Booking.findOne({ ref }).lean() as any;
    if (booking) {
      const { syncVerifiedDeposit } = await import('@/lib/deposit-sync');
      await syncVerifiedDeposit(booking);
    }

    revalidatePath('/admin/payments');
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/documents');
    return { ok: true };
  } catch (err) {
    console.error('[verifyDepositManually]', err);
    return { error: 'ดำเนินการไม่สำเร็จ' };
  }
}

// คืนเงินมัดจำให้ลูกค้า — ใช้กรณีลูกค้าจ่ายเต็มจำนวนทีหลังโดยไม่ได้หักมัดจำที่จ่ายไปก่อน หรือยกเลิกงาน
// ทำเครื่องหมายไว้เฉยๆ ไม่ลบสถานะ verified เพื่อให้เห็นประวัติว่าเคยจ่ายมัดจำจริง แค่ไม่นับเป็นรายรับแล้ว (หน้าการเงินจะตัดออกเอง)
export async function refundDeposit(ref: string): Promise<ActionResult> {
  try {
    await connectDB();
    const booking = await Booking.findOne({ ref });
    if (!booking) return { error: 'ไม่พบการจองนี้' };
    if (booking.depositStatus !== 'verified') return { error: 'มัดจำรายการนี้ยังไม่ได้ยืนยันรับเงิน' };
    if (booking.depositRefunded) return { error: 'คืนเงินมัดจำไปแล้ว' };

    await Booking.updateOne({ ref }, { depositRefunded: true, depositRefundedAt: new Date() });
    revalidatePath('/admin/payments');
    revalidatePath('/admin/finance');
    return { ok: true };
  } catch (err) {
    console.error('[refundDeposit]', err);
    return { error: 'ดำเนินการไม่สำเร็จ' };
  }
}

export async function markBalancePaid(ref: string, method: 'cash' | 'transfer' | 'credit_card', receivedAmount?: number): Promise<ActionResult> {
  try {
    await connectDB();
    const booking = await Booking.findOne({ ref });
    if (!booking) return { error: 'ไม่พบการจองนี้' };

    const totalAmount = booking.tirePrice * booking.quantity;
    const remaining = booking.depositStatus === 'verified' ? totalAmount - booking.depositAmount : totalAmount;
    const received  = receivedAmount ?? remaining;

    if (!Number.isFinite(received) || received < 0) return { error: 'จำนวนเงินไม่ถูกต้อง' };

    await Booking.updateOne({ ref }, {
      balanceStatus: 'paid',
      balancePaymentMethod: method,
      balancePaidAt: new Date(),
      balanceReceivedAmount: received,
    });

    // รูดบัตรแล้วยอดเข้าน้อยกว่ายอดที่ต้องชำระ (โดนหักค่าธรรมเนียม) — บันทึกส่วนต่างเป็นรายจ่ายอัตโนมัติ
    const shortfall = remaining - received;
    if (method === 'credit_card' && shortfall > 0.01) {
      await Expense.create({
        category:    'ค่าธรรมเนียมบัตรเครดิต',
        description: `ค่าธรรมเนียมบัตรเครดิต - ${booking.ref}`,
        amount:      shortfall,
        expenseDate: new Date(),
        note:        `ยอดที่ต้องชำระ ฿${remaining.toLocaleString()} เข้าจริง ฿${received.toLocaleString()}`,
      });
    }

    revalidatePath('/admin/payments');
    revalidatePath('/admin/finance');
    return { ok: true };
  } catch (err) {
    console.error('[markBalancePaid]', err);
    return { error: 'บันทึกไม่สำเร็จ' };
  }
}

export async function revertBalancePayment(ref: string): Promise<ActionResult> {
  try {
    await connectDB();
    await Booking.updateOne({ ref }, { balanceStatus: 'unpaid', balancePaymentMethod: '', balancePaidAt: null, balanceReceivedAmount: null });
    revalidatePath('/admin/payments');
    revalidatePath('/admin/finance');
    return { ok: true };
  } catch (err) {
    console.error('[revertBalancePayment]', err);
    return { error: 'ดำเนินการไม่สำเร็จ' };
  }
}

export async function getDepositDocIdByRef(bookingRef: string): Promise<{ id?: string; error?: string }> {
  try {
    await connectDB();
    const { FinancialDocument } = await import('@/models/FinancialDocument');
    // ใบมัดจำตัวจริงคือ "ใบจอง (RES)" — ถ้ายังไม่มีค่อย fallback เป็นเอกสารใบล่าสุดของการจอง
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resDoc = await FinancialDocument.findOne({ bookingRef, type: 'booking_note' }).sort({ createdAt: -1 }).lean() as any;
    if (resDoc) return { id: String(resDoc._id) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = await FinancialDocument.findOne({ bookingRef }).sort({ createdAt: -1 }).lean() as any;
    if (!doc) return { error: 'ไม่พบเอกสาร' };
    return { id: String(doc._id) };
  } catch (err) {
    console.error('[getDepositDocIdByRef]', err);
    return { error: 'เกิดข้อผิดพลาด' };
  }
}

export async function setPaymentQrImage(url: string): Promise<ActionResult> {
  try {
    await connectDB();
    await PaymentSettings.findOneAndUpdate({}, { qrCodeImage: url, updatedAt: new Date() }, { upsert: true });
    revalidatePath('/admin/payments');
    revalidatePath('/booking/success');
    return { ok: true };
  } catch (err) {
    console.error('[setPaymentQrImage]', err);
    return { error: 'บันทึกไม่สำเร็จ' };
  }
}
