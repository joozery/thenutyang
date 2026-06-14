import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { filterTires, BRAND_LOGOS, CATEGORIES } from '@/lib/tires';
import { TiresFilter } from '@/components/tires/tires-filter';
import { ShoppingCart } from 'lucide-react';

export const metadata = { title: 'ยางรถยนต์ | เดอะนัททายางยนต์' };

export default async function TiresPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; rim?: string; category?: string }>;
}) {
  const { brand, rim, category } = await searchParams;
  const results = filterTires({
    brand,
    rimSize: rim ? Number(rim) : undefined,
    category,
  });

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">ยางรถยนต์</h1>
          <p className="text-slate-500 text-sm mt-1">
            {brand || category || rim
              ? `พบ ${results.length} รายการ`
              : `สินค้าทั้งหมด ${results.length} รายการ`}
            {brand && <span className="ml-2 text-rose-600 font-medium">· {brand}</span>}
            {rim && <span className="ml-2 text-rose-600 font-medium">· ขอบ {rim}"</span>}
            {category && <span className="ml-2 text-rose-600 font-medium">· {CATEGORIES[category]}</span>}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filter */}
          <aside className="w-full lg:w-64 shrink-0">
            <Suspense fallback={<div className="h-64 bg-white rounded-2xl animate-pulse" />}>
              <TiresFilter />
            </Suspense>
          </aside>

          {/* Product grid */}
          <main className="flex-1">
            {results.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center">
                <p className="text-slate-400 text-lg">ไม่พบสินค้าที่ตรงกับตัวกรอง</p>
                <Link href="/tires" className="mt-4 inline-block text-rose-600 font-medium hover:underline">
                  ดูสินค้าทั้งหมด
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {results.map(tire => (
                  <div key={tire.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg transition-shadow flex flex-col group">
                    {/* Image */}
                    <div className="relative h-40 flex items-center justify-center mb-4">
                      {tire.badge && (
                        <span className="absolute top-0 left-0 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10 shadow-sm">
                          {tire.badge}
                        </span>
                      )}
                      {!tire.inStock && (
                        <span className="absolute top-0 right-0 bg-slate-400 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10">
                          สินค้าหมด
                        </span>
                      )}
                      <img
                        src={tire.image}
                        alt={tire.model}
                        className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Brand logo */}
                    <div className="h-5 mb-2 flex items-center">
                      <Image
                        src={BRAND_LOGOS[tire.brand]}
                        alt={tire.brand}
                        width={80}
                        height={20}
                        className={`h-full w-auto object-contain max-w-[80px]
                          ${['MICHELIN', 'BRIDGESTONE', 'PIRELLI'].includes(tire.brand) ? 'scale-[1.8] origin-left' : 'origin-left'}`}
                      />
                    </div>

                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{tire.model}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 mb-3">{tire.size} · {tire.specs.type}</p>

                    <div className="mt-auto">
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-xl font-black text-rose-600">฿{tire.price.toLocaleString()}</span>
                        {tire.oldPrice && (
                          <span className="text-xs text-slate-400 line-through mb-0.5">฿{tire.oldPrice.toLocaleString()}</span>
                        )}
                        <span className="text-[10px] text-slate-400 mb-0.5">/เส้น</span>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/tires/${tire.id}`}
                          className="flex-1 text-center bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs py-2.5 transition-colors"
                        >
                          ดูรายละเอียด
                        </Link>
                        <Link
                          href={`/booking?tireId=${tire.id}`}
                          className="w-9 flex items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
