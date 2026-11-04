'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search, ChevronDown, ChevronLeft, ChevronRight, X, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import type { TireListingResult, TireSort } from '@/lib/products';
import { BRAND_LOGOS } from '@/lib/tires';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';

const SORT_LABEL: Record<TireSort, string> = {
  recommended: 'เรียง: แนะนำ',
  priceAsc:    'เรียง: ราคาต่ำ → สูง',
  priceDesc:   'เรียง: ราคาสูง → ต่ำ',
  size:        'เรียง: ขนาดยาง',
};

type Current = { brand: string; size: string; q: string; sort: TireSort };

/**
 * ตัวกรอง/เรียง/หน้า เก็บไว้ใน URL — server เป็นคนกรองและแบ่งหน้า
 * ส่งมาแค่สินค้าในหน้าปัจจุบัน (ไม่โหลดสินค้าทั้งหมดมาที่ browser)
 */
export function TiresGridClient({
  listing,
  brandLogos = [],
  current,
}: {
  listing: TireListingResult;
  brandLogos?: { name: string; logo?: string }[];
  current: Current;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { products, total, page, totalPages, sizes: allSizes, brands: availableBrands } = listing;

  // ช่องค้นหา: พิมพ์แล้วรอ 400ms ค่อยยิงไป server
  const [search, setSearch] = useState(current.q);
  const [syncedQ, setSyncedQ] = useState(current.q);
  if (current.q !== syncedQ) {
    // URL เปลี่ยนจากที่อื่น (เช่น กดย้อนกลับ) → อัปเดตช่องค้นหาให้ตรง
    setSyncedQ(current.q);
    setSearch(current.q);
  }

  function navigate(updates: Record<string, string | number | null>, { resetPage = true } = {}) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '' || v === undefined) params.delete(k);
      else params.set(k, String(v));
    }
    if (resetPage) params.delete('page');
    if (params.get('page') === '1') params.delete('page');
    if (params.get('sort') === 'recommended') params.delete('sort');
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: !resetPage });
    });
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  function submitSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim() !== current.q.trim()) navigate({ q: value.trim() || null });
  }

  function onSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => submitSearch(value), 400);
  }

  const hasFilter = !!(current.size || current.brand || current.q);

  const selectCls = 'appearance-none text-xs bg-white border border-slate-200 text-slate-700 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-colors font-semibold cursor-pointer';

  function brandLogo(brand: string): string | undefined {
    return brandLogos.find(b => b.name === brand)?.logo || BRAND_LOGOS[brand];
  }

  // แบรนด์ที่เลือกจาก URL อาจไม่อยู่ในรายการ (เช่นพิมพ์ตัวเล็ก) — ใส่ไว้ให้ select แสดงค่าได้
  const brandOptions = current.brand && !availableBrands.includes(current.brand)
    ? [current.brand, ...availableBrands]
    : availableBrands;

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <select value={current.size} onChange={e => navigate({ size: e.target.value, brand: null })} className={selectCls}>
            <option value="">ทุกขนาด ({allSizes.length})</option>
            {allSizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={current.brand} onChange={e => navigate({ brand: e.target.value })} className={selectCls}>
            <option value="">ทุกยี่ห้อ ({availableBrands.length})</option>
            {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={current.sort} onChange={e => navigate({ sort: e.target.value })} className={selectCls}>
            {Object.entries(SORT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="ค้นหายี่ห้อ รุ่น หรือขนาด..." value={search}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitSearch(search); }}
            className="w-full pl-8 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-colors" />
          {search && <button onClick={() => { setSearch(''); submitSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X size={12} /></button>}
        </div>
        {hasFilter && (
          <button onClick={() => { setSearch(''); if (debounceRef.current) clearTimeout(debounceRef.current); navigate({ size: null, brand: null, q: null }); }}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium border border-slate-200 px-2.5 py-2 rounded-lg bg-white hover:bg-slate-50 transition-colors">
            <X size={11} /> ล้างตัวกรอง
          </button>
        )}
        <span className="text-[11px] text-slate-400 ml-auto flex items-center gap-1.5">
          {isPending && <Loader2 size={11} className="animate-spin" />}
          {total.toLocaleString()} รายการ
        </span>
      </div>

      {/* Product cards */}
      {products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-20 text-center text-sm text-slate-400">
          ไม่พบสินค้าที่ตรงกับตัวกรอง
          <div>
            <Link href="/tires" className="text-green-600 font-bold mt-2 inline-block">ดูสินค้าทั้งหมด</Link>
          </div>
        </div>
      ) : (
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
          {products.map(p => {
            const logo = brandLogo(p.brand);
            const discount = p.oldPrice ? Math.round(((p.oldPrice - p.priceCash) / p.oldPrice) * 100) : 0;
            return (
              <div key={p.id} className="border border-slate-100 rounded-2xl p-3 md:p-4 hover:shadow-lg hover:border-green-200 transition-all bg-white flex flex-col group">
                {/* คลิกส่วนรูป+ข้อมูลเพื่อดูรายละเอียด */}
                <Link href={`/tires/${p.id}`} className="flex flex-col flex-1">
                  <div className="relative w-full h-28 md:h-36 flex items-center justify-center shrink-0 mb-3">
                    {p.badge && (
                      <span className="absolute top-0 left-0 bg-green-600 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full z-10 shadow-sm">
                        {p.badge}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full z-10 shadow-sm">
                        ลด {discount}%
                      </span>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image || '/yang.png'} alt={`${p.brand} ${p.model}`} className="h-full w-auto object-contain group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  <div className="h-4 md:h-5 mb-1.5 flex items-center justify-start overflow-hidden">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt={p.brand}
                        className={`h-full w-auto object-contain mix-blend-multiply ${['MICHELIN', 'BRIDGESTONE', 'PIRELLI'].includes(p.brand) ? 'scale-[1.8] origin-left' : 'origin-left'}`} />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500">{p.brand}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-[12px] md:text-[15px] leading-tight mb-1 truncate group-hover:text-green-700 transition-colors" title={p.model}>{p.model}</h3>
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <span className="font-mono text-[10px] md:text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded">{p.size}</span>
                    <span className="text-[9px] md:text-[10px] font-mono font-bold text-slate-400">ปี &apos;{p.year}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] md:text-[11px] font-medium mb-2">
                    {p.stock > 0 ? (
                      <><CheckCircle size={11} className="text-green-500" /><span className="text-green-600">มีสินค้า</span></>
                    ) : (
                      <><XCircle size={11} className="text-slate-300" /><span className="text-slate-400">หมด — จองล่วงหน้าได้</span></>
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="flex flex-col md:flex-row md:items-end gap-0.5 md:gap-2">
                      <span className="text-[15px] md:text-xl font-black text-green-600 leading-none">฿{p.priceCash.toLocaleString()}</span>
                      {p.oldPrice ? (
                        <span className="text-[9px] md:text-[11px] text-slate-400 line-through leading-none md:mb-0.5">฿{p.oldPrice.toLocaleString()}</span>
                      ) : null}
                    </div>
                    {p.priceInstallment > 0 && (
                      <p className="text-[9px] md:text-[10px] text-slate-400 mt-1">ผ่อน 0% ฿{p.priceInstallment.toLocaleString()}/ด.</p>
                    )}
                  </div>
                </Link>

                <div className="flex gap-1.5 md:gap-2 mt-3">
                  <Link href={`/tires/${p.id}`}
                    className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[10px] md:text-xs py-2 shadow-sm transition-colors flex items-center justify-center">
                    ดูรายละเอียด
                  </Link>
                  <AddToCartButton
                    tire={{ id: p.id, brand: p.brand, model: p.model, size: p.size, image: p.image, price: p.priceCash }}
                    className="w-8 md:w-9 flex items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 shrink-0 transition-colors"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => navigate({ page: page - 1 }, { resetPage: false })} disabled={page === 1 || isPending}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
            .reduce<(number | '...')[]>((acc, n, i, arr) => {
              if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
              acc.push(n); return acc;
            }, [])
            .map((n, i) => n === '...'
              ? <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-[11px] text-slate-400">…</span>
              : <button key={n} onClick={() => navigate({ page: n }, { resetPage: false })} disabled={isPending}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${page === n ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {n}
                </button>
            )}
          <button onClick={() => navigate({ page: page + 1 }, { resetPage: false })} disabled={page === totalPages || isPending}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
