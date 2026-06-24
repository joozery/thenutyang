import { notFound } from 'next/navigation';
import { getCustomerDetail } from '@/lib/customer-detail';
import { getCarBrands, getCarModels } from '@/app/actions/car-data';
import { CustomerDetailClient } from '@/components/admin/customer-detail-client';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, carBrands, carModels] = await Promise.all([
    getCustomerDetail(id),
    getCarBrands(),
    getCarModels(),
  ]);

  if (!data) notFound();

  return <CustomerDetailClient data={data} carBrands={carBrands} carModels={carModels} />;
}
