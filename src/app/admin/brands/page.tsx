import { getBrands } from '@/app/actions/brands';
import { BrandsClient } from '@/components/admin/brands-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'จัดการแบรนด์ | Admin' };

export default async function BrandsPage() {
  const brands = await getBrands();
  return <BrandsClient initialBrands={brands} />;
}
