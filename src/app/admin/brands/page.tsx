import { getBrands } from '@/app/actions/brands';
import { getProductTypes } from '@/app/actions/productTypes';
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
  const [brands, productTypes] = await Promise.all([
    getBrands(activeType),
    getProductTypes(),
  ]);
  return <BrandsClient initialBrands={brands} initialProductTypes={productTypes} activeType={activeType} />;
}
