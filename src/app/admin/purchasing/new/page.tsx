import { getSuppliers } from '@/lib/purchasing';
import { getAllProductsAdmin } from '@/lib/products';
import { NewPurchasingClient } from '@/components/admin/new-purchasing-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'สร้างใบสั่งซื้อ | Admin' };

export default async function NewPurchasingPage() {
  const [suppliers, products] = await Promise.all([
    getSuppliers(),
    getAllProductsAdmin(),
  ]);
  return <NewPurchasingClient suppliers={suppliers} products={products} />;
}
