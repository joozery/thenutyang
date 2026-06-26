import { Schema, model, models } from 'mongoose';

// เก็บประวัติการจ่ายเงินเดือนรายเดือนต่อพนักงาน 1 record = 1 คน/1 รอบ
const payslipSchema = new Schema({
  employeeId:   { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeName: { type: String, required: true },
  role:         { type: String, default: '' },
  period:       { type: String, required: true }, // 'YYYY-MM'

  baseSalary:   { type: Number, required: true, default: 0 },

  // ดึงจากการลงเวลา (Attendance) ในรอบนั้น
  daysWorked:   { type: Number, default: 0 },
  daysAbsent:   { type: Number, default: 0 },
  daysLeavePaid:   { type: Number, default: 0 },
  daysLeaveUnpaid: { type: Number, default: 0 },
  otMinutes:    { type: Number, default: 0 },
  lateMinutes:  { type: Number, default: 0 },

  // อัตรารายบุคคลที่ใช้คิดในรอบนี้
  lateDeductRate: { type: Number, default: 300 },
  otRate:         { type: Number, default: 200 },

  // เงินเพิ่ม
  otPay:        { type: Number, default: 0 },
  bonus:        { type: Number, default: 0 },

  // เงินหัก
  absentDeduct: { type: Number, default: 0 },
  lateDeduct:   { type: Number, default: 0 },
  leaveDeduct:  { type: Number, default: 0 },
  sss:          { type: Number, default: 0 }, // ประกันสังคม 5%
  otherDeduct:  { type: Number, default: 0 },

  netPay:       { type: Number, default: 0 },
  status:       { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidAt:       { type: Date, default: null },
  createdAt:    { type: Date, default: Date.now },
});

payslipSchema.index({ employeeId: 1, period: 1 }, { unique: true });

export const Payslip = models.Payslip || model('Payslip', payslipSchema);
