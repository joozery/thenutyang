import { getFinanceSummary } from '@/lib/finance';
import { FinanceClient } from '@/components/admin/finance-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'การเงิน | Admin' };

const RANGE_OPTIONS = ['this_month', 'last_month', 'last_3_months'] as const;
type Range = typeof RANGE_OPTIONS[number];

function getRange(range: Range, dateFrom?: string, dateTo?: string) {
  if (dateFrom || dateTo) {
    const start = new Date(dateFrom || dateTo!);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateTo || dateFrom!);
    end.setHours(23, 59, 59, 999);
    const label = dateFrom && dateTo && dateFrom !== dateTo
      ? `${start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : start.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    return { start, end, label };
  }

  const now = new Date();
  if (range === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end, label: start.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }) };
  }
  if (range === 'last_3_months') {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      start, end,
      label: `3 เดือนล่าสุด (${start.toLocaleDateString('th-TH', { month: 'short' })} – ${end.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })})`,
    };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end, label: start.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }) };
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const { range, dateFrom, dateTo } = await searchParams;
  const activeRange: Range = RANGE_OPTIONS.includes(range as Range) ? (range as Range) : 'this_month';
  const { start, end, label } = getRange(activeRange, dateFrom, dateTo);
  const summary = await getFinanceSummary(start, end);

  return (
    <FinanceClient
      summary={summary}
      activeRange={activeRange}
      activeDateFrom={dateFrom || ''}
      activeDateTo={dateTo || ''}
      periodLabel={label}
      periodStartIso={start.toISOString()}
    />
  );
}
