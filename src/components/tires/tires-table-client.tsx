'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  X
} from 'lucide-react';
import type { ProductRow } from '@/lib/products';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';

type SortKey = keyof ProductRow;
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 15;

const BRAND_COLORS: Record<string, string> = {
  BRIDGESTONE: 'bg-blue-50 text-blue-700 border-blue-200',
  MICHELIN:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  YOKOHAMA:    'bg-orange-50 text-orange-700 border-orange-200',
  DUNLOP:      'bg-purple-50 text-purple-700 border-purple-200',
  GOODYEAR:    'bg-green-50 text-green-700 border-green-200',
  TOYO:        'bg-red-50 text-red-700 border-red-200',
  PIRELLI:     'bg-slate-50 text-slate-700 border-slate-300',
  MAXXIS:      'bg-teal-50 text-teal-700 border-teal-200',
};
const getBrandColor = (b: string) => BRAND_COLORS[b] ?? 'bg-slate-50 text-slate-700 border-slate-200';
const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

function SortIcon({ col, sortKey, sortDir }: { col: string; sortKey: string; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={11} className="text-slate-300 ml-1 inline" />;
  return sortDir === 'asc'
    ? <ChevronUp size={11} className="text-slate-700 ml-1 inline" />
    : <ChevronDown size={11} className="text-slate-700 ml-1 inline" />;
}

export function TiresTableClient({ initialProducts }: { initialProducts: ProductRow[] }) {
  const [sizeTab, setSizeTab]         = useState('all');
  const [brandFilter, setBrandFilter] = useState('');
  const [search, setSearch]           = useState('');
  const [sortKey, setSortKey]         = useState<string>('brand');
  const [sortDir, setSortDir]         = useState<SortDir>('asc');
  const [page, setPage]               = useState(1);

  const allSizes = useMemo(
    () => [...new Set(initialProducts.map(p => p.size))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [initialProducts]
  );

  const availableBrands = useMemo(() => {
    const base = sizeTab === 'all' ? initialProducts : initialProducts.filter(p => p.size === sizeTab);
    return [...new Set(base.map(p => p.brand))].sort();
  }, [initialProducts, sizeTab]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initialProducts
      .filter(p => {
        const matchSize  = sizeTab === 'all' || p.size === sizeTab;
        const matchBrand = !brandFilter || p.brand === brandFilter;
        const matchSearch = !q || p.brand.toLowerCase().includes(q) || p.model.toLowerCase().includes(q);
        return matchSize && matchBrand && matchSearch;
      })
      .sort((a, b) => {
        const av = a[sortKey as keyof ProductRow] as string | number;
        const bv = b[sortKey as keyof ProductRow] as string | number;
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv : String(av).localeCompare(String(bv), 'th');
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [initialProducts, sizeTab, brandFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Size tabs */}
        <div className="flex items-center gap-0 overflow-x-auto border-b border-slate-100" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => { setSizeTab('all'); setBrandFilter(''); setPage(1); }}
            className={`shrink-0 px-5 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap
              ${sizeTab === 'all' ? 'border-slate-900 text-slate-900 bg-slate-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            ทั้งหมด <span className="ml-1.5 text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{initialProducts.length}</span>
          </button>
          {allSizes.map(size => (
            <button key={size}
              onClick={() => { setSizeTab(size); setBrandFilter(''); setPage(1); }}
              className={`shrink-0 px-5 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap
                ${sizeTab === size ? 'border-green-500 text-green-600 bg-green-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {size} <span className="ml-1.5 text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{initialProducts.filter(p => p.size === size).length}</span>
            </button>
          ))}
        </div>

        {/* Brand filter + search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">ยี่ห้อ:</span>
            <button onClick={() => setBrandFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${!brandFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
              ทั้งหมด
            </button>
            {availableBrands.map(b => (
              <button key={b} onClick={() => setBrandFilter(b === brandFilter ? '' : b)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${brandFilter === b ? `${getBrandColor(b)} shadow-sm` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                {b}
              </button>
            ))}
          </div>
          <div className="relative shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" placeholder="ค้นหารุ่นยาง..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-8 py-1.5 w-48 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X size={12} /></button>}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('brand')}>
                  ยี่ห้อ / รุ่น <SortIcon col="brand" sortKey={sortKey} sortDir={sortDir} />
                </th>
                {sizeTab === 'all' && (
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('size')}>
                    ขนาด <SortIcon col="size" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                )}
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32">ประเภท</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-700 uppercase tracking-wider w-32 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('priceCash')}>
                  เงินสด/โอน <SortIcon col="priceCash" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('priceCredit')}>
                  รูดบัตร <SortIcon col="priceCredit" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('priceInstallment')}>
                  ผ่อน 0% 4ด. <SortIcon col="priceInstallment" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-16 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('stock')}>
                  สต๊อก <SortIcon col="stock" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12">ปี</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-4 py-3.5 text-[11px] text-slate-300 tabular-nums">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBrandColor(p.brand)}`}>{p.brand}</span>
                      <span className="font-semibold text-slate-800 text-[13px]">{p.model}</span>
                    </div>
                  </td>
                  {sizeTab === 'all' && (
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{p.size}</span>
                    </td>
                  )}
                  <td className="px-4 py-3.5 text-center">
                    {p.type ? <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{p.type}</span> : <span className="text-slate-200">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm font-black text-slate-900 tabular-nums">{fmt(p.priceCash)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-400 tabular-nums text-xs">{fmt(p.priceCredit)}</td>
                  <td className="px-4 py-3.5 text-right text-slate-500 tabular-nums text-xs font-semibold bg-slate-50/60">{fmt(p.priceInstallment)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md tabular-nums ${p.stock === 0 ? 'bg-red-50 text-red-500' : p.stock <= 6 ? 'bg-amber-50 text-amber-600' : 'text-slate-500 bg-slate-50'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">'{p.year}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <AddToCartButton
                        tire={{ id: p.id, brand: p.brand, model: p.model, size: p.size, image: p.image, price: p.priceCash }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 shrink-0 transition-colors"
                      />
                      <Link href={`/booking?tireId=${p.id}`}
                        className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors">
                        จอง
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="py-20 text-center text-sm text-slate-400">ไม่พบสินค้าในขนาดนี้</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {paginated.map((p) => (
            <div key={p.id} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getBrandColor(p.brand)}`}>{p.brand}</span>
                    {p.type && <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{p.type}</span>}
                  </div>
                  <span className="font-bold text-slate-800 text-sm leading-tight">{p.model}</span>
                  {sizeTab === 'all' && <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-50 w-fit px-1.5 rounded">{p.size}</span>}
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>รูดบัตร</span> <span className="line-through">{fmt(p.priceCredit)}</span>
                  </div>
                  <div className="text-base font-black text-green-600 tracking-tight">{fmt(p.priceCash)}</div>
                  <div className="text-[9px] text-slate-500 bg-slate-50 px-1 rounded mt-0.5">ผ่อน 0% {fmt(p.priceInstallment)}/ด.</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.stock === 0 ? 'bg-red-50 text-red-500' : p.stock <= 6 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                    สต๊อก: {p.stock}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">ปี '{p.year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AddToCartButton
                    tire={{ id: p.id, brand: p.brand, model: p.model, size: p.size, image: p.image, price: p.priceCash }}
                    className="w-7 h-7 flex items-center justify-center rounded border border-green-200 text-green-600 hover:bg-green-50 shrink-0 transition-colors"
                  />
                  <Link href={`/booking?tireId=${p.id}`}
                    className="flex items-center justify-center bg-green-600 text-white rounded px-3 py-1.5 text-xs font-bold shadow-sm">
                    จอง
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">ไม่พบสินค้าที่ตรงกับตัวกรอง</div>
          )}
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 order-2 sm:order-1">
            แสดง <span className="font-semibold text-slate-600">{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> จาก <span className="font-semibold text-slate-600">{filtered.length}</span> รายการ
          </span>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            {(brandFilter || search || sizeTab !== 'all') && (
              <button onClick={() => { setSizeTab('all'); setBrandFilter(''); setSearch(''); setPage(1); }}
                className="mr-2 text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium border border-slate-200 px-2 py-1 rounded-lg bg-white hover:bg-slate-50 transition-colors">
                <X size={11} /> ล้างตัวกรอง
              </button>
            )}
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | '...')[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(n); return acc;
              }, [])
              .map((n, i) => n === '...'
                ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-[11px] text-slate-400">…</span>
                : <button key={n} onClick={() => setPage(n as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${page === n ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    {n}
                  </button>
              )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRightIcon size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
