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
  status: 'active' | 'on_leave' | 'resigned';
  baseSalary: number;
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
    ...rest,
  } as unknown as EmployeeRow;
}

export async function getAllEmployees(): Promise<EmployeeRow[]> {
  await connectDB();
  const docs = await Employee.find({}).sort({ status: 1, empId: 1 }).lean();
  return docs.map(d => normalize(d as Record<string, unknown>));
}

export async function getNextEmpId(): Promise<string> {
  await connectDB();
  const last = await Employee.findOne({}).sort({ empId: -1 }).lean() as { empId?: string } | null;
  const lastNum = last?.empId ? Number(last.empId.replace(/\D/g, '')) : 0;
  return `EMP-${String(lastNum + 1).padStart(3, '0')}`;
}
