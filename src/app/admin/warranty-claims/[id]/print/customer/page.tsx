import { notFound } from 'next/navigation';
import { getWarrantyClaimById } from '@/lib/warranty-claims';
import { getDocumentSettings } from '@/lib/document-settings';
import { PrintPageShell } from '@/components/admin/documents/print-page-shell';
import { ClaimCustomerTemplate } from '@/components/admin/warranty-claims/claim-customer-template';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'เอกสารรับเรื่องเครม | Admin' };

export default async function ClaimCustomerPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [claim, settings] = await Promise.all([getWarrantyClaimById(id), getDocumentSettings()]);
  if (!claim) notFound();
  return (
    <PrintPageShell>
      <ClaimCustomerTemplate claim={claim} documentSettings={settings} />
    </PrintPageShell>
  );
}
