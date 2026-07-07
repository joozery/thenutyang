import { Schema, model, models } from 'mongoose';

export const EMP_ROLES = ['mechanic', 'alignment', 'cashier', 'admin_role', 'manager'] as const;
export type EmpRole = typeof EMP_ROLES[number];

const employeeSchema = new Schema({
  empId:        { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  nickname:     { type: String, default: '' },
  phone:        { type: String, default: '' },
  idCard:       { type: String, default: '' },
  role:         { type: String, required: true, default: 'ช่างยาง' },
  employeeType: { type: String, enum: ['fulltime', 'parttime'], default: 'fulltime' },
  status:       { type: String, enum: ['active', 'on_leave', 'resigned'], default: 'active' },
  // เงินเดือน / ค่าจ้าง
  baseSalary:   { type: Number, default: 15000 },  // พนักงานประจำ
  dailyRate:    { type: Number, default: 0 },       // พาร์ทไทม์รายวัน
  hourlyRate:   { type: Number, default: 0 },       // พาร์ทไทม์รายชั่วโมง
  // เวรงาน
  shiftStart:   { type: String, default: '09:00' }, // HH:mm
  shiftEnd:     { type: String, default: '18:00' }, // HH:mm
  // อัตราค่าปรับ / OT
  lateDeductRate: { type: Number, default: 300 },   // บาท/ชั่วโมง
  otRate:         { type: Number, default: 200 },   // บาท/ชั่วโมง (ประจำ) | ถ้า parttime จะใช้ hourlyRate × 1.5
  hasSocialSecurity: { type: Boolean, default: true }, // ประกันสังคม
  sssCustomAmount:   { type: Number, default: 0 },     // หักประกันสังคมแบบกำหนดเอง (บาท/เดือน) — 0 = คำนวณ 5% อัตโนมัติ
  startDate:    { type: Date, required: true },
  bankAccount:  { type: String, default: '' },
  bankName:     { type: String, default: '' },
  address:      { type: String, default: '' },
  note:         { type: String, default: '' },
  createdAt:    { type: Date, default: Date.now },
});

delete models.Employee;
export const Employee = model('Employee', employeeSchema);
