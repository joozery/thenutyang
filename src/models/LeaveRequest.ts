import { Schema, model, models } from 'mongoose';

export const LEAVE_TYPES = ['sick', 'vacation', 'personal', 'other'] as const;
export type LeaveType = typeof LEAVE_TYPES[number];

const leaveRequestSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType:  { type: String, enum: LEAVE_TYPES, required: true },
  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true },
  days:       { type: Number, required: true },
  reason:     { type: String, default: '' },
  status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejReason:  { type: String, default: '' },
  createdAt:  { type: Date, default: Date.now },
});

export const LeaveRequest = models.LeaveRequest || model('LeaveRequest', leaveRequestSchema);
