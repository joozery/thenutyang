import { getAttendanceByDate } from '@/lib/attendance';
import { getShiftsByDate } from '@/lib/shifts';
import { getAllEmployees } from '@/lib/employees';
import { generateFromShifts } from '@/app/actions/attendance';
import { AttendanceClient } from '@/components/admin/attendance-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ลงเวลา | Admin' };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp    = await searchParams;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  const date  = sp?.date || today;

  const [shifts, employees] = await Promise.all([
    getShiftsByDate(date),
    getAllEmployees(),
  ]);

  if (shifts.length > 0) {
    await generateFromShifts(date);
  }

  const records = await getAttendanceByDate(date);

  return (
    <AttendanceClient
      date={date}
      records={records}
      hasShifts={shifts.length > 0}
      employees={employees}
    />
  );
}
