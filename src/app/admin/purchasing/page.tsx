import { getPurchaseOrdersPage } from '@/lib/purchasing';
import { getStockReturns } from '@/lib/stock-return';
import { PurchasingClient } from '@/components/admin/purchasing-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'จัดซื้อ | Admin' };

export default async function PurchasingPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; status?: string; dateFrom?: string; dateTo?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || '1', 10) || 1);
  const [orderList, returns] = await Promise.all([
    getPurchaseOrdersPage({ page, search: params.search, status: params.status, dateFrom: params.dateFrom, dateTo: params.dateTo }),
    getStockReturns(),
  ]);
  return <PurchasingClient initialOrders={orderList.orders} initialReturns={returns} pagination={{ page: orderList.page, pageSize: orderList.pageSize, totalItems: orderList.totalItems }} summary={orderList.summary} initialFilters={{ search: params.search || '', status: params.status || 'ทั้งหมด', dateFrom: params.dateFrom || '', dateTo: params.dateTo || '' }} />;
}
