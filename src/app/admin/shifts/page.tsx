import { getShiftsByDate } from '@/lib/shifts';
import { getAllEmployees } from '@/lib/employees';
import { ShiftsClient } from '@/components/admin/shifts-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'เวรงาน | Admin' };

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp      = await searchParams;
  const today   = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  const date    = sp?.date || today;

  const [shifts, employees] = await Promise.all([
    getShiftsByDate(date),
    getAllEmployees(),
  ]);
  const active = employees.filter(e => e.status !== 'resigned');

  return <ShiftsClient date={date} shifts={shifts} employees={active} />;
}
