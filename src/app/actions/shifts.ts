'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Shift } from '@/models/Shift';

function dayUTC(s: string) {
  return new Date(`${s}T00:00:00.000Z`);
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

export type ShiftInput = {
  employeeId: string;
  employeeName: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  note?: string;
};

export async function createShifts(
  inputs: ShiftInput[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    await connectDB();
    const ops = inputs.map(i => ({
      updateOne: {
        filter: { employeeId: i.employeeId, date: dayUTC(i.date) },
        update: {
          employeeId:   i.employeeId,
          employeeName: i.employeeName,
          date:         dayUTC(i.date),
          shiftStart:   i.shiftStart,
          shiftEnd:     i.shiftEnd,
          note:         i.note ?? '',
        },
        upsert: true,
      },
    }));
    if (ops.length) await Shift.bulkWrite(ops);
    revalidatePath('/admin/shifts');
    return { ok: true };
  } catch (err) {
    console.error('[createShifts]', err);
    return { ok: false, error: String(err) };
  }
}

export async function deleteShift(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await connectDB();
    await Shift.findByIdAndDelete(id);
    revalidatePath('/admin/shifts');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Copy shifts from one date to another
export async function copyShiftsFromDate(
  fromDate: string,
  toDate: string,
): Promise<{ ok: boolean; copied: number; error?: string }> {
  try {
    await connectDB();
    const fromDay  = dayUTC(fromDate);
    const fromNext = new Date(fromDay); fromNext.setUTCDate(fromNext.getUTCDate() + 1);
    const source   = await Shift.find({ date: { $gte: fromDay, $lt: fromNext } }).lean() as {
      employeeId: string; employeeName: string; shiftStart: string; shiftEnd: string; note: string;
    }[];

    if (!source.length) return { ok: true, copied: 0 };

    const toDay = dayUTC(toDate);
    const ops   = source.map(s => ({
      updateOne: {
        filter: { employeeId: s.employeeId, date: toDay },
        update: { employeeId: s.employeeId, employeeName: s.employeeName, date: toDay, shiftStart: s.shiftStart, shiftEnd: s.shiftEnd, note: s.note },
        upsert: true,
      },
    }));
    await Shift.bulkWrite(ops);
    revalidatePath('/admin/shifts');
    return { ok: true, copied: ops.length };
  } catch (err) {
    return { ok: false, copied: 0, error: String(err) };
  }
}

// Copy an entire week (Mon–Sun) from last week to this week
export async function copyWeek(
  thisWeekStart: string, // Monday of this week (YYYY-MM-DD)
): Promise<{ ok: boolean; copied: number; error?: string }> {
  try {
    await connectDB();
    const thisStart   = dayUTC(thisWeekStart);
    const lastStart   = addDays(thisStart, -7);
    const lastEnd     = addDays(lastStart, 7);

    const source = await Shift.find({ date: { $gte: lastStart, $lt: lastEnd } }).lean() as {
      employeeId: string; employeeName: string; date: Date; shiftStart: string; shiftEnd: string; note: string;
    }[];

    if (!source.length) return { ok: true, copied: 0 };

    const ops = source.map(s => {
      const offset  = Math.round((s.date.getTime() - lastStart.getTime()) / 86400000);
      const newDate = addDays(thisStart, offset);
      return {
        updateOne: {
          filter: { employeeId: s.employeeId, date: newDate },
          update: { employeeId: s.employeeId, employeeName: s.employeeName, date: newDate, shiftStart: s.shiftStart, shiftEnd: s.shiftEnd, note: s.note },
          upsert: true,
        },
      };
    });
    await Shift.bulkWrite(ops);
    revalidatePath('/admin/shifts');
    return { ok: true, copied: ops.length };
  } catch (err) {
    return { ok: false, copied: 0, error: String(err) };
  }
}

// Copy an entire month from last month to this month
export async function copyMonth(
  yearMonth: string, // YYYY-MM of THIS month
): Promise<{ ok: boolean; copied: number; error?: string }> {
  try {
    await connectDB();
    const [y, m] = yearMonth.split('-').map(Number);
    const thisStart = new Date(Date.UTC(y, m - 1, 1));
    const thisEnd   = new Date(Date.UTC(y, m, 1));
    const lastStart = new Date(Date.UTC(y, m - 2, 1));
    const lastEnd   = new Date(Date.UTC(y, m - 1, 1));

    const source = await Shift.find({ date: { $gte: lastStart, $lt: lastEnd } }).lean() as {
      employeeId: string; employeeName: string; date: Date; shiftStart: string; shiftEnd: string; note: string;
    }[];

    if (!source.length) return { ok: true, copied: 0 };

    const ops = source.map(s => {
      const dayOfMonth = s.date.getUTCDate();
      const newDate    = new Date(Date.UTC(y, m - 1, dayOfMonth));
      if (newDate >= thisEnd) return null; // ข้ามวันที่ไม่มีในเดือนนี้
      return {
        updateOne: {
          filter: { employeeId: s.employeeId, date: newDate },
          update: { employeeId: s.employeeId, employeeName: s.employeeName, date: newDate, shiftStart: s.shiftStart, shiftEnd: s.shiftEnd, note: s.note },
          upsert: true,
        },
      };
    }).filter(Boolean);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (ops.length) await Shift.bulkWrite(ops as any[]);
    revalidatePath('/admin/shifts');
    return { ok: true, copied: ops.length };
  } catch (err) {
    return { ok: false, copied: 0, error: String(err) };
  }
}
