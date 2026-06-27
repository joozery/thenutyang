import { getBrands } from '@/app/actions/brands';
import { BrandsClient } from '@/components/admin/brands-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'จัดการแบรนด์ | Admin' };

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeType = type || 'tires';
  const brands = await getBrands(activeType);
  return <BrandsClient initialBrands={brands} activeType={activeType} />;
}
