'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Payslip } from '@/models/Payslip';
import { Employee } from '@/models/Employee';
import { computePay } from '@/lib/payroll';
import { getAttendanceSummary } from '@/lib/attendance';
import { getApprovedLeaveSummary } from '@/lib/leaves';

type Result = { ok: true } | { ok: false; error: string };

const ROLE_LABELS: Record<string, string> = {
  mechanic: 'ช่างยาง', alignment: 'ช่างตั้งศูนย์', cashier: 'แคชเชียร์',
  admin_role: 'ธุรการ / บัญชี', manager: 'ผู้จัดการ',
};

// สร้าง/คำนวณรอบเงินเดือนใหม่จากการลงเวลา + การลา
export async function generatePayroll(period: string): Promise<Result> {
  try {
    await connectDB();
    const [employees, attMap, leaveMap, existing] = await Promise.all([
      Employee.find({ status: { $ne: 'resigned' } }).lean(),
      getAttendanceSummary(period),
      getApprovedLeaveSummary(period),
      Payslip.find({ period }).lean(),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existMap = new Map<string, any>(existing.map((p: any) => [String(p.employeeId), p]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops = employees.map((emp: any) => {
      const id   = String(emp._id);
      const prev = existMap.get(id);
      if (prev?.status === 'paid') return null;

      const att        = attMap[id]   ?? { daysPresent: 0, daysAbsent: 0, daysLeave: 0, otMinutes: 0, lateMinutes: 0, lateBilledHours: 0, otBilledHours: 0 };
      const lv         = leaveMap[id] ?? { paidDays: 0, unpaidDays: 0 };
      const baseSalary    = Number(emp.baseSalary ?? 0);
      const lateDeductRate = Number(emp.lateDeductRate ?? 300);
      const otRate         = Number(emp.otRate ?? 200);
      const bonus          = prev?.bonus       ?? 0;
      const otherDeduct    = prev?.otherDeduct ?? 0;

      const c = computePay({
        baseSalary,
        daysAbsent:        att.daysAbsent,
        lateBilledHours:   att.lateBilledHours,
        otBilledHours:     att.otBilledHours,
        unpaidLeaveDays:   lv.unpaidDays,
        bonus,
        otherDeduct,
        hasSocialSecurity: emp.hasSocialSecurity !== false,
        lateDeductRate,
        otRate,
      });

      return {
        updateOne: {
          filter: { employeeId: id, period },
          update: {
            $set: {
              employeeId:      id,
              employeeName:    emp.name,
              role:            ROLE_LABELS[emp.role] ?? emp.role ?? '',
              period,
              baseSalary,
              lateDeductRate,
              otRate,
              daysWorked:      att.daysPresent,
              daysAbsent:      att.daysAbsent,
              daysLeavePaid:   lv.paidDays,
              daysLeaveUnpaid: lv.unpaidDays,
              otMinutes:       att.otMinutes,
              lateMinutes:     att.lateMinutes,
              bonus,
              otherDeduct,
              status:          'pending',
              ...c,
            },
            $setOnInsert: { createdAt: new Date() },
          },
          upsert: true,
        },
      };
    }).filter(Boolean);

    if (ops.length) await Payslip.bulkWrite(ops as Parameters<typeof Payslip.bulkWrite>[0]);
    revalidatePath('/admin/payroll');
    return { ok: true };
  } catch (e) {
    console.error('[generatePayroll]', e);
    return { ok: false, error: String(e) };
  }
}

// แก้ไขโบนัส / หักอื่นๆ แล้วคำนวณ net ใหม่
export async function updatePayslip(id: string, bonus: number, otherDeduct: number): Promise<Result> {
  try {
    await connectDB();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = await Payslip.findById(id).lean() as any;
    if (!p) return { ok: false, error: 'ไม่พบรายการ' };
    if (p.status === 'paid') return { ok: false, error: 'รายการนี้จ่ายแล้ว แก้ไขไม่ได้' };

    const [attMap, emp] = await Promise.all([
      getAttendanceSummary(p.period),
      Employee.findById(p.employeeId).lean() as Promise<{ hasSocialSecurity?: boolean; lateDeductRate?: number; otRate?: number } | null>,
    ]);
    const att            = attMap[String(p.employeeId)] ?? { lateBilledHours: 0, otBilledHours: 0 };
    const lateDeductRate = Number(emp?.lateDeductRate ?? p.lateDeductRate ?? 300);
    const otRate         = Number(emp?.otRate ?? p.otRate ?? 200);

    const c = computePay({
      baseSalary:        p.baseSalary ?? 0,
      daysAbsent:        p.daysAbsent ?? 0,
      lateBilledHours:   att.lateBilledHours,
      otBilledHours:     att.otBilledHours,
      unpaidLeaveDays:   p.daysLeaveUnpaid ?? 0,
      bonus,
      otherDeduct,
      hasSocialSecurity: emp?.hasSocialSecurity !== false,
      lateDeductRate,
      otRate,
    });

    await Payslip.findByIdAndUpdate(id, { $set: { bonus, otherDeduct, lateDeductRate, otRate, ...c } });
    revalidatePath('/admin/payroll');
    return { ok: true };
  } catch (e) {
    console.error('[updatePayslip]', e);
    return { ok: false, error: String(e) };
  }
}

export async function markPaid(id: string): Promise<Result> {
  try {
    await connectDB();
    await Payslip.findByIdAndUpdate(id, { $set: { status: 'paid', paidAt: new Date() } });
    revalidatePath('/admin/payroll');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function markAllPaid(period: string): Promise<Result> {
  try {
    await connectDB();
    await Payslip.updateMany({ period, status: 'pending' }, { $set: { status: 'paid', paidAt: new Date() } });
    revalidatePath('/admin/payroll');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
