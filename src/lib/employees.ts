import connectDB from './mongodb';
import { Employee, EmpRole } from '@/models/Employee';

export type EmployeeRow = {
  id: string;
  empId: string;
  name: string;
  nickname: string;
  phone: string;
  idCard: string;
  role: string;
  employeeType: 'fulltime' | 'parttime';
  status: 'active' | 'on_leave' | 'resigned';
  baseSalary: number;
  dailyRate: number;
  hourlyRate: number;
  shiftStart: string;
  shiftEnd: string;
  lateDeductRate: number;
  otRate: number;
  startDate: string;
  bankAccount: string;
  bankName: string;
  address: string;
  note: string;
};

function normalize(doc: Record<string, unknown>): EmployeeRow {
  const { _id, __v, startDate, createdAt, ...rest } = doc;
  return {
    id: String(_id),
    startDate: startDate ? new Date(startDate as string).toISOString() : '',
    employeeType: (rest.employeeType as string) || 'fulltime',
    dailyRate:    Number(rest.dailyRate ?? 0),
    hourlyRate:   Number(rest.hourlyRate ?? 0),
    shiftStart:   (rest.shiftStart as string) || '09:00',
    shiftEnd:     (rest.shiftEnd as string) || '18:00',
    lateDeductRate: Number(rest.lateDeductRate ?? 300),
    otRate:         Number(rest.otRate ?? 200),
    ...rest,
  } as unknown as EmployeeRow;
}

export async function getAllEmployees(): Promise<EmployeeRow[]> {
  await connectDB();
  const docs = await Employee.find({}).sort({ status: 1, empId: 1 }).lean();
  return docs.map(d => normalize(d as Record<string, unknown>));
}

export async function getActiveEmployees(): Promise<{ id: string; name: string; nickname: string; role: string }[]> {
  await connectDB();
  const docs = await Employee.find({ status: { $in: ['active', 'on_leave'] } }, { _id: 1, name: 1, nickname: 1, role: 1 }).sort({ empId: 1 }).lean();
  return docs.map(d => ({ id: String((d as Record<string, unknown>)._id), name: String((d as Record<string, unknown>).name ?? ''), nickname: String((d as Record<string, unknown>).nickname ?? ''), role: String((d as Record<string, unknown>).role ?? '') }));
}

export async function getNextEmpId(): Promise<string> {
  await connectDB();
  const last = await Employee.findOne({}).sort({ empId: -1 }).lean() as { empId?: string } | null;
  const lastNum = last?.empId ? Number(last.empId.replace(/\D/g, '')) : 0;
  return `EMP-${String(lastNum + 1).padStart(3, '0')}`;
}
