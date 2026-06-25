import { Schema, model, models } from 'mongoose';
import type { LeaveType } from './LeaveRequest';

// 1 record = 1 พนักงาน / 1 ปี
const leaveBalanceSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  year:       { type: Number, required: true },
  // ใช้ไปแล้วต่อประเภท (วัน)
  sick:      { type: Number, default: 0 },
  vacation:  { type: Number, default: 0 },
  personal:  { type: Number, default: 0 },
  maternity: { type: Number, default: 0 },
  military:  { type: Number, default: 0 },
  other:     { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

export type LeaveBalanceDoc = {
  employeeId: string;
  year: number;
} & Record<LeaveType, number>;

export const LeaveBalance = models.LeaveBalance || model('LeaveBalance', leaveBalanceSchema);
