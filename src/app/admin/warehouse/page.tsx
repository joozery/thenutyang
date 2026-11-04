import { getStockItemsPage, getLowStockItems, getWarehouseStats } from '@/lib/warehouse';
import { WarehouseClient } from '@/components/admin/warehouse-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'คลังสินค้า | Admin' };

export default async function WarehousePage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; filter?: 'all' | 'low' | 'ok'; sort?: 'none' | 'desc' | 'asc' }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || '1', 10) || 1);
  const [stockList, lowStockItems, stats] = await Promise.all([
    getStockItemsPage({ page, search: params.search, filter: params.filter, sort: params.sort }),
    getLowStockItems(),
    getWarehouseStats(),
  ]);

  return (
    <WarehouseClient
      stockItems={stockList.items}
      lowStockItems={lowStockItems}
      movements={[]}
      stats={stats}
      pagination={{ page: stockList.page, pageSize: stockList.pageSize, totalItems: stockList.totalItems }}
      initialStockFilters={{ search: params.search || '', filter: params.filter || 'all', sort: params.sort || 'none' }}
    />
  );
}
