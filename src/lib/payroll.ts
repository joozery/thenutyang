import connectDB from './mongodb';
import { Payslip } from '@/models/Payslip';
import { minutesToBilledHours } from './attendance-calc';

// ── ค่าคงที่การคำนวณ (อิงมาตรฐานไทย) ──────────────────────────────
export const PAYROLL = {
  WORK_DAYS:    30,    // ฐานคิดต่อวัน = เงินเดือน / 30
  SSS_RATE:     0.05,  // ประกันสังคม 5%
  SSS_BASE_CAP: 15000, // ฐานคิด สปส. สูงสุด
  SSS_MAX:      750,   // หักสูงสุด 750
};

export type PayComputeInput = {
  baseSalary:    number;
  employeeType:  'fulltime' | 'parttime';
  hourlyRate:    number;    // พาร์ทไทม์: ใช้คิด OT ×1.5
  lateDeductRate: number;  // บาท/ชม. หักสาย (ตั้งไว้ใน Employee)
  otRate:        number;   // บาท/ชม. OT ประจำ (ตั้งไว้ใน Employee)
  daysAbsent:    number;
  lateMinutes:   number;   // raw นาที — grace period ≤10 น. คิดใน computePay
  otMinutes:     number;
  unpaidLeaveDays: number;
  bonus:         number;
  otherDeduct:   number;
};

export type PayComputed = {
  otPay:        number;
  absentDeduct: number;
  lateDeduct:   number;
  leaveDeduct:  number;
  sss:          number;
  netPay:       number;
};

// คำนวณเงินเดือนสุทธิ — ใช้ grace period เดียวกันกับหน้าลงเวลา
export function computePay(i: PayComputeInput): PayComputed {
  const dailyRate = i.baseSalary / PAYROLL.WORK_DAYS;

  // สาย: ≤10 นาที = 0, >10 นาที = ceil ทุก 60 นาที × lateDeductRate
  const lateBilledHours = minutesToBilledHours(i.lateMinutes);
  const lateDeduct      = Math.round(lateBilledHours * i.lateDeductRate);

  // OT: ≤10 นาที = 0, >10 นาที = ceil ทุก 60 นาที × otRate (ประจำ) หรือ hourlyRate×1.5 (พาร์ทไทม์)
  const otBilledHours = minutesToBilledHours(i.otMinutes);
  const otPay = i.employeeType === 'parttime'
    ? Math.round(otBilledHours * i.hourlyRate * 1.5)
    : Math.round(otBilledHours * i.otRate);

  const absentDeduct = Math.round(dailyRate * i.daysAbsent);
  const leaveDeduct  = Math.round(dailyRate * i.unpaidLeaveDays);
  const sss          = Math.min(
    Math.round(Math.min(i.baseSalary, PAYROLL.SSS_BASE_CAP) * PAYROLL.SSS_RATE),
    PAYROLL.SSS_MAX,
  );

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
  otPay:           number;
  bonus:           number;
  absentDeduct:    number;
  lateDeduct:      number;
  leaveDeduct:     number;
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
    otPay:           d.otPay ?? 0,
    bonus:           d.bonus ?? 0,
    absentDeduct:    d.absentDeduct ?? 0,
    lateDeduct:      d.lateDeduct ?? 0,
    leaveDeduct:     d.leaveDeduct ?? 0,
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
