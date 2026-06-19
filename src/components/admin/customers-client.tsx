'use client';

import { useState, useMemo } from 'react';
import { Search, Phone, Car, FileText, ChevronLeft, ChevronRight, Crown, UserCheck, Sparkles } from 'lucide-react';
import type { CustomerRow } from '@/lib/customers';

function formatLastVisit(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'วันนี้';
  if (days === 1) return 'เมื่อวาน';
  if (days < 7)  return `${days} วันที่แล้ว`;
  if (days < 30) return `${Math.floor(days / 7)} สัปดาห์ที่แล้ว`;
  if (days < 365) return `${Math.floor(days / 30)} เดือนที่แล้ว`;
  return `${Math.floor(days / 365)} ปีที่แล้ว`;
}

const PAGE_SIZE = 15;

const TAG_STYLE: Record<string, string> = {
  VIP:  'bg-amber-50 text-amber-600 border border-amber-200',
  ปกติ: 'bg-slate-100 text-slate-500',
  ใหม่: 'bg-green-50 text-green-600 border border-green-200',
};

const TAG_ICON: Record<string, React.ReactNode> = {
  VIP:  <Crown size={10} />,
  ปกติ: <UserCheck size={10} />,
  ใหม่: <Sparkles size={10} />,
};

export function CustomersClient({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch]     = useState('');
  const [tagFilter, setTagFilter] = useState('ทั้งหมด');
  const [page, setPage]         = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(c => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
      const matchTag    = tagFilter === 'ทั้งหมด' || c.tag === tagFilter;
      return matchSearch && matchTag;
    });
  }, [customers, search, tagFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const vipCount  = customers.filter(c => c.tag === 'VIP').length;
  const newCount  = customers.filter(c => c.tag === 'ใหม่').length;
  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">ลูกค้า</h1>
          <p className="text-sm text-slate-500 mt-1">ทั้งหมด {customers.length} ราย</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'ลูกค้าทั้งหมด', value: customers.length.toString(), sub: 'จากการจองทั้งหมด' },
          { label: 'ลูกค้า VIP',    value: vipCount.toString(),         sub: 'ยอดซื้อ ≥ 50,000 บาท' },
          { label: 'ลูกค้าใหม่',    value: newCount.toString(),          sub: 'จองครั้งแรก' },
          { label: 'ยอดรวมทั้งหมด', value: `฿${totalSpent.toLocaleString()}`, sub: 'จากทุก booking' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400 font-medium mb-1">{s.label}</p>
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์โทร..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
            />
          </div>
          <select
            value={tagFilter}
            onChange={e => { setTagFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400"
          >
            {['ทั้งหมด', 'VIP', 'ปกติ', 'ใหม่'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3">ลูกค้า</th>
                <th className="text-left px-4 py-3">เบอร์โทร</th>
                <th className="text-left px-4 py-3">รถ</th>
                <th className="text-center px-4 py-3">บิลทั้งหมด</th>
                <th className="text-right px-4 py-3">ยอดซื้อรวม</th>
                <th className="text-left px-4 py-3">ล่าสุด</th>
                <th className="text-center px-4 py-3">ประเภท</th>
                <th className="text-center px-4 py-3">LINE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-slate-400 text-sm">ไม่พบข้อมูลลูกค้า</td></tr>
              ) : paginated.map((c, i) => (
                <tr key={c.phone} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">#{(page - 1) * PAGE_SIZE + i + 1}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Phone size={13} className="shrink-0" />{c.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-[180px]">
                    <div className="flex flex-col gap-0.5">
                      {c.cars.slice(0, 2).map(car => (
                        <span key={car} className="flex items-center gap-1 text-xs text-slate-600">
                          <Car size={11} className="shrink-0 text-slate-400" />{car}
                        </span>
                      ))}
                      {c.cars.length > 2 && <span className="text-[10px] text-slate-400">+{c.cars.length - 2} คัน</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="flex items-center justify-center gap-1 text-slate-600">
                      <FileText size={13} />{c.totalBills}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                    ฿{c.totalSpent.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">
                    {formatLastVisit(c.lastVisit)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${TAG_STYLE[c.tag]}`}>
                      {TAG_ICON[c.tag]}{c.tag}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {c.lineUserId ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-[#06C755] rounded-full" title="มี LINE">
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                          <path d="M19.952 12.447c0-4.41-4.42-7.997-9.852-7.997S.248 8.037.248 12.447c0 3.95 3.503 7.264 8.236 7.888.32.07.757.21.867.484.1.247.065.634.032.883l-.14.84c-.042.247-.195.966.846.527 1.04-.44 5.613-3.306 7.656-5.659 1.41-1.548 2.207-3.12 2.207-4.963z"/>
                        </svg>
                      </span>
                    ) : (
                      <span className="text-slate-200 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            แสดง {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} จาก {filtered.length} ราย
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const n = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${page === n ? 'bg-green-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {n}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
