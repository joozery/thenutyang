import { notFound } from 'next/navigation';
import { getPurchaseOrderById, getSuppliers } from '@/lib/purchasing';
import { getAllProductsAdmin } from '@/lib/products';
import { NewPurchasingClient } from '@/components/admin/new-purchasing-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'แก้ไขใบสั่งซื้อ | Admin' };

export default async function EditPurchasingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [po, suppliers, products] = await Promise.all([
    getPurchaseOrderById(id),
    getSuppliers(),
    getAllProductsAdmin(),
  ]);

  if (!po) notFound();
  if (po.status !== 'ร่าง' && po.status !== 'รอรับสินค้า') notFound();

  return (
    <NewPurchasingClient
      suppliers={suppliers}
      products={products}
      initialData={po}
      poId={id}
    />
  );
}
