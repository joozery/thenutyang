'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
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
    await Booking.updateOne({ ref }, { status: 'completed' });
    if (booking.lineUserId) {
      await pushMessage(booking.lineUserId, [buildReadyMessage(booking.toObject())]);
    }
    revalidatePath('/admin/bookings');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function cancelBooking(ref: string): Promise<ActionResult> {
  try {
    const booking = await getBooking(ref);
    await Booking.updateOne({ ref }, { status: 'cancelled' });
    if (booking.lineUserId) {
      await pushMessage(booking.lineUserId, [buildCancelMessage(booking.toObject())]);
    }
    revalidatePath('/admin/bookings');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
