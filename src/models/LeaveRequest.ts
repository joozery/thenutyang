import { Schema, model, models } from 'mongoose';

export const LEAVE_TYPES = ['sick', 'vacation', 'personal', 'maternity', 'military', 'other'] as const;
export type LeaveType = typeof LEAVE_TYPES[number];

// re-export จาก lib เพื่อให้ server-side code ยังใช้ได้เหมือนเดิม
export { LEAVE_LABELS, LEAVE_QUOTA } from '@/lib/leave-constants';

const leaveRequestSchema = new Schema({
  employeeId:   { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeName: { type: String, default: '' },
  leaveType:    { type: String, enum: LEAVE_TYPES, required: true },
  startDate:    { type: Date, required: true },
  endDate:      { type: Date, required: true },
  days:         { type: Number, required: true },
  reason:       { type: String, default: '' },
  attachmentUrl:{ type: String, default: '' },
  deductPay:    { type: Boolean, default: true }, // true = หักเงิน, false = ไม่หัก
  deductDays:   { type: Number, default: 0 },    // จำนวนวันที่หักจริง (≤ days)
  status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejReason:    { type: String, default: '' },
  approvedBy:   { type: String, default: '' },
  approvedAt:   { type: Date, default: null },
  createdAt:    { type: Date, default: Date.now },
});

export const LeaveRequest = models.LeaveRequest || model('LeaveRequest', leaveRequestSchema);
