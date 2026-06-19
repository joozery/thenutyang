import { getAllProductsAdmin } from '@/lib/products';
import { getBrands } from '@/app/actions/brands';
import { ProductsClient } from '@/components/admin/products-client';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [products, brands] = await Promise.all([getAllProductsAdmin(), getBrands()]);
  return <ProductsClient initialProducts={products} initialBrands={brands} />;
}
