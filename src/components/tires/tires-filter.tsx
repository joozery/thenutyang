'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { BRANDS, RIM_SIZES, CATEGORIES, BRAND_LOGOS } from '@/lib/tires';
import Image from 'next/image';

export function TiresFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeBrand = searchParams.get('brand') ?? '';
  const activeRim = searchParams.get('rim') ? Number(searchParams.get('rim')) : 0;
  const activeCategory = searchParams.get('category') ?? '';

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  const hasFilter = activeBrand || activeRim || activeCategory;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-5">
      {/* Brand */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">แบรนด์</p>
        <div className="flex flex-wrap gap-2">
          {BRANDS.map(brand => (
            <button
              key={brand}
              onClick={() => update('brand', activeBrand === brand ? '' : brand)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all
                ${activeBrand === brand
                  ? 'border-green-600 bg-green-50 text-green-600'
                  : 'border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-600'
                }`}
            >
              <Image
                src={BRAND_LOGOS[brand]}
                alt={brand}
                width={40}
                height={14}
                className="h-3.5 w-auto object-contain"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Rim size */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">ขนาดขอบ</p>
        <div className="flex flex-wrap gap-2">
          {RIM_SIZES.map(rim => (
            <button
              key={rim}
              onClick={() => update('rim', activeRim === rim ? '' : String(rim))}
              className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all
                ${activeRim === rim
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-600'
                }`}
            >
              {rim}"
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">ประเภท</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => update('category', activeCategory === key ? '' : key)}
              className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all
                ${activeCategory === key
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-600'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {hasFilter && (
        <button
          onClick={clearAll}
          className="text-xs text-green-600 hover:underline font-medium"
        >
          ล้างตัวกรองทั้งหมด
        </button>
      )}
    </div>
  );
}
