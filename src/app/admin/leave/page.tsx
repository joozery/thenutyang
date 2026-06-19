import { getLeaveRequests } from '@/lib/leaves';
import { getAllEmployees } from '@/lib/employees';
import { LeaveClient } from '@/components/admin/leave-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'การลา | Admin' };

export default async function LeavePage() {
  const [leaves, employees] = await Promise.all([getLeaveRequests(), getAllEmployees()]);
  const active = employees.filter(e => e.status !== 'resigned');
  return <LeaveClient leaves={leaves} employees={active} />;
}
