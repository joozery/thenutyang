import { notFound } from 'next/navigation';
import { getCustomerDetail } from '@/lib/customer-detail';
import { CustomerDetailClient } from '@/components/admin/customer-detail-client';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCustomerDetail(id);
  if (!data) notFound();

  return <CustomerDetailClient data={data} />;
}
