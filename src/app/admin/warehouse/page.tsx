import { getStockItems, getStockMovements, getWarehouseStats } from '@/lib/warehouse';
import { WarehouseClient } from '@/components/admin/warehouse-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'คลังสินค้า | Admin' };

export default async function WarehousePage() {
  const [stockItems, movements, stats] = await Promise.all([
    getStockItems(),
    getStockMovements(300),
    getWarehouseStats(),
  ]);

  return (
    <WarehouseClient
      stockItems={stockItems}
      movements={movements}
      stats={stats}
    />
  );
}
