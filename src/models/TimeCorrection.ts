import { Schema, model, models } from 'mongoose';

const timeCorrectionSchema = new Schema({
  employeeId:        { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeName:      { type: String, default: '' },
  attendanceId:      { type: Schema.Types.ObjectId, ref: 'Attendance', required: true },
  date:              { type: Date, required: true },
  originalCheckIn:   { type: String, default: '' },
  originalCheckOut:  { type: String, default: '' },
  requestedCheckIn:  { type: String, required: true },
  requestedCheckOut: { type: String, required: true },
  reason:            { type: String, required: true },
  status:            { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy:        { type: String, default: '' },
  reviewNote:        { type: String, default: '' },
  reviewedAt:        { type: Date, default: null },
  createdAt:         { type: Date, default: Date.now },
});

export const TimeCorrection = models.TimeCorrection || model('TimeCorrection', timeCorrectionSchema);
