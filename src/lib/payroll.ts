import connectDB from './mongodb';
import { Payslip } from '@/models/Payslip';

export const PAYROLL = {
  LATE_RATE:    300,   // default อัตราหักสาย (ถ้าไม่ได้ตั้งรายบุคคล)
  OT_RATE:      200,   // default อัตรา OT
  WORK_DAYS:    30,
  SSS_RATE:     0.05,
  SSS_BASE_CAP: 15000,
  SSS_MAX:      750,
};

export type PayComputeInput = {
  baseSalary:        number;
  daysAbsent:        number;
  lateBilledHours:   number;
  otBilledHours:     number;
  unpaidLeaveDays:   number;
  leaveDeductAmount: number; // ยอดหักจากใบลาที่ระบุเป็นบาท (บวกเพิ่มจากการหักรายวัน)
  bonus:             number;
  otherDeduct:       number;
  hasSocialSecurity: boolean;
  sssCustomAmount:   number; // หัก สปส. แบบกำหนดเอง (บาท) — 0 = คำนวณ 5% อัตโนมัติ
  lateDeductRate:    number; // อัตรารายบุคคล (บาท/ชม.)
  otRate:            number; // อัตรารายบุคคล (บาท/ชม.)
};

export type PayComputed = {
  otPay:        number;
  absentDeduct: number;
  lateDeduct:   number;
  leaveDeduct:  number;
  sss:          number;
  netPay:       number;
};

// สูตร: ค่าแรง - (สายชม. × lateDeductRate) + (OTชม. × otRate) + โบนัส - ขาด/ลา - สปส. - หักอื่น
export function computePay(i: PayComputeInput): PayComputed {
  const dailyRate = i.baseSalary / PAYROLL.WORK_DAYS;

  const lateDeduct = i.lateBilledHours * i.lateDeductRate;
  const otPay      = i.otBilledHours   * i.otRate;

  const absentDeduct = Math.round(dailyRate * i.daysAbsent);
  const leaveDeduct  = Math.round(dailyRate * i.unpaidLeaveDays + i.leaveDeductAmount);
  const sss = !i.hasSocialSecurity
    ? 0
    : i.sssCustomAmount > 0
    ? Math.round(i.sssCustomAmount)
    : Math.min(Math.round(Math.min(i.baseSalary, PAYROLL.SSS_BASE_CAP) * PAYROLL.SSS_RATE), PAYROLL.SSS_MAX);

  const netPay = Math.round(
    i.baseSalary + otPay + i.bonus
    - absentDeduct - lateDeduct - leaveDeduct - sss - i.otherDeduct,
  );

  return { otPay, absentDeduct, lateDeduct, leaveDeduct, sss, netPay };
}

export type PayslipRow = {
  id:              string;
  employeeId:      string;
  employeeName:    string;
  role:            string;
  period:          string;
  baseSalary:      number;
  daysWorked:      number;
  daysAbsent:      number;
  daysLeavePaid:   number;
  daysLeaveUnpaid: number;
  otMinutes:       number;
  lateMinutes:     number;
  lateDeductRate:  number;
  otRate:          number;
  otPay:           number;
  bonus:           number;
  absentDeduct:    number;
  lateDeduct:      number;
  leaveDeduct:     number;
  leaveDeductAmount: number;
  sss:             number;
  otherDeduct:     number;
  netPay:          number;
  status:          'pending' | 'paid';
  paidAt:          string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(d: any): PayslipRow {
  return {
    id:              String(d._id),
    employeeId:      String(d.employeeId),
    employeeName:    d.employeeName ?? '',
    role:            d.role ?? '',
    period:          d.period ?? '',
    baseSalary:      d.baseSalary ?? 0,
    daysWorked:      d.daysWorked ?? 0,
    daysAbsent:      d.daysAbsent ?? 0,
    daysLeavePaid:   d.daysLeavePaid ?? 0,
    daysLeaveUnpaid: d.daysLeaveUnpaid ?? 0,
    otMinutes:       d.otMinutes ?? 0,
    lateMinutes:     d.lateMinutes ?? 0,
    lateDeductRate:  d.lateDeductRate ?? 300,
    otRate:          d.otRate ?? 200,
    otPay:           d.otPay ?? 0,
    bonus:           d.bonus ?? 0,
    absentDeduct:    d.absentDeduct ?? 0,
    lateDeduct:      d.lateDeduct ?? 0,
    leaveDeduct:     d.leaveDeduct ?? 0,
    leaveDeductAmount: d.leaveDeductAmount ?? 0,
    sss:             d.sss ?? 0,
    otherDeduct:     d.otherDeduct ?? 0,
    netPay:          d.netPay ?? 0,
    status:          d.status ?? 'pending',
    paidAt:          d.paidAt instanceof Date ? d.paidAt.toISOString() : (d.paidAt ?? null),
  };
}

export async function getPayslips(period: string): Promise<PayslipRow[]> {
  await connectDB();
  const docs = await Payslip.find({ period }).sort({ status: 1, employeeName: 1 }).lean();
  return docs.map(normalize);
}
