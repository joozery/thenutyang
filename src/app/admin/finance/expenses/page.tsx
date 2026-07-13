import { getDailyExpenses } from '@/lib/finance';
import { ExpenseSummaryClient } from '@/components/admin/expense-summary-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'สรุปรายจ่ายรายวัน | Admin' };

export default async function ExpenseSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>;
}) {
  const { dateFrom, dateTo } = await searchParams;

  // ค่าเริ่มต้น = เดือนนี้
  const now = new Date();
  const start = dateFrom
    ? new Date(`${dateFrom}T00:00:00`)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = dateTo
    ? new Date(`${dateTo}T23:59:59.999`)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const items = await getDailyExpenses(start, end);

  return (
    <ExpenseSummaryClient
      items={items}
      activeDateFrom={dateFrom || ''}
      activeDateTo={dateTo || ''}
    />
  );
}
