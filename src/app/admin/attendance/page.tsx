import { getAttendanceByDate } from '@/lib/attendance';
import { getAllEmployees } from '@/lib/employees';
import { AttendanceClient } from '@/components/admin/attendance-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ลงเวลา | Admin' };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  // "วันนี้" ตามเวลาไทย (กัน server UTC โชว์เป็นเมื่อวาน) — en-CA ให้รูปแบบ YYYY-MM-DD
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  const date = sp?.date || todayKey;

  const [employees, records] = await Promise.all([getAllEmployees(), getAttendanceByDate(date)]);
  const active = employees.filter(e => e.status !== 'resigned');

  return <AttendanceClient date={date} employees={active} records={records} />;
}
