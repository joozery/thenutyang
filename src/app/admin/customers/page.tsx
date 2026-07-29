import { getCustomers, getSupplierPartners, mergeCustomerSources } from '@/lib/customers';
import { getCustomerDirectory } from '@/lib/customer-directory';
import { getCarBrands, getCarModels } from '@/app/actions/car-data';
import { CustomersClient } from '@/components/admin/customers-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ลูกค้า | Admin' };

export default async function CustomersPage() {
  const [bookingCustomers, directoryCustomers, supplierPartners, carBrands, carModels] = await Promise.all([
    getCustomers(),
    getCustomerDirectory(),
    getSupplierPartners(),
    getCarBrands(),
    getCarModels(),
  ]);

  const customers = mergeCustomerSources(bookingCustomers, directoryCustomers, supplierPartners);

  return <CustomersClient customers={customers} carBrands={carBrands} carModels={carModels} />;
}
