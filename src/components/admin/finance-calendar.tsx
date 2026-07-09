'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X, ArrowUpRight, ArrowDownRight, CalendarDays } from 'lucide-react';
import type { FinanceTransaction } from '@/lib/finance';

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

// ตัวเลขย่อในช่องปฏิทิน เช่น 5.2K / 1.3M — พื้นที่ต่อช่องมีจำกัด
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type DayAgg = { income: number; expense: number; items: FinanceTransaction[] };

export function FinanceCalendar({
  transactions,
  periodStartIso,
}: {
  transactions: FinanceTransaction[];
  periodStartIso: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const anchor = new Date(periodStartIso);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const byDay = useMemo(() => {
    const map = new Map<string, DayAgg>();
    for (const t of transactions) {
      const key = dayKey(new Date(t.date));
      const cur = map.get(key) ?? { income: 0, expense: 0, items: [] };
      if (t.type === 'in') cur.income += t.amount;
      else cur.expense += t.amount;
      cur.items.push(t);
      map.set(key, cur);
    }
    return map;
  }, [transactions]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = new Date(year, month, 1).getDay();
  const todayKey = dayKey(new Date());

  let monthIn = 0;
  let monthOut = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const agg = byDay.get(dayKey(new Date(year, month, d)));
    if (agg) {
      monthIn += agg.income;
      monthOut += agg.expense;
    }
  }

  const goMonth = (offset: number) => {
    const first = new Date(year, month + offset, 1);
    const last = new Date(year, month + offset + 1, 0);
    router.push(`/admin/finance?dateFrom=${dayKey(first)}&dateTo=${dayKey(last)}`);
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null as null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = new Date(year, month, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const selectedAgg = selected ? byDay.get(selected) : undefined;
  const selectedLabel = selected
    ? new Date(`${selected}T00:00:00`).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays size={16} className="text-green-600" /> ปฏิทินเงินเข้า-ออก
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-green-600">เข้า +฿{monthIn.toLocaleString()}</span>
            <span className="text-red-500">ออก -฿{monthOut.toLocaleString()}</span>
            <span className={monthIn - monthOut >= 0 ? 'text-slate-800' : 'text-red-600'}>
              สุทธิ ฿{(monthIn - monthOut).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => goMonth(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="เดือนก่อนหน้า">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-slate-700 min-w-[9rem] text-center">{monthLabel}</span>
            <button onClick={() => goMonth(1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="เดือนถัดไป">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`py-2 text-center text-[11px] font-bold ${i === 0 || i === 6 ? 'text-red-400' : 'text-slate-400'}`}>
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={`b-${i}`} className="min-h-[4.5rem] border-b border-r border-slate-50 bg-slate-50/30" />;
          const key = dayKey(new Date(year, month, day));
          const agg = byDay.get(key);
          const isToday = key === todayKey;
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(isSelected ? null : key)}
              className={`min-h-[4.5rem] border-b border-r border-slate-50 p-1.5 text-left align-top transition-colors flex flex-col gap-0.5
                ${isSelected ? 'bg-green-50 ring-2 ring-inset ring-green-400' : agg ? 'hover:bg-slate-50 cursor-pointer' : 'hover:bg-slate-50/50'}`}
            >
              <span className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full
                ${isToday ? 'bg-green-600 text-white' : 'text-slate-500'}`}>
                {day}
              </span>
              {agg && agg.income > 0 && (
                <span className="text-[10px] font-bold text-green-600 leading-tight">+{compact.format(agg.income)}</span>
              )}
              {agg && agg.expense > 0 && (
                <span className="text-[10px] font-bold text-red-500 leading-tight">-{compact.format(agg.expense)}</span>
              )}
            </button>
          );
        })}
        {/* เติมช่องท้ายให้ครบแถว */}
        {Array.from({ length: (7 - ((leadingBlanks + daysInMonth) % 7)) % 7 }, (_, i) => (
          <div key={`t-${i}`} className="min-h-[4.5rem] border-b border-r border-slate-50 bg-slate-50/30" />
        ))}
      </div>

      {/* รายการของวันที่เลือก */}
      {selected && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">{selectedLabel}</p>
            <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400" title="ปิด">
              <X size={13} />
            </button>
          </div>
          {!selectedAgg ? (
            <p className="px-4 pb-4 text-xs text-slate-400">ไม่มีรายการเงินเข้าออกในวันนี้</p>
          ) : (
            <div className="px-4 pb-4 space-y-1.5 max-h-56 overflow-y-auto">
              {selectedAgg.items.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 bg-white rounded-lg px-3 py-2 border border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0
                      ${t.type === 'in' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {t.type === 'in' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{t.desc}</p>
                      {t.href ? (
                        <a href={t.href} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline font-medium truncate block"
                          title="เปิดดูเอกสาร">
                          {t.ref} ↗
                        </a>
                      ) : (
                        <p className="text-[10px] text-slate-400 truncate">{t.ref}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${t.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'in' ? '+' : '-'}฿{t.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-1 text-[11px] font-bold">
                <span className="text-green-600">เข้า +฿{selectedAgg.income.toLocaleString()}</span>
                <span className="text-red-500">ออก -฿{selectedAgg.expense.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
