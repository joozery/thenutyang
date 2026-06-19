import { getPurchaseOrders } from '@/lib/purchasing';
import { PurchasingClient } from '@/components/admin/purchasing-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'จัดซื้อ | Admin' };

export default async function PurchasingPage() {
  const orders = await getPurchaseOrders();
  return <PurchasingClient initialOrders={orders} />;
}
