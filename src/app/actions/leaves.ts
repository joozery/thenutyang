'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { LeaveRequest, LeaveType } from '@/models/LeaveRequest';

type LeaveInput = {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
};

type Result = { ok: true } | { ok: false; error: string };

// parse 'YYYY-MM-DD' เป็นเที่ยงคืน UTC เสมอ — ให้ round-trip คงที่ทุก timezone
function dayUTC(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

function dayCount(start: string, end: string): number {
  const s = dayUTC(start).getTime();
  const e = dayUTC(end).getTime();
  return Math.max(1, Math.floor((e - s) / 86400000) + 1);
}

export async function createLeave(data: LeaveInput): Promise<Result> {
  try {
    if (new Date(data.endDate) < new Date(data.startDate)) {
      return { ok: false, error: 'วันสิ้นสุดต้องไม่ก่อนวันเริ่ม' };
    }
    await connectDB();
    await LeaveRequest.create({
      employeeId: data.employeeId,
      leaveType:  data.leaveType,
      startDate:  dayUTC(data.startDate),
      endDate:    dayUTC(data.endDate),
      days:       dayCount(data.startDate, data.endDate),
      reason:     data.reason ?? '',
      status:     'pending',
    });
    revalidatePath('/admin/leave');
    return { ok: true };
  } catch (e) {
    console.error('[createLeave]', e);
    return { ok: false, error: String(e) };
  }
}

export async function approveLeave(id: string): Promise<Result> {
  try {
    await connectDB();
    await LeaveRequest.findByIdAndUpdate(id, { status: 'approved', rejReason: '' });
    revalidatePath('/admin/leave');
    revalidatePath('/admin/payroll');
    return { ok: true };
  } catch (e) {
    console.error('[approveLeave]', e);
    return { ok: false, error: String(e) };
  }
}

export async function rejectLeave(id: string, rejReason: string): Promise<Result> {
  try {
    await connectDB();
    await LeaveRequest.findByIdAndUpdate(id, { status: 'rejected', rejReason });
    revalidatePath('/admin/leave');
    revalidatePath('/admin/payroll');
    return { ok: true };
  } catch (e) {
    console.error('[rejectLeave]', e);
    return { ok: false, error: String(e) };
  }
}

export async function deleteLeave(id: string): Promise<Result> {
  try {
    await connectDB();
    await LeaveRequest.findByIdAndDelete(id);
    revalidatePath('/admin/leave');
    return { ok: true };
  } catch (e) {
    console.error('[deleteLeave]', e);
    return { ok: false, error: String(e) };
  }
}
