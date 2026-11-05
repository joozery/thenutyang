import { notFound } from 'next/navigation';
import { getPurchaseOrderById, getSuppliers } from '@/lib/purchasing';
import { NewPurchasingClient } from '@/components/admin/new-purchasing-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'แก้ไขใบสั่งซื้อ | Admin' };

export default async function EditPurchasingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [po, suppliers] = await Promise.all([
    getPurchaseOrderById(id),
    getSuppliers(),
  ]);

  if (!po) notFound();

  return (
    <NewPurchasingClient
      suppliers={suppliers}
      initialData={po}
      poId={id}
    />
  );
}
