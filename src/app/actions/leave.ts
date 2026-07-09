'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { LeaveRequest, LEAVE_QUOTA } from '@/models/LeaveRequest';
import { LeaveBalance } from '@/models/LeaveBalance';
import type { LeaveType } from '@/models/LeaveRequest';

type Result = { ok: true } | { ok: false; error: string };

export async function createLeaveRequest(input: {
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  deductPay?:  boolean; // default จาก LEAVE_QUOTA ถ้าไม่ส่งมา
  deductDays?: number;  // จำนวนวันที่หักจริง (0 = ไม่หัก)
  deductAmount?: number; // ยอดหักเป็นบาท (0 = คิดตามวันลา)
}): Promise<Result> {
  try {
    await connectDB();
    const deductPay = input.deductPay !== undefined
      ? input.deductPay
      : (LEAVE_QUOTA[input.leaveType]?.deductPay ?? true);
    await LeaveRequest.create({
      ...input,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      deductPay,
      deductDays: input.deductDays ?? 0,
      deductAmount: deductPay ? Math.max(0, input.deductAmount ?? 0) : 0,
      status: 'pending',
    });
    revalidatePath('/admin/leave');
    return { ok: true };
  } catch (e) {
    console.error('[createLeaveRequest]', e);
    return { ok: false, error: String(e) };
  }
}

export async function approveLeave(id: string, approvedBy = 'ผู้จัดการ'): Promise<Result> {
  try {
    await connectDB();
    const req = await LeaveRequest.findById(id).lean() as {
      employeeId: string; leaveType: LeaveType; days: number; startDate: Date;
    } | null;
    if (!req) return { ok: false, error: 'ไม่พบคำขอลา' };

    const year = new Date(req.startDate).getFullYear();
    const quota = LEAVE_QUOTA[req.leaveType]?.quota ?? 0;

    // ดึงยอดที่ใช้ไปแล้ว
    const balance = await LeaveBalance.findOne({ employeeId: req.employeeId, year }).lean() as Record<string, number> | null;
    const used = balance?.[req.leaveType] ?? 0;

    if (quota > 0 && used + req.days > quota) {
      return { ok: false, error: `สิทธิ์ลา${req.leaveType}ไม่เพียงพอ (ใช้ไป ${used}/${quota} วัน)` };
    }

    await LeaveRequest.findByIdAndUpdate(id, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    });

    // บวกยอดที่ใช้ไป
    await LeaveBalance.findOneAndUpdate(
      { employeeId: req.employeeId, year },
      { $inc: { [req.leaveType]: req.days }, updatedAt: new Date() },
      { upsert: true },
    );

    revalidatePath('/admin/leave');
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
    return { ok: true };
  } catch (e) {
    console.error('[rejectLeave]', e);
    return { ok: false, error: String(e) };
  }
}

export async function deleteLeaveRequest(id: string): Promise<Result> {
  try {
    await connectDB();
    await LeaveRequest.findByIdAndDelete(id);
    revalidatePath('/admin/leave');
    return { ok: true };
  } catch (e) {
    console.error('[deleteLeaveRequest]', e);
    return { ok: false, error: String(e) };
  }
}
