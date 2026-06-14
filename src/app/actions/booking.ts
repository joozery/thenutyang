'use server';

import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import { Booking } from '@/models/Booking';

async function generateRef(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Booking.countDocuments({ ref: { $regex: `^NTY-${today}` } });
  const seq = String(count + 1).padStart(4, '0');
  return `NTY-${today}-${seq}`;
}

export async function createBooking(formData: FormData) {
  await connectDB();

  const ref = await generateRef();

  await Booking.create({
    ref,
    tireId:          formData.get('tireId') as string,
    tireName:        formData.get('tireName') as string,
    tirePrice:       Number(formData.get('tirePrice')),
    quantity:        Number(formData.get('quantity') ?? 4),
    name:            formData.get('name') as string,
    phone:           formData.get('phone') as string,
    lineId:          formData.get('lineId') as string,
    carModel:        formData.get('carModel') as string,
    carYear:         formData.get('carYear') as string,
    appointmentDate: formData.get('appointmentDate') as string,
    note:            (formData.get('note') as string) ?? '',
  });

  redirect(`/booking/success?ref=${ref}`);
}
