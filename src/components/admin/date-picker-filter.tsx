'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function DatePickerFilter({ label = "เลือกวันที่" }: { label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentDate = searchParams.get('date') || '';

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set('date', val);
    } else {
      params.delete('date');
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-slate-600">{label}:</span>
      <input
        type="date"
        value={currentDate}
        onChange={handleDateChange}
        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
      />
    </div>
  );
}
