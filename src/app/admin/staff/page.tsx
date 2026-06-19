import { getAllEmployees } from '@/lib/employees';
import { StaffClient } from '@/components/admin/staff-client';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const employees = await getAllEmployees();
  return <StaffClient initialEmployees={employees} />;
}
