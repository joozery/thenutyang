import { Schema, model, models } from 'mongoose';

export const ATTENDANCE_STATUSES = ['present', 'late', 'absent', 'leave', 'holiday'] as const;
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

const attendanceSchema = new Schema({
  employeeId:  { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  date:        { type: Date, required: true },
  checkIn:     { type: String, default: '' },
  checkOut:    { type: String, default: '' },
  status:      { type: String, enum: ATTENDANCE_STATUSES, required: true },
  lateMinutes: { type: Number, default: 0 },
  otMinutes:   { type: Number, default: 0 },
  note:        { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now },
});

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const Attendance = models.Attendance || model('Attendance', attendanceSchema);
