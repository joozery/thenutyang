import { getLeaveRequests } from '@/lib/leave';
import { getAllEmployees } from '@/lib/employees';
import { LeaveClient } from '@/components/admin/leave-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'จัดการลางาน | Admin' };

export default async function LeavePage() {
  const [requests, employees] = await Promise.all([
    getLeaveRequests(),
    getAllEmployees(),
  ]);
  const active = employees.filter(e => e.status !== 'resigned');
  return <LeaveClient requests={requests} employees={active} />;
}
