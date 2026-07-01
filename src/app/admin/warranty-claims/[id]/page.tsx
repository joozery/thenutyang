import { notFound } from 'next/navigation';
import { getWarrantyClaimById } from '@/lib/warranty-claims';
import { WarrantyClaimDetailClient } from '@/components/admin/warranty-claim-detail-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'รายละเอียดเคสเครม | Admin' };

export default async function WarrantyClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const claim = await getWarrantyClaimById(id);
  if (!claim) notFound();
  return <WarrantyClaimDetailClient claim={claim} />;
}
