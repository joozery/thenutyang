// plain async function — no 'use server', safe to call from Server Components during render
import connectDB from './mongodb';
import { Attendance } from '@/models/Attendance';
import { Shift } from '@/models/Shift';

function dayUTC(s: string) {
  return new Date(`${s}T00:00:00.000Z`);
}

export async function generateAttendanceFromShifts(
  date: string,
): Promise<{ created: number }> {
  await connectDB();

  const day  = dayUTC(date);
  const next = new Date(day);
  next.setUTCDate(next.getUTCDate() + 1);

  const shifts = await Shift.find({ date: { $gte: day, $lt: next } }).lean() as {
    _id: unknown;
    employeeId: unknown;
    employeeName: string;
    shiftStart: string;
    shiftEnd: string;
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

  return { created };
}
