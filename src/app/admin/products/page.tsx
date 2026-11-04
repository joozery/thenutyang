import { getProductAdminPage, getProductFilterOptions, getProductAdminSummary } from '@/lib/products';
import { getBrands } from '@/app/actions/brands';
import { getCategories } from '@/app/actions/categories';
import { getProductTypes } from '@/app/actions/productTypes';
import { ProductsClient } from '@/components/admin/products-client';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string; search?: string; size?: string; brand?: string; category?: string; sort?: string; dir?: string }>;
}) {
  const { type, page, search, size, brand, category, sort, dir } = await searchParams;
  const productType = type || 'tires';
  const currentPage = Math.max(1, Number.parseInt(page || '1', 10) || 1);
  const [productList, filterOptions, summary, brands, categories, productTypes] = await Promise.all([
    getProductAdminPage({ productType, page: currentPage, search, size, brand, category, sortKey: sort, sortDir: dir === 'desc' ? 'desc' : 'asc' }),
    getProductFilterOptions(productType),
    getProductAdminSummary(productType),
    getBrands(productType),
    getCategories(productType),
    getProductTypes(),
  ]);
  return (
    <ProductsClient
      initialProducts={productList.products}
      initialBrands={brands}
      initialCategories={categories}
      initialProductTypes={productTypes}
      activeType={productType}
      pagination={{ page: productList.page, pageSize: productList.pageSize, totalItems: productList.totalItems }}
      filterOptions={filterOptions}
      summary={summary}
      initialFilters={{ search: search || '', size: size || 'all', brand: brand || '', category: category || '', sort: sort || 'brand', dir: dir === 'desc' ? 'desc' : 'asc' }}
    />
  );
}
