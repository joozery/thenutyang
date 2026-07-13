'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, TrendingDown, ShoppingCart, Wallet, Users, Filter, CalendarDays,
} from 'lucide-react';
import type { DailyExpenseItem } from '@/lib/finance';

const SOURCE_LABEL: Record<DailyExpenseItem['source'], string> = {
  po:      'ใบสั่งซื้อ (PO)',
  expense: 'บันทึกค่าใช้จ่าย',
  payroll: 'เงินเดือน',
};

const SOURCE_BADGE: Record<DailyExpenseItem['source'], string> = {
  po:      'bg-blue-50 text-blue-600 border-blue-100',
  expense: 'bg-orange-50 text-orange-600 border-orange-100',
  payroll: 'bg-purple-50 text-purple-600 border-purple-100',
};

function fmtMoney(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function fmtDayHeader(key: string) {
  return new Date(`${key}T00:00:00`).toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function ExpenseSummaryClient({
  items,
  activeDateFrom,
  activeDateTo,
}: {
  items: DailyExpenseItem[];
  activeDateFrom: string;
  activeDateTo: string;
}) {
  const router = useRouter();
  const [sourceFilter, setSourceFilter] = useState<'all' | DailyExpenseItem['source']>('all');
  const [catFilter,    setCatFilter]    = useState('ทั้งหมด');

  function pushRange(from: string, to: string) {
    const params = new URLSearchParams();
    if (from) params.set('dateFrom', from);
    if (to)   params.set('dateTo', to);
    router.push(params.toString() ? `/admin/finance/expenses?${params.toString()}` : '/admin/finance/expenses');
  }

  const categories = useMemo(
    () => ['ทั้งหมด', ...new Set(items.map(i => i.category))],
    [items],
  );

  const filtered = useMemo(() => items.filter(i =>
    (sourceFilter === 'all' || i.source === sourceFilter) &&
    (catFilter === 'ทั้งหมด' || i.category === catFilter)
  ), [items, sourceFilter, catFilter]);

  // จัดกลุ่มตามวัน (เรียงวันล่าสุดก่อน — items ถูก sort มาแล้ว)
  const byDay = useMemo(() => {
    const m = new Map<string, DailyExpenseItem[]>();
    for (const i of filtered) {
      const k = dayKey(i.date);
      const arr = m.get(k);
      if (arr) arr.push(i);
      else m.set(k, [i]);
    }
    return [...m.entries()].map(([key, list]) => ({
      key,
      items: list,
      total: list.reduce((s, i) => s + i.amount, 0),
    }));
  }, [filtered]);

  const totals = useMemo(() => ({
    all:     filtered.reduce((s, i) => s + i.amount, 0),
    po:      items.filter(i => i.source === 'po').reduce((s, i) => s + i.amount, 0),
    expense: items.filter(i => i.source === 'expense').reduce((s, i) => s + i.amount, 0),
    payroll: items.filter(i => i.source === 'payroll').reduce((s, i) => s + i.amount, 0),
  }), [filtered, items]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/finance" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900">สรุปรายจ่ายรายวัน</h1>
            <p className="text-sm text-slate-500 mt-1">เช็กรายจ่ายแต่ละวัน — ใบสั่งซื้อ (PO), บันทึกค่าใช้จ่าย และเงินเดือน</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={activeDateFrom}
            max={activeDateTo || undefined}
            onChange={e => pushRange(e.target.value, activeDateTo)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400 bg-white"
          />
          <span className="text-slate-400 text-sm">–</span>
          <input
            type="date"
            value={activeDateTo}
            min={activeDateFrom || undefined}
            onChange={e => pushRange(activeDateFrom, e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400 bg-white"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'รายจ่ายรวม (ตามที่กรอง)', value: totals.all, icon: <TrendingDown size={18} />, iconCls: 'bg-slate-100 text-slate-600', valueCls: 'text-slate-900' },
          { label: 'ใบสั่งซื้อ (PO)',           value: totals.po, icon: <ShoppingCart size={18} />, iconCls: 'bg-blue-50 text-blue-600', valueCls: 'text-blue-700' },
          { label: 'บันทึกค่าใช้จ่าย',          value: totals.expense, icon: <Wallet size={18} />, iconCls: 'bg-orange-50 text-orange-600', valueCls: 'text-orange-700' },
          { label: 'เงินเดือน/ค่าแรง',          value: totals.payroll, icon: <Users size={18} />, iconCls: 'bg-purple-50 text-purple-600', valueCls: 'text-purple-700' },
        ].map(c => (
          <div key={c.label} className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-medium">{c.label}</span>
              <div className={`p-2 rounded-xl ${c.iconCls}`}>{c.icon}</div>
            </div>
            <p className={`text-2xl font-black tabular-nums ${c.valueCls}`}>฿{fmtMoney(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl bg-white">
          <Filter size={14} className="text-slate-400" />
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value as typeof sourceFilter)}
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">ที่มา: ทั้งหมด</option>
            <option value="po">ที่มา: ใบสั่งซื้อ (PO)</option>
            <option value="expense">ที่มา: บันทึกค่าใช้จ่าย</option>
            <option value="payroll">ที่มา: เงินเดือน</option>
          </select>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl bg-white">
          <Filter size={14} className="text-slate-400" />
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            {categories.map(c => <option key={c} value={c}>หมวด: {c}</option>)}
          </select>
        </div>
        <span className="text-xs text-slate-400 ml-1">{filtered.length} รายการ · {byDay.length} วัน</span>
      </div>

      {/* Day-by-day list */}
      {byDay.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl py-16 text-center">
          <CalendarDays size={36} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-bold">ไม่มีรายจ่ายในช่วงนี้</p>
          <p className="text-slate-400 text-sm mt-1">ลองเปลี่ยนช่วงวันที่หรือตัวกรองดู</p>
        </div>
      ) : (
        <div className="space-y-4">
          {byDay.map(day => (
            <div key={day.key} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-slate-400" />
                  <p className="font-bold text-slate-800 text-sm">{fmtDayHeader(day.key)}</p>
                  <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 font-semibold">{day.items.length} รายการ</span>
                </div>
                <p className="font-black text-red-500 tabular-nums">-฿{fmtMoney(day.total)}</p>
              </div>
              <div className="divide-y divide-slate-50">
                {day.items.map(i => (
                  <div key={`${i.source}-${i.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{i.desc}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${SOURCE_BADGE[i.source]}`}>
                          {SOURCE_LABEL[i.source]}
                        </span>
                        <span className="text-[11px] text-slate-400">{i.category}</span>
                        {i.href ? (
                          <a href={i.href} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] text-blue-500 hover:text-blue-700 hover:underline font-medium">
                            {i.ref} ↗
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">{i.ref}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-700 tabular-nums shrink-0 sm:text-right">฿{fmtMoney(i.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
