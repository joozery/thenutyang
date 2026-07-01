import { getWarrantyClaims } from '@/lib/warranty-claims';
import { WarrantyClaimsClient } from '@/components/admin/warranty-claims-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'การเครมประกัน | Admin' };

export default async function WarrantyClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const claims = await getWarrantyClaims({ status, q });
  return <WarrantyClaimsClient initialClaims={claims} />;
}
