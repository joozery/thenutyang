'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// ปฏิทินคู่ "จาก–ถึง" ผูกกับ URL searchParams (dateFrom/dateTo) ใช้กับหน้าที่ query ฝั่ง server
export function DateRangePickerFilter({ label = "ช่วงวันที่" }: { label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  const handleChange = (key: 'dateFrom' | 'dateTo', val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const inputCls = "bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-slate-600">{label}:</span>
      <input
        type="date"
        value={dateFrom}
        max={dateTo || undefined}
        onChange={e => handleChange('dateFrom', e.target.value)}
        className={inputCls}
      />
      <span className="text-slate-400 text-sm">–</span>
      <input
        type="date"
        value={dateTo}
        min={dateFrom || undefined}
        onChange={e => handleChange('dateTo', e.target.value)}
        className={inputCls}
      />
    </div>
  );
}
