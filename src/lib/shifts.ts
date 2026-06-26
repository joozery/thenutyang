import connectDB from './mongodb';
import { Shift } from '@/models/Shift';

export type ShiftRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;      // YYYY-MM-DD
  shiftStart: string;
  shiftEnd: string;
  note: string;
};

function dayUTC(s: string) {
  return new Date(`${s}T00:00:00.000Z`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(d: any): ShiftRow {
  return {
    id:           String(d._id),
    employeeId:   String(d.employeeId),
    employeeName: d.employeeName ?? '',
    date:         d.date instanceof Date ? d.date.toISOString().slice(0, 10) : String(d.date ?? '').slice(0, 10),
    shiftStart:   d.shiftStart ?? '',
    shiftEnd:     d.shiftEnd ?? '',
    note:         d.note ?? '',
  };
}

export async function getShiftsByDate(date: string): Promise<ShiftRow[]> {
  await connectDB();
  const day  = dayUTC(date);
  const next = new Date(day); next.setUTCDate(next.getUTCDate() + 1);
  const docs = await Shift.find({ date: { $gte: day, $lt: next } }).sort({ employeeName: 1 }).lean();
  return docs.map(normalize);
}

export async function getShiftsByRange(from: string, to: string): Promise<ShiftRow[]> {
  await connectDB();
  const start = dayUTC(from);
  const end   = new Date(`${to}T23:59:59.999Z`);
  const docs  = await Shift.find({ date: { $gte: start, $lte: end } }).sort({ date: 1, employeeName: 1 }).lean();
  return docs.map(normalize);
}
