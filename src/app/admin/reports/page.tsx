import { getReportSummary } from '@/lib/reports';
import { ReportsClient } from '@/components/admin/reports-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'รายงาน | Admin' };

const RANGE_OPTIONS = ['this_month', 'last_month', 'last_3_months', 'this_year'] as const;
type Range = typeof RANGE_OPTIONS[number];

function getRange(range: Range, dateFrom?: string, dateTo?: string) {
  if (dateFrom || dateTo) {
    const start = new Date(`${dateFrom || dateTo}T00:00:00`);
    const end   = new Date(`${dateTo || dateFrom}T23:59:59.999`);
    const fmt = (d: Date) => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const label = dateFrom && dateTo && dateFrom !== dateTo
      ? `${fmt(start)} – ${fmt(end)}`
      : fmt(start);
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
    return { start, end, label: `3 เดือนล่าสุด` };
  }
  if (range === 'this_year') {
    const start = new Date(now.getFullYear(), 0, 1);
    const end   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end, label: `ปี ${now.getFullYear() + 543}` };
  }
  // this_month (default)
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end, label: start.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }) };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const { range, dateFrom, dateTo } = await searchParams;
  const activeRange: Range = RANGE_OPTIONS.includes(range as Range) ? (range as Range) : 'this_month';
  const { start, end, label } = getRange(activeRange, dateFrom, dateTo);

  const summary = await getReportSummary(start, end);

  return (
    <ReportsClient
      summary={summary}
      activeRange={activeRange}
      activeDateFrom={dateFrom || ''}
      activeDateTo={dateTo || ''}
      periodLabel={label}
    />
  );
}
