import connectDB from './mongodb';
import { LeaveRequest, LEAVE_LABELS, LEAVE_QUOTA } from '@/models/LeaveRequest';
import { LeaveBalance } from '@/models/LeaveBalance';
import type { LeaveType } from '@/models/LeaveRequest';

export type LeaveRequestRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  leaveLabel: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  rejReason: string;
  approvedBy: string;
  createdAt: string;
};

export type LeaveBalanceSummary = {
  leaveType: LeaveType;
  label: string;
  quota: number;
  used: number;
  remaining: number;
  deductPay: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRow(d: any): LeaveRequestRow {
  return {
    id:           String(d._id),
    employeeId:   String(d.employeeId),
    employeeName: d.employeeName ?? '',
    leaveType:    d.leaveType,
    leaveLabel:   LEAVE_LABELS[d.leaveType as LeaveType] ?? d.leaveType,
    startDate:    d.startDate instanceof Date ? d.startDate.toISOString().slice(0, 10) : String(d.startDate ?? '').slice(0, 10),
    endDate:      d.endDate instanceof Date ? d.endDate.toISOString().slice(0, 10) : String(d.endDate ?? '').slice(0, 10),
    days:         d.days ?? 1,
    reason:       d.reason ?? '',
    status:       d.status ?? 'pending',
    rejReason:    d.rejReason ?? '',
    approvedBy:   d.approvedBy ?? '',
    createdAt:    d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt ?? ''),
  };
}

export async function getLeaveRequests(filter?: { employeeId?: string; status?: string }): Promise<LeaveRequestRow[]> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filter?.employeeId) query.employeeId = filter.employeeId;
  if (filter?.status) query.status = filter.status;
  const docs = await LeaveRequest.find(query).sort({ createdAt: -1 }).lean();
  return docs.map(normalizeRow);
}

export async function getLeaveBalance(employeeId: string, year: number): Promise<LeaveBalanceSummary[]> {
  await connectDB();
  const balance = await LeaveBalance.findOne({ employeeId, year }).lean() as Record<string, number> | null;
  return (Object.keys(LEAVE_LABELS) as LeaveType[]).map(t => ({
    leaveType: t,
    label: LEAVE_LABELS[t],
    quota: LEAVE_QUOTA[t].quota,
    used: balance?.[t] ?? 0,
    remaining: Math.max(0, LEAVE_QUOTA[t].quota - (balance?.[t] ?? 0)),
    deductPay: LEAVE_QUOTA[t].deductPay,
  }));
}
