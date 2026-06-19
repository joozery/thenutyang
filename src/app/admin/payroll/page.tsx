import { getPayslips } from '@/lib/payroll';
import { getAllEmployees } from '@/lib/employees';
import { PayrollClient } from '@/components/admin/payroll-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'เงินเดือน | Admin' };

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  // รอบเดือนปัจจุบันตามเวลาไทย (กัน server UTC คลาดเคลื่อนช่วงต้น/ปลายเดือน)
  const defaultPeriod = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }).slice(0, 7);
  const period = sp?.period || defaultPeriod;

  const [payslips, employees] = await Promise.all([getPayslips(period), getAllEmployees()]);
  const activeEmployees = employees.filter(e => e.status !== 'resigned').length;

  return <PayrollClient period={period} payslips={payslips} activeEmployees={activeEmployees} />;
}
