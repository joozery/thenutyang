import { getFinanceSummary } from '@/lib/finance';
import { FinanceClient } from '@/components/admin/finance-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'การเงิน | Admin' };

const RANGE_OPTIONS = ['this_month', 'last_month', 'last_3_months'] as const;
type Range = typeof RANGE_OPTIONS[number];

function getRange(range: Range, dateQuery?: string) {
  if (dateQuery) {
    const start = new Date(dateQuery);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateQuery);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: start.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) };
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
  searchParams: Promise<{ range?: string; date?: string }>;
}) {
  const { range, date } = await searchParams;
  const activeRange: Range = RANGE_OPTIONS.includes(range as Range) ? (range as Range) : 'this_month';
  const { start, end, label } = getRange(activeRange, date);
  const summary = await getFinanceSummary(start, end);

  return <FinanceClient summary={summary} activeRange={activeRange} activeDate={date || ''} periodLabel={label} />;
}
