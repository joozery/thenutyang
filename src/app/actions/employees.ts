'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Employee, EmpRole } from '@/models/Employee';
import { getNextEmpId } from '@/lib/employees';

type EmployeeInput = {
  name: string;
  nickname?: string;
  phone?: string;
  idCard?: string;
  role: EmpRole;
  status?: 'active' | 'on_leave' | 'resigned';
  baseSalary: number;
  startDate: string;
  bankAccount?: string;
  bankName?: string;
  address?: string;
  note?: string;
};

type Result = { ok: true } | { ok: false; error: string };

export async function createEmployee(data: EmployeeInput): Promise<Result> {
  try {
    await connectDB();
    const empId = await getNextEmpId();
    await Employee.create({
      ...data,
      empId,
      startDate: new Date(data.startDate),
    });
    revalidatePath('/admin/staff');
    return { ok: true };
  } catch (e) {
    console.error('[createEmployee]', e);
    return { ok: false, error: String(e) };
  }
}

export async function updateEmployee(id: string, data: EmployeeInput): Promise<Result> {
  try {
    await connectDB();
    await Employee.findByIdAndUpdate(id, {
      ...data,
      startDate: new Date(data.startDate),
    });
    revalidatePath('/admin/staff');
    return { ok: true };
  } catch (e) {
    console.error('[updateEmployee]', e);
    return { ok: false, error: String(e) };
  }
}

export async function deleteEmployee(id: string): Promise<Result> {
  try {
    await connectDB();
    await Employee.findByIdAndDelete(id);
    revalidatePath('/admin/staff');
    return { ok: true };
  } catch (e) {
    console.error('[deleteEmployee]', e);
    return { ok: false, error: String(e) };
  }
}
