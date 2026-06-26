'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { TimeCorrection } from '@/models/TimeCorrection';
import { Attendance } from '@/models/Attendance';
import { calcLateMinutes, calcOTMinutes, minutesToBilledHours } from '@/lib/attendance-calc';

function timeToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export async function createTimeCorrectionRequest(data: {
  attendanceId: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await connectDB();
    const att = await Attendance.findById(data.attendanceId);
    if (!att) return { ok: false, error: 'ไม่พบรายการลงเวลา' };

    await TimeCorrection.create({
      employeeId:        att.employeeId,
      employeeName:      att.employeeName,
      attendanceId:      data.attendanceId,
      date:              att.date,
      originalCheckIn:   att.checkIn,
      originalCheckOut:  att.checkOut,
      requestedCheckIn:  data.requestedCheckIn,
      requestedCheckOut: data.requestedCheckOut,
      reason:            data.reason,
    });
    revalidatePath('/admin/time-correction');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function approveTimeCorrection(
  id: string,
  reviewedBy = 'ผู้จัดการ',
): Promise<{ ok: boolean; error?: string }> {
  try {
    await connectDB();
    const req = await TimeCorrection.findById(id);
    if (!req) return { ok: false, error: 'ไม่พบคำขอ' };
    if (req.status !== 'pending') return { ok: false, error: 'คำขอนี้ได้รับการตอบสนองแล้ว' };

    const att = await Attendance.findById(req.attendanceId);
    if (!att) return { ok: false, error: 'ไม่พบรายการลงเวลา' };

    const checkIn  = req.requestedCheckIn;
    const checkOut = req.requestedCheckOut;
    const lateMin  = att.shiftStart ? calcLateMinutes(att.shiftStart, checkIn) : 0;
    const otMin    = att.shiftEnd   ? calcOTMinutes(att.shiftEnd, checkOut)   : 0;
    const hours    = Math.max(0, timeToMinutes(checkOut) - timeToMinutes(checkIn)) / 60;
    const status   = minutesToBilledHours(lateMin) > 0 ? 'late' : 'present';

    await Attendance.findByIdAndUpdate(req.attendanceId, {
      checkIn, checkOut, lateMinutes: lateMin, otMinutes: otMin,
      hoursWorked: hours, status,
    });

    await TimeCorrection.findByIdAndUpdate(id, {
      status: 'approved', reviewedBy, reviewedAt: new Date(),
    });

    revalidatePath('/admin/attendance');
    revalidatePath('/admin/time-correction');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function rejectTimeCorrection(
  id: string,
  reviewedBy = 'ผู้จัดการ',
  reviewNote = '',
): Promise<{ ok: boolean; error?: string }> {
  try {
    await connectDB();
    await TimeCorrection.findByIdAndUpdate(id, {
      status: 'rejected', reviewedBy, reviewNote, reviewedAt: new Date(),
    });
    revalidatePath('/admin/time-correction');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
