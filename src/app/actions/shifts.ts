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

// helper: build a safe $set update (preserves createdAt on existing docs)
function buildShiftOp(
  filter: Record<string, unknown>,
  fields: { employeeId: unknown; employeeName: string; date: Date; shiftStart: string; shiftEnd: string; note: string },
) {
  return {
    updateOne: {
      filter,
      update: {
        $set: {
          employeeId:   fields.employeeId,
          employeeName: fields.employeeName,
          date:         fields.date,
          shiftStart:   fields.shiftStart,
          shiftEnd:     fields.shiftEnd,
          note:         fields.note,
        },
        $setOnInsert: { createdAt: new Date() },
      },
      upsert: true,
    },
  };
}

export async function createShifts(
  inputs: ShiftInput[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    await connectDB();
    const ops = inputs.map(i =>
      buildShiftOp(
        { employeeId: i.employeeId, date: dayUTC(i.date) },
        { employeeId: i.employeeId, employeeName: i.employeeName, date: dayUTC(i.date), shiftStart: i.shiftStart, shiftEnd: i.shiftEnd, note: i.note ?? '' },
      ),
    );
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

// Copy shifts from one date to another date
export async function copyShiftsFromDate(
  fromDate: string,
  toDate: string,
): Promise<{ ok: boolean; copied: number; error?: string }> {
  try {
    await connectDB();
    const fromDay  = dayUTC(fromDate);
    const fromNext = new Date(fromDay); fromNext.setUTCDate(fromNext.getUTCDate() + 1);
    const source   = await Shift.find({ date: { $gte: fromDay, $lt: fromNext } }).lean() as {
      employeeId: unknown; employeeName: string; shiftStart: string; shiftEnd: string; note: string;
    }[];

    if (!source.length) return { ok: true, copied: 0 };

    const toDay = dayUTC(toDate);
    const ops   = source.map(s =>
      buildShiftOp(
        { employeeId: s.employeeId, date: toDay },
        { employeeId: s.employeeId, employeeName: s.employeeName, date: toDay, shiftStart: s.shiftStart, shiftEnd: s.shiftEnd, note: s.note },
      ),
    );
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
    const thisStart = dayUTC(thisWeekStart);
    const lastStart = addDays(thisStart, -7);
    const lastEnd   = addDays(lastStart, 7); // = thisStart (exclusive)

    const source = await Shift.find({ date: { $gte: lastStart, $lt: lastEnd } }).lean() as {
      employeeId: unknown; employeeName: string; date: Date; shiftStart: string; shiftEnd: string; note: string;
    }[];

    if (!source.length) return { ok: true, copied: 0 };

    const ops = source.map(s => {
      // map same weekday offset forward by 7 days
      const offset  = Math.round((s.date.getTime() - lastStart.getTime()) / 86400000);
      const newDate = addDays(thisStart, offset);
      return buildShiftOp(
        { employeeId: s.employeeId, date: newDate },
        { employeeId: s.employeeId, employeeName: s.employeeName, date: newDate, shiftStart: s.shiftStart, shiftEnd: s.shiftEnd, note: s.note },
      );
    });
    await Shift.bulkWrite(ops);
    revalidatePath('/admin/shifts');
    return { ok: true, copied: ops.length };
  } catch (err) {
    return { ok: false, copied: 0, error: String(err) };
  }
}

// Copy an entire month from previous month to this month
export async function copyMonth(
  yearMonth: string, // YYYY-MM of THIS month to copy INTO
): Promise<{ ok: boolean; copied: number; error?: string }> {
  try {
    await connectDB();
    const [y, m] = yearMonth.split('-').map(Number);
    const thisStart = new Date(Date.UTC(y, m - 1, 1));
    const thisEnd   = new Date(Date.UTC(y, m, 1));          // exclusive
    const lastStart = new Date(Date.UTC(y, m - 2, 1));
    const lastEnd   = new Date(Date.UTC(y, m - 1, 1));      // exclusive

    const source = await Shift.find({ date: { $gte: lastStart, $lt: lastEnd } }).lean() as {
      employeeId: unknown; employeeName: string; date: Date; shiftStart: string; shiftEnd: string; note: string;
    }[];

    if (!source.length) return { ok: true, copied: 0 };

    const ops = source
      .map(s => {
        const dayOfMonth = s.date.getUTCDate();
        const newDate    = new Date(Date.UTC(y, m - 1, dayOfMonth));
        if (newDate >= thisEnd) return null; // skip days that don't exist this month (e.g. Feb 29→30)
        return buildShiftOp(
          { employeeId: s.employeeId, date: newDate },
          { employeeId: s.employeeId, employeeName: s.employeeName, date: newDate, shiftStart: s.shiftStart, shiftEnd: s.shiftEnd, note: s.note },
        );
      })
      .filter((op): op is NonNullable<typeof op> => op !== null);

    if (ops.length) await Shift.bulkWrite(ops);
    revalidatePath('/admin/shifts');
    return { ok: true, copied: ops.length };
  } catch (err) {
    return { ok: false, copied: 0, error: String(err) };
  }
}
