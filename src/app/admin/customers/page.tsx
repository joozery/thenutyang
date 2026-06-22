import { getCustomers, mergeCustomerSources } from '@/lib/customers';
import { getCustomerDirectory } from '@/lib/customer-directory';
import { CustomersClient } from '@/components/admin/customers-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ลูกค้า | Admin' };

export default async function CustomersPage() {
  const [bookingCustomers, directoryCustomers] = await Promise.all([
    getCustomers(),
    getCustomerDirectory(),
  ]);

  const customers = mergeCustomerSources(bookingCustomers, directoryCustomers);

  return <CustomersClient customers={customers} />;
}
