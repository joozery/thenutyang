import { notFound } from 'next/navigation';
import { getPurchaseOrderById } from '@/lib/purchasing';
import { getDocumentSettings } from '@/lib/document-settings';
import { PrintPageShell } from '@/components/admin/documents/print-page-shell';
import { POTemplate } from '@/components/admin/purchasing/po-template';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ตัวอย่างก่อนพิมพ์ | Admin' };

export default async function PurchaseOrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, settings] = await Promise.all([
    getPurchaseOrderById(id),
    getDocumentSettings(),
  ]);

  if (!order) notFound();

  return (
    <PrintPageShell>
      <POTemplate order={order} documentSettings={settings} />
    </PrintPageShell>
  );
}
