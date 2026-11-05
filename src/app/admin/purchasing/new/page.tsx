import { getSuppliers } from '@/lib/purchasing';
import { NewPurchasingClient } from '@/components/admin/new-purchasing-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'สร้างใบสั่งซื้อ | Admin' };

export default async function NewPurchasingPage() {
  const suppliers = await getSuppliers();
  return <NewPurchasingClient suppliers={suppliers} />;
}
