import { getAllProductsAdmin } from '@/lib/products';
import { getBrands } from '@/app/actions/brands';
import { getCategories } from '@/app/actions/categories';
import { getProductTypes } from '@/app/actions/productTypes';
import { ProductsClient } from '@/components/admin/products-client';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const productType = type || 'tires';
  const [products, brands, categories, productTypes] = await Promise.all([
    getAllProductsAdmin(productType),
    getBrands(productType),
    getCategories(productType),
    getProductTypes(),
  ]);
  return (
    <ProductsClient
      initialProducts={products}
      initialBrands={brands}
      initialCategories={categories}
      initialProductTypes={productTypes}
      activeType={productType}
    />
  );
}
