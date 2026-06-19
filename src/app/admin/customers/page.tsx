import { getCustomers } from '@/lib/customers';
import { CustomersClient } from '@/components/admin/customers-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ลูกค้า | Admin' };

export default async function CustomersPage() {
  const customers = await getCustomers();
  return <CustomersClient customers={customers} />;
}
