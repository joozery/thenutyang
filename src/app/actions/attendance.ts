'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Attendance, AttendanceStatus } from '@/models/Attendance';

type AttendanceInput = {
  employeeId: string;
  date: string;        // 'YYYY-MM-DD'
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  lateMinutes?: number;
  otMinutes?: number;
  note?: string;
};

type Result = { ok: true } | { ok: false; error: string };

// parse 'YYYY-MM-DD' เป็นเที่ยงคืน UTC เสมอ — ให้ round-trip คงที่ทุก timezone
function dayUTC(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

// บันทึก/แก้ไขการลงเวลา 1 คน/1 วัน (upsert ตาม employeeId+date)
export async function saveAttendance(data: AttendanceInput): Promise<Result> {
  try {
    await connectDB();
    const day = dayUTC(data.date);
    await Attendance.findOneAndUpdate(
      { employeeId: data.employeeId, date: day },
      {
        employeeId:  data.employeeId,
        date:        day,
        status:      data.status,
        checkIn:     data.checkIn ?? '',
        checkOut:    data.checkOut ?? '',
        lateMinutes: data.lateMinutes ?? 0,
        otMinutes:   data.otMinutes ?? 0,
        note:        data.note ?? '',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    revalidatePath('/admin/attendance');
    revalidatePath('/admin/payroll');
    return { ok: true };
  } catch (e) {
    console.error('[saveAttendance]', e);
    return { ok: false, error: String(e) };
  }
}

// บันทึกทั้งวันทีเดียว (หลายคน) — ใช้ปุ่ม "บันทึกทั้งหมด"
export async function saveAttendanceBulk(rows: AttendanceInput[]): Promise<Result> {
  try {
    await connectDB();
    const ops = rows.map(r => ({
      updateOne: {
        filter: { employeeId: r.employeeId, date: dayUTC(r.date) },
        update: {
          employeeId:  r.employeeId,
          date:        dayUTC(r.date),
          status:      r.status,
          checkIn:     r.checkIn ?? '',
          checkOut:    r.checkOut ?? '',
          lateMinutes: r.lateMinutes ?? 0,
          otMinutes:   r.otMinutes ?? 0,
          note:        r.note ?? '',
        },
        upsert: true,
      },
    }));
    if (ops.length) await Attendance.bulkWrite(ops);
    revalidatePath('/admin/attendance');
    revalidatePath('/admin/payroll');
    return { ok: true };
  } catch (e) {
    console.error('[saveAttendanceBulk]', e);
    return { ok: false, error: String(e) };
  }
}

export async function deleteAttendance(id: string): Promise<Result> {
  try {
    await connectDB();
    await Attendance.findByIdAndDelete(id);
    revalidatePath('/admin/attendance');
    revalidatePath('/admin/payroll');
    return { ok: true };
  } catch (e) {
    console.error('[deleteAttendance]', e);
    return { ok: false, error: String(e) };
  }
}
