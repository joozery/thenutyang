import { getDocuments } from '@/lib/documents';
import { DocumentsClient } from '@/components/admin/documents-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'บิล / เอกสาร | Admin' };

export default async function DocumentsPage({ searchParams }: {
  searchParams: Promise<{ page?: string; search?: string; type?: string; status?: string; vat?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || '1', 10) || 1);
  const documentList = await getDocuments({ page, search: params.search, type: params.type, status: params.status, vat: params.vat, dateFrom: params.dateFrom, dateTo: params.dateTo });

  return (
    <DocumentsClient
      initialDocs={documentList.docs}
      stats={null}
      bookingStatusMap={{}}
      products={[]}
      pagination={{ page: documentList.page, pageSize: documentList.pageSize, totalItems: documentList.totalItems, invoiceCount: documentList.summaryTotals.invoiceCount }}
      initialFilters={{ search: params.search || '', type: params.type || '', status: params.status || '', vat: params.vat || '', dateFrom: params.dateFrom || '', dateTo: params.dateTo || '' }}
      costProfitSummary={null}
    />
  );
}
