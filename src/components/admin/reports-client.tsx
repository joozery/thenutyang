'use client';

import { useRouter } from 'next/navigation';
import {
  BarChart2, TrendingUp, TrendingDown, Download, Calendar,
  Users, Package, DollarSign,
} from 'lucide-react';
import type { ReportSummary } from '@/lib/reports';

const RANGE_OPTIONS = [
  { value: 'this_month',     label: 'เดือนนี้' },
  { value: 'last_month',    label: 'เดือนที่แล้ว' },
  { value: 'last_3_months', label: '3 เดือน' },
  { value: 'this_year',     label: 'ปีนี้' },
] as const;
type Range = typeof RANGE_OPTIONS[number]['value'];

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtK(n: number) {
  return `฿${fmt(n)}`;
}


export function ReportsClient({
  summary,
  activeRange,
  activeDateFrom,
  activeDateTo,
  periodLabel,
}: {
  summary:        ReportSummary;
  activeRange:    Range;
  activeDateFrom: string;
  activeDateTo:   string;
  periodLabel:    string;
}) {
  const router = useRouter();
  const hasCustomDate = !!(activeDateFrom || activeDateTo);

  function pushRange(range: string) {
    router.push(`/admin/reports?range=${range}`);
  }
  function pushDate(from: string, to: string) {
    const p = new URLSearchParams();
    if (from) p.set('dateFrom', from);
    if (to)   p.set('dateTo', to);
    router.push(p.toString() ? `/admin/reports?${p}` : '/admin/reports?range=this_month');
  }

  const maxBar = Math.max(...summary.monthly.map((m) => Math.max(m.income, m.expense)), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header + Date Filter ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">รายงาน</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar size={13} /> {periodLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset buttons */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => pushRange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  !hasCustomDate && activeRange === opt.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={activeDateFrom}
              max={activeDateTo || undefined}
              onChange={(e) => pushDate(e.target.value, activeDateTo)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-green-400 bg-white"
            />
            <span className="text-slate-400 text-sm">–</span>
            <input
              type="date"
              value={activeDateTo}
              min={activeDateFrom || undefined}
              onChange={(e) => pushDate(activeDateFrom, e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-green-400 bg-white"
            />
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Download size={15} /> ส่งออกรายงาน
          </button>
        </div>
      </div>

      {/* ── รายรับ / รายจ่าย KPI (ข้อมูลจริงตามช่วงเวลา) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">รายรับรวม</span>
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><TrendingUp size={18} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900">฿{fmt(summary.totalIncome)}</p>
          <p className="text-slate-400 text-xs mt-1">{periodLabel}</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">รายจ่ายรวม</span>
            <div className="bg-red-50 p-2 rounded-xl text-red-500"><TrendingDown size={18} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900">฿{fmt(summary.totalExpense)}</p>
          <p className="text-slate-400 text-xs mt-1">{periodLabel}</p>
        </div>

        <div className={`border rounded-2xl p-5 ${summary.netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium ${summary.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>คงเหลือ</span>
            <div className={`p-2 rounded-xl ${summary.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
              <DollarSign size={18} />
            </div>
          </div>
          <p className={`text-3xl font-black ${summary.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {summary.netProfit >= 0 ? '' : '-'}฿{fmt(Math.abs(summary.netProfit))}
          </p>
          <p className={`text-xs mt-1 ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>รายรับ – รายจ่าย</p>
        </div>
      </div>

      {/* ── กราฟรายรับ vs รายจ่าย รายเดือน (ข้อมูลจริง) ──────── */}
      {summary.monthly.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-900">รายรับ vs รายจ่าย รายเดือน</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />รายรับ</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" />รายจ่าย</span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
            {summary.monthly.map((m) => (
              <div key={`${m.year}-${m.month}`} className="flex-1 min-w-[48px] flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-0.5" style={{ height: '160px' }}>
                  <div
                    className="flex-1 bg-emerald-500 rounded-t-md hover:bg-emerald-600 transition-colors"
                    style={{ height: `${Math.max((m.income / maxBar) * 150, m.income > 0 ? 2 : 0)}px` }}
                    title={`รายรับ ฿${fmt(m.income)}`}
                  />
                  <div
                    className="flex-1 bg-red-400 rounded-t-md hover:bg-red-500 transition-colors"
                    style={{ height: `${Math.max((m.expense / maxBar) * 150, m.expense > 0 ? 2 : 0)}px` }}
                    title={`รายจ่าย ฿${fmt(m.expense)}`}
                  />
                </div>
                <span className="text-[11px] text-slate-400 font-medium truncate w-full text-center">{m.label}</span>
                <span className={`text-[10px] font-bold ${m.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {m.net >= 0 ? '+' : ''}{fmtK(m.net)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Breakdown รายรับ / รายจ่าย ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> รายรับแยกหมวดหมู่
          </h2>
          {summary.incomeByCategory.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">ไม่มีข้อมูลในช่วงนี้</p>
          ) : (
            <div className="space-y-3">
              {summary.incomeByCategory.map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-700 font-medium truncate pr-2">{c.label}</span>
                    <span className="text-sm font-bold text-slate-800 shrink-0">฿{fmt(c.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${c.pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right shrink-0">{c.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> รายจ่ายแยกหมวดหมู่
          </h2>
          {summary.expenseByCategory.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">ไม่มีข้อมูลในช่วงนี้</p>
          ) : (
            <div className="space-y-3">
              {summary.expenseByCategory.map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-700 font-medium truncate pr-2">{c.label}</span>
                    <span className="text-sm font-bold text-slate-800 shrink-0">฿{fmt(c.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${c.pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right shrink-0">{c.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 border-t border-slate-200" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ภาพรวมสถิติ</span>
        <div className="flex-1 border-t border-slate-200" />
      </div>

      {/* ── 4 KPI Cards (ข้อมูลจริง) ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: `รายได้รวม (ปี ${new Date().getFullYear() + 543})`,
            value: fmtK(summary.ytdIncome),
            sub:   'YTD',
            icon:  <DollarSign size={18} />,
            color: 'text-emerald-600 bg-emerald-50',
          },
          {
            label: 'จำนวนบิล',
            value: fmt(summary.billCount),
            sub:   `ใบ · ${periodLabel}`,
            icon:  <BarChart2 size={18} />,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'ลูกค้าใหม่',
            value: fmt(summary.newCustomerCount),
            sub:   `ราย · ${periodLabel}`,
            icon:  <Users size={18} />,
            color: 'text-purple-600 bg-purple-50',
          },
          {
            label: 'รายการขายทั้งหมด',
            value: fmt(summary.topProducts.reduce((s, p) => s + p.qty, 0)),
            sub:   `ชิ้น · ${periodLabel}`,
            icon:  <Package size={18} />,
            color: 'text-orange-600 bg-orange-50',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-1.5 rounded-lg ${kpi.color}`}>{kpi.icon}</div>
            </div>
            <p className="text-xl font-black text-slate-900 mb-0.5">{kpi.value}</p>
            <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── สินค้าขายดี (ข้อมูลจริง) ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Package size={16} className="text-slate-400" /> สินค้า/บริการขายดี
          <span className="text-xs text-slate-400 font-normal ml-1">({periodLabel})</span>
        </h2>
        {summary.topProducts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">ไม่มีข้อมูลในช่วงนี้</p>
        ) : (
          <div className="space-y-3">
            {summary.topProducts.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-black w-5 shrink-0 ${i === 0 ? 'text-amber-500' : 'text-slate-400'}`}>#{i + 1}</span>
                    <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500">{fmt(p.qty)} ชิ้น</span>
                    <span className="text-sm font-bold text-slate-800">฿{fmt(p.revenue)}</span>
                  </div>
                </div>
                <div className="ml-7 bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full"
                    style={{ width: `${summary.topProducts[0].qty > 0 ? (p.qty / summary.topProducts[0].qty) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
