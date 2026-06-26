import { Schema, model, models } from 'mongoose';

const shiftSchema = new Schema({
  employeeId:   { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeName: { type: String, default: '' },
  date:         { type: Date, required: true },
  shiftStart:   { type: String, required: true }, // HH:mm
  shiftEnd:     { type: String, required: true },
  note:         { type: String, default: '' },
  createdAt:    { type: Date, default: Date.now },
});

shiftSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const Shift = models.Shift || model('Shift', shiftSchema);
