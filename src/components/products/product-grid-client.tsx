'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, MessageCircle, Package } from 'lucide-react';
import type { ProductRow } from '@/lib/products';
import type { BrandRow } from '@/app/actions/brands';

const LINE_OA = process.env.NEXT_PUBLIC_LINE_OA_ID ?? '131zpewj';

const fmt = (n: number) => n.toLocaleString('th-TH');

function ProductCard({ product, categoryKey }: { product: ProductRow; categoryKey: string }) {
  const detailHref = `/${categoryKey}/${product.id}`;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group flex flex-col">
      {/* คลิกรูป/ข้อมูลเพื่อดูรายละเอียด */}
      <Link href={detailHref} className="flex flex-col flex-1">
        {/* Image */}
        <div className="aspect-square bg-slate-50 overflow-hidden relative">
          {product.image && product.image !== '/yang.png' ? (
            <img
              src={product.image}
              alt={`${product.brand} ${product.model}`}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-slate-200" />
            </div>
          )}
          {product.badge && (
            <span className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow">
              {product.badge}
            </span>
          )}
          {product.oldPrice && product.oldPrice > product.priceCash && (
            <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              ลด {Math.round((1 - product.priceCash / product.oldPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 p-4 pb-0 gap-2">
          <div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {product.brand}
            </span>
          </div>
          <p className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
            {product.model}
            {product.size ? ` ${product.size}` : ''}
          </p>
          {product.note && (
            <p className="text-[11px] text-slate-400 line-clamp-2">{product.note}</p>
          )}

          {/* Price */}
          <div className="mt-auto pt-3 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-green-600">฿{fmt(product.priceCash)}</span>
            {product.oldPrice && product.oldPrice > product.priceCash && (
              <span className="text-xs text-slate-400 line-through">฿{fmt(product.oldPrice)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Buttons */}
      <div className="p-4 pt-3 space-y-2">
        <Link
          href={detailHref}
          className="flex items-center justify-center w-full py-2.5 rounded-xl border border-green-200 text-green-700 text-xs font-bold hover:bg-green-50 transition-colors"
        >
          ดูรายละเอียด
        </Link>
        <a
          href={`https://line.me/R/ti/p/@${LINE_OA}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#06C755] text-white text-xs font-bold hover:bg-[#05a849] transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          สอบถามราคา / สั่งซื้อ
        </a>
      </div>
    </div>
  );
}

export function ProductGridClient({
  initialProducts,
  initialBrands = [],
  categoryLabel,
  categoryKey,
}: {
  initialProducts: ProductRow[];
  initialBrands?: BrandRow[];
  categoryLabel: string;
  categoryKey: string;
}) {
  const [search, setSearch]           = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  const availableBrands = useMemo(
    () => [...new Set(initialProducts.map(p => p.brand))].sort(),
    [initialProducts]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initialProducts.filter(p => {
      const matchBrand  = !brandFilter || p.brand === brandFilter;
      const matchSearch = !q ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        (p.note ?? '').toLowerCase().includes(q);
      return matchBrand && matchSearch;
    });
  }, [initialProducts, brandFilter, search]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`ค้นหา${categoryLabel}...`}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Brand filter */}
        {availableBrands.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setBrandFilter('')}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                !brandFilter ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'
              }`}
            >
              ทั้งหมด
            </button>
            {availableBrands.map(b => (
              <button
                key={b}
                onClick={() => setBrandFilter(b === brandFilter ? '' : b)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  brandFilter === b ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result count */}
      <p className="text-sm text-slate-500 mb-4">
        {filtered.length === initialProducts.length
          ? `สินค้าทั้งหมด ${filtered.length} รายการ`
          : `พบ ${filtered.length} รายการ`}
        {brandFilter && <span className="ml-2 text-green-600 font-medium">· {brandFilter}</span>}
        {search && <span className="ml-2 text-green-600 font-medium">· "{search}"</span>}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">ไม่พบสินค้าที่ตรงกัน</p>
          <button
            onClick={() => { setSearch(''); setBrandFilter(''); }}
            className="mt-3 text-sm text-green-600 font-medium hover:underline"
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} categoryKey={categoryKey} />
          ))}
        </div>
      )}
    </div>
  );
}
