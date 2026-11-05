import { queryCustomerList } from '@/lib/customer-list';
import { getCarBrands, getCarModels } from '@/app/actions/car-data';
import { CustomersClient } from '@/components/admin/customers-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ลูกค้า | Admin' };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; source?: string; relation?: string; page?: string }>;
}) {
  const { q, tag, source, relation, page } = await searchParams;
  const filters = { q: q ?? '', tag: tag ?? 'ทั้งหมด', source: source ?? 'ทั้งหมด', relation: relation ?? 'ทั้งหมด' };

  const [list, carBrands, carModels] = await Promise.all([
    queryCustomerList({ ...filters, page: Number(page) || 1 }),
    getCarBrands(),
    getCarModels(),
  ]);

  return <CustomersClient list={list} filters={filters} carBrands={carBrands} carModels={carModels} />;
}
