import connectDB from './mongodb';
import { Attendance, AttendanceStatus } from '@/models/Attendance';

export {
  calcLateMinutes, calcOTMinutes, minutesToBilledHours,
  calcLateDeduct, calcOTPay, calcParttimeOTPay,
} from './attendance-calc';

export type AttendanceRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  date: string;         // 'YYYY-MM-DD'
  shiftStart: string;
  shiftEnd: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  lateMinutes: number;
  otMinutes: number;
  hoursWorked: number;
  note: string;
};

export type AttendanceSummary = {
  daysPresent: number;
  daysAbsent: number;
  daysLeave: number;
  otMinutes: number;
  lateMinutes: number;
  hoursWorked: number;
};

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(d: any): AttendanceRow {
  return {
    id:           String(d._id),
    employeeId:   String(d.employeeId),
    employeeName: d.employeeName ?? '',
    shiftId:      d.shiftId ? String(d.shiftId) : '',
    date:         d.date instanceof Date ? toDateKey(d.date) : String(d.date ?? '').slice(0, 10),
    shiftStart:   d.shiftStart ?? '',
    shiftEnd:     d.shiftEnd ?? '',
    checkIn:      d.checkIn ?? '',
    checkOut:     d.checkOut ?? '',
    status:       d.status ?? 'pending',
    lateMinutes:  d.lateMinutes ?? 0,
    otMinutes:    d.otMinutes ?? 0,
    hoursWorked:  d.hoursWorked ?? 0,
    note:         d.note ?? '',
  };
}

function monthRange(period: string): { start: Date; end: Date } {
  const [y, m] = period.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end   = new Date(Date.UTC(y, m, 1));
  return { start, end };
}

export async function getAttendanceByDate(date: string): Promise<AttendanceRow[]> {
  await connectDB();
  const day  = new Date(`${date}T00:00:00.000Z`);
  const next = new Date(day); next.setUTCDate(next.getUTCDate() + 1);
  const docs = await Attendance.find({ date: { $gte: day, $lt: next } }).sort({ employeeName: 1 }).lean();
  return docs.map(normalize);
}

export async function getAttendanceByMonth(period: string): Promise<AttendanceRow[]> {
  await connectDB();
  const { start, end } = monthRange(period);
  const docs = await Attendance.find({ date: { $gte: start, $lt: end } }).sort({ date: 1 }).lean();
  return docs.map(normalize);
}

export async function getAttendanceSummary(period: string): Promise<Record<string, AttendanceSummary>> {
  const rows = await getAttendanceByMonth(period);
  const map: Record<string, AttendanceSummary> = {};
  for (const r of rows) {
    const s = map[r.employeeId] ?? { daysPresent: 0, daysAbsent: 0, daysLeave: 0, otMinutes: 0, lateMinutes: 0, hoursWorked: 0 };
    if (r.status === 'present' || r.status === 'late') s.daysPresent += 1;
    else if (r.status === 'absent') s.daysAbsent += 1;
    else if (r.status === 'leave') s.daysLeave += 1;
    s.otMinutes   += r.otMinutes;
    s.lateMinutes += r.lateMinutes;
    s.hoursWorked += r.hoursWorked;
    map[r.employeeId] = s;
  }
  return map;
}
