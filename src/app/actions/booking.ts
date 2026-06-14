'use server';

import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import connectDB from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { pushMessage, buildQuoteFlexMessage } from '@/lib/line';

async function generateRef(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Booking.countDocuments({ ref: { $regex: `^NTY-${today}` } });
  const seq = String(count + 1).padStart(4, '0');
  return `NTY-${today}-${seq}`;
}

export async function createBooking(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await connectDB();

    const ref = await generateRef();
    const lineUserId = (formData.get('lineUserId') as string) || undefined;

    const booking = await Booking.create({
      ref,
      tireId:          formData.get('tireId') as string,
      tireName:        formData.get('tireName') as string,
      tirePrice:       Number(formData.get('tirePrice')),
      quantity:        Number(formData.get('quantity') ?? 4),
      name:            formData.get('name') as string,
      phone:           formData.get('phone') as string,
      lineId:          (formData.get('lineId') as string) || '',
      carModel:        formData.get('carModel') as string,
      carYear:         formData.get('carYear') as string,
      appointmentDate: formData.get('appointmentDate') as string,
      note:            (formData.get('note') as string) ?? '',
      lineUserId,
    });

    let sent = false;
    if (lineUserId) {
      try {
        await pushMessage(lineUserId, [buildQuoteFlexMessage(booking.toObject())]);
        sent = true;
      } catch {
        // push ล้มเหลว (ยังไม่ add OA) — บันทึก booking ไว้ก่อน
      }
    }

    redirect(`/booking/success?ref=${ref}&sent=${sent ? '1' : '0'}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error('[createBooking]', err);
    return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่ หรือติดต่อร้านโดยตรง' };
  }
}
