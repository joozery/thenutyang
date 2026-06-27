import { getAllProductsAdmin } from '@/lib/products';
import { getBrands } from '@/app/actions/brands';
import { ProductsClient } from '@/components/admin/products-client';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const productType = type || 'tires';
  const [products, brands] = await Promise.all([
    getAllProductsAdmin(productType),
    getBrands(),
  ]);
  return <ProductsClient initialProducts={products} initialBrands={brands} activeType={productType} />;
}
