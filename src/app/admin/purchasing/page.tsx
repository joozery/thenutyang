import { getPurchaseOrders } from '@/lib/purchasing';
import { getStockReturns } from '@/lib/stock-return';
import { PurchasingClient } from '@/components/admin/purchasing-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'จัดซื้อ | Admin' };

export default async function PurchasingPage() {
  const [orders, returns] = await Promise.all([
    getPurchaseOrders(),
    getStockReturns(),
  ]);
  return <PurchasingClient initialOrders={orders} initialReturns={returns} />;
}
