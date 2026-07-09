import connectDB from './mongodb';
import { LeaveRequest, LeaveType } from '@/models/LeaveRequest';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type LeaveRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  deductPay:  boolean;
  deductDays: number;
  deductAmount: number;
  status: LeaveStatus;
  rejReason: string;
  createdAt: string;
};

function dk(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d ?? '').slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(d: any): LeaveRow {
  return {
    id:           String(d._id),
    employeeId:   String(d.employeeId),
    employeeName: d.employeeName ?? '',
    leaveType:    d.leaveType ?? 'other',
    startDate:    dk(d.startDate),
    endDate:      dk(d.endDate),
    days:         d.days ?? 0,
    reason:       d.reason ?? '',
    deductPay:    d.deductPay !== false,
    deductDays:   d.deductDays ?? 0,
    deductAmount: d.deductAmount ?? 0,
    status:       d.status ?? 'pending',
    rejReason:    d.rejReason ?? '',
    createdAt:    d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt ?? ''),
  };
}

export async function getLeaveRequests(status?: LeaveStatus): Promise<LeaveRow[]> {
  await connectDB();
  const query = status ? { status } : {};
  const docs = await LeaveRequest.find(query).sort({ createdAt: -1 }).lean();
  return docs.map(normalize);
}

// สรุปวันลา "ที่อนุมัติแล้ว" ในรอบเดือน ต่อพนักงาน (แยกได้เงิน/ไม่ได้เงิน)
// unpaidAmount = ยอดหักเป็นบาทที่ระบุตรงๆ ในใบลา (ไม่คิดจาก dailyRate)
export type LeaveSummary = { paidDays: number; unpaidDays: number; unpaidAmount: number };

export async function getApprovedLeaveSummary(period: string): Promise<Record<string, LeaveSummary>> {
  await connectDB();
  const [y, m] = period.split('-').map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const monthEnd = new Date(Date.UTC(y, m, 0)); // วันสุดท้ายของเดือน (UTC)

  const docs = await LeaveRequest.find({
    status: 'approved',
    startDate: { $lte: monthEnd },
    endDate: { $gte: monthStart },
  }).lean();

  const map: Record<string, LeaveSummary> = {};
  for (const raw of docs) {
    const d = normalize(raw);
    // นับเฉพาะวันลาที่ตกอยู่ในเดือนนั้น
    const s = new Date(Math.max(new Date(d.startDate).getTime(), monthStart.getTime()));
    const e = new Date(Math.min(new Date(d.endDate).getTime(), monthEnd.getTime()));
    const daysInMonth = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
    if (daysInMonth <= 0) continue;
    const cur = map[d.employeeId] ?? { paidDays: 0, unpaidDays: 0, unpaidAmount: 0 };
    if (d.deductPay && d.deductAmount > 0) {
      // ระบุยอดหักเป็นบาทมาโดยตรง — เฉลี่ยตามสัดส่วนวันที่ตกในเดือนนี้ ไม่หักรายวันซ้ำ
      cur.unpaidAmount += Math.round(d.deductAmount * daysInMonth / Math.max(1, d.days));
      cur.paidDays     += daysInMonth;
    } else {
      const unpaid = d.deductDays > 0 ? Math.min(d.deductDays, daysInMonth) : (d.deductPay ? daysInMonth : 0);
      cur.unpaidDays += unpaid;
      cur.paidDays   += daysInMonth - unpaid;
    }
    map[d.employeeId] = cur;
  }
  return map;
}
