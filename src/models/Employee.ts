import { Schema, model, models } from 'mongoose';

export const EMP_ROLES = ['mechanic', 'alignment', 'cashier', 'admin_role', 'manager'] as const;
export type EmpRole = typeof EMP_ROLES[number];

const employeeSchema = new Schema({
  empId:       { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  nickname:    { type: String, default: '' },
  phone:       { type: String, default: '' },
  idCard:      { type: String, default: '' },
  role:        { type: String, enum: EMP_ROLES, required: true, default: 'mechanic' },
  status:      { type: String, enum: ['active', 'on_leave', 'resigned'], default: 'active' },
  baseSalary:  { type: Number, required: true, default: 15000 },
  startDate:   { type: Date, required: true },
  bankAccount: { type: String, default: '' },
  bankName:    { type: String, default: '' },
  address:     { type: String, default: '' },
  note:        { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now },
});

export const Employee = models.Employee || model('Employee', employeeSchema);
