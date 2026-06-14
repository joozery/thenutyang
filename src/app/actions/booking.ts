'use server';

import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { pushMessage, buildQuoteFlexMessage } from '@/lib/line';

async function generateRef(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Booking.countDocuments({ ref: { $regex: `^NTY-${today}` } });
  const seq = String(count + 1).padStart(4, '0');
  return `NTY-${today}-${seq}`;
}

export async function createBooking(formData: FormData) {
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

  // ถ้า login ด้วย LINE แล้ว — ส่งใบเสนอราคาทันที
  let sent = false;
  if (lineUserId) {
    try {
      await pushMessage(lineUserId, [buildQuoteFlexMessage(booking.toObject())]);
      sent = true;
    } catch {
      // push ล้มเหลว (เช่น ยังไม่ได้ add OA) — ยังคงบันทึก booking ไว้
    }
  }

  redirect(`/booking/success?ref=${ref}&sent=${sent ? '1' : '0'}`);
}
