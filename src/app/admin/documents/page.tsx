import { getDocuments, getDocStats } from '@/lib/documents';
import { DocumentsClient } from '@/components/admin/documents-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'บิล / เอกสาร | Admin' };

export default async function DocumentsPage() {
  const [docs, stats] = await Promise.all([
    getDocuments(),
    getDocStats(),
  ]);

  return <DocumentsClient initialDocs={docs} stats={stats} />;
}
