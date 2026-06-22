'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { PaymentSettings } from '@/models/PaymentSettings';
import { verifySlip } from '@/lib/slip2go';
import { uploadImage } from './upload';

type ActionResult = { error?: string; ok?: boolean; verified?: boolean; verifyReason?: string };

export async function uploadDepositSlip(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const ref = formData.get('ref') as string;
    if (!ref) return { error: 'ไม่พบหมายเลขการจอง' };

    const file = formData.get('file') as File | null;
    if (!file) return { error: 'ไม่พบไฟล์สลิป' };

    await connectDB();
    const booking = await Booking.findOne({ ref });
    if (!booking) return { error: 'ไม่พบการจองนี้' };

    let url: string;
    try {
      ({ url } = await uploadImage(formData, 'slips'));
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ' };
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { verified, reason } = await verifySlip(fileBuffer, file.name, file.type, booking.depositAmount);

    await Booking.updateOne(
      { ref },
      { depositSlipUrl: url, depositStatus: verified ? 'verified' : 'submitted', depositVerifyNote: reason }
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
    const ref = formData.get('ref') as string;
    if (!ref) return { error: 'ไม่พบหมายเลขการจอง' };

    const file = formData.get('file') as File | null;
    if (!file) return { error: 'ไม่พบไฟล์สลิป' };

    await connectDB();
    const booking = await Booking.findOne({ ref });
    if (!booking) return { error: 'ไม่พบการจองนี้' };
    if (booking.balanceStatus === 'paid') return { error: 'ชำระยอดคงเหลือครบแล้ว' };

    const totalAmount = booking.tirePrice * booking.quantity;
    const remaining = booking.depositStatus === 'verified' ? totalAmount - booking.depositAmount : totalAmount;
    if (remaining <= 0) return { error: 'ไม่มียอดคงเหลือต้องชำระ' };

    let url: string;
    try {
      ({ url } = await uploadImage(formData, 'slips'));
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ' };
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { verified, reason } = await verifySlip(fileBuffer, file.name, file.type, remaining);

    await Booking.updateOne(
      { ref },
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
    await Booking.updateOne({ ref }, { depositStatus: 'verified' });
    revalidatePath('/admin/payments');
    return { ok: true };
  } catch (err) {
    console.error('[verifyDepositManually]', err);
    return { error: 'ดำเนินการไม่สำเร็จ' };
  }
}

export async function markBalancePaid(ref: string, method: 'cash' | 'transfer'): Promise<ActionResult> {
  try {
    await connectDB();
    await Booking.updateOne({ ref }, { balanceStatus: 'paid', balancePaymentMethod: method, balancePaidAt: new Date() });
    revalidatePath('/admin/payments');
    return { ok: true };
  } catch (err) {
    console.error('[markBalancePaid]', err);
    return { error: 'บันทึกไม่สำเร็จ' };
  }
}

export async function revertBalancePayment(ref: string): Promise<ActionResult> {
  try {
    await connectDB();
    await Booking.updateOne({ ref }, { balanceStatus: 'unpaid', balancePaymentMethod: '', balancePaidAt: null });
    revalidatePath('/admin/payments');
    return { ok: true };
  } catch (err) {
    console.error('[revertBalancePayment]', err);
    return { error: 'ดำเนินการไม่สำเร็จ' };
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
