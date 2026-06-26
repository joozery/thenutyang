'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Attendance } from '@/models/Attendance';
import { calcLateMinutes, calcOTMinutes, minutesToBilledHours } from '@/lib/attendance-calc';
import type { AttendanceStatus } from '@/models/Attendance';

function dayUTC(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function calcHoursWorked(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  return Math.max(0, timeToMinutes(checkOut) - timeToMinutes(checkIn)) / 60;
}

// statuses ที่ไม่นับเข้างาน — ไม่ควรมี late/OT
const NON_WORK_STATUSES: AttendanceStatus[] = ['absent', 'leave', 'holiday'];

// ── สร้างรายการลงเวลาจากเวรงานของวัน (idempotent) ─────────────────────────────
export async function generateFromShifts(
  date: string,
): Promise<{ ok: boolean; created: number; error?: string }> {
  try {
    await connectDB();
    const { Shift } = await import('@/models/Shift');
    const day  = dayUTC(date);
    const next = new Date(day); next.setUTCDate(next.getUTCDate() + 1);

    const shifts = await Shift.find({ date: { $gte: day, $lt: next } }).lean() as {
      _id: string; employeeId: string; employeeName: string; shiftStart: string; shiftEnd: string;
    }[];

    let created = 0;
    for (const s of shifts) {
      const existing = await Attendance.findOne({ employeeId: s.employeeId, date: day });
      if (!existing) {
        await Attendance.create({
          employeeId:   s.employeeId,
          employeeName: s.employeeName,
          shiftId:      s._id,
          date:         day,
          shiftStart:   s.shiftStart,
          shiftEnd:     s.shiftEnd,
          status:       'pending',
        });
        created++;
      }
    }
    revalidatePath('/admin/attendance');
    return { ok: true, created };
  } catch (err) {
    console.error('[generateFromShifts]', err);
    return { ok: false, created: 0, error: String(err) };
  }
}

// ── แก้ไขข้อมูลลงเวลา (admin) ─────────────────────────────────────────────────
export async function updateAttendance(
  id: string,
  data: { checkIn?: string; checkOut?: string; status?: AttendanceStatus; note?: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await connectDB();
    const rec = await Attendance.findById(id);
    if (!rec) return { ok: false, error: 'ไม่พบรายการ' };

    const checkIn  = data.checkIn  !== undefined ? data.checkIn  : (rec.checkIn  as string);
    const checkOut = data.checkOut !== undefined ? data.checkOut : (rec.checkOut as string);

    // ถ้าเป็น absent/leave/holiday → ไม่นับสาย/OT
    const isNonWork = data.status !== undefined && NON_WORK_STATUSES.includes(data.status);

    const lateMin     = isNonWork ? 0 : (checkIn && rec.shiftStart)  ? calcLateMinutes(rec.shiftStart as string, checkIn) : (rec.lateMinutes as number);
    const otMin       = isNonWork ? 0 : (checkOut && rec.shiftEnd)   ? calcOTMinutes(rec.shiftEnd as string, checkOut)   : (rec.otMinutes as number);
    const hoursWorked = isNonWork ? 0 : calcHoursWorked(checkIn, checkOut);

    // status priority: explicit > auto-calculate
    const finalStatus: AttendanceStatus = data.status !== undefined
      ? data.status
      : minutesToBilledHours(lateMin) > 0 ? 'late'
        : checkIn ? 'present'
          : 'pending';

    await Attendance.findByIdAndUpdate(id, {
      $set: {
        checkIn,
        checkOut,
        lateMinutes:  lateMin,
        otMinutes:    otMin,
        hoursWorked,
        status:       finalStatus,
        note:         data.note !== undefined ? data.note : (rec.note as string),
      },
    });
    revalidatePath('/admin/attendance');
    revalidatePath('/admin/payroll');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ── บันทึก/แก้ไขการลงเวลา 1 คน/วัน (compat) ───────────────────────────────────
export async function saveAttendance(data: {
  employeeId: string; date: string; status: string;
  checkIn?: string; checkOut?: string;
  lateMinutes?: number; otMinutes?: number; note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await connectDB();
    const day         = dayUTC(data.date);
    const hoursWorked = calcHoursWorked(data.checkIn ?? '', data.checkOut ?? '');
    await Attendance.findOneAndUpdate(
      { employeeId: data.employeeId, date: day },
      { $set: { ...data, date: day, hoursWorked }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true },
    );
    revalidatePath('/admin/attendance');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ── bulk save (compat) ────────────────────────────────────────────────────────
export async function saveAttendanceBulk(rows: {
  employeeId: string; date: string; status: string;
  checkIn?: string; checkOut?: string;
  lateMinutes?: number; otMinutes?: number; note?: string;
}[]): Promise<{ ok: boolean; error?: string }> {
  try {
    await connectDB();
    const ops = rows.map(r => ({
      updateOne: {
        filter: { employeeId: r.employeeId, date: dayUTC(r.date) },
        update: {
          $set: { ...r, date: dayUTC(r.date), hoursWorked: calcHoursWorked(r.checkIn ?? '', r.checkOut ?? '') },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    }));
    if (ops.length) await Attendance.bulkWrite(ops);
    revalidatePath('/admin/attendance');
    revalidatePath('/admin/payroll');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function deleteAttendance(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await connectDB();
    await Attendance.findByIdAndDelete(id);
    revalidatePath('/admin/attendance');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
