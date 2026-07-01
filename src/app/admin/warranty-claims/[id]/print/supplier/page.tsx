import { notFound } from 'next/navigation';
import { getWarrantyClaimById } from '@/lib/warranty-claims';
import { getDocumentSettings } from '@/lib/document-settings';
import { PrintPageShell } from '@/components/admin/documents/print-page-shell';
import { ClaimSupplierTemplate } from '@/components/admin/warranty-claims/claim-supplier-template';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'หนังสือส่งเครม | Admin' };

export default async function ClaimSupplierPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [claim, settings] = await Promise.all([getWarrantyClaimById(id), getDocumentSettings()]);
  if (!claim) notFound();
  return (
    <PrintPageShell>
      <ClaimSupplierTemplate claim={claim} documentSettings={settings} />
    </PrintPageShell>
  );
}
