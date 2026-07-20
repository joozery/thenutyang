import { getCustomers, getSupplierPartners, mergeCustomerSources, getDocSpendByTaxId } from '@/lib/customers';
import { getCustomerDirectory } from '@/lib/customer-directory';
import { getCarBrands, getCarModels } from '@/app/actions/car-data';
import { CustomersClient } from '@/components/admin/customers-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ลูกค้า | Admin' };

export default async function CustomersPage() {
  const [bookingCustomers, directoryCustomers, supplierPartners, carBrands, carModels, taxIdSpend] = await Promise.all([
    getCustomers(),
    getCustomerDirectory(),
    getSupplierPartners(),
    getCarBrands(),
    getCarModels(),
    getDocSpendByTaxId(),
  ]);

  const customers = mergeCustomerSources(bookingCustomers, directoryCustomers, supplierPartners);

  // เพิ่มยอดจากเอกสารที่ไม่มีเบอร์ แต่มี taxId — ใช้จับคู่กับลูกค้าใน directory
  for (const c of customers) {
    if (!c.taxId || !c.id) continue;
    const key = c.taxId.replace(/\D/g, '');
    const extra = key ? taxIdSpend.get(key) : undefined;
    if (!extra) continue;
    c.totalSpent += extra.spent;
    c.totalBills += extra.bills;
    if (extra.lastVisit && (!c.lastVisit || extra.lastVisit.toISOString() > c.lastVisit)) {
      c.lastVisit = extra.lastVisit.toISOString();
    }
    c.tag = c.totalSpent >= 50000 ? 'VIP' : c.totalBills <= 1 ? 'ใหม่' : 'ปกติ';
  }

  return <CustomersClient customers={customers} carBrands={carBrands} carModels={carModels} />;
}
