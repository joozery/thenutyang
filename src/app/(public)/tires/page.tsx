import { Suspense } from 'react';
import { getTireListingPage, TIRE_SORTS, type TireSort } from '@/lib/products';
import { getBrands } from '@/app/actions/brands';
import { CATEGORIES } from '@/lib/tires';
import { TiresGridClient } from '@/components/tires/tires-grid-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ยางรถยนต์ | THENUTTIRE' };

type TiresSearchParams = {
  brand?: string; rim?: string; category?: string; width?: string; series?: string;
  q?: string; size?: string; sort?: string; page?: string;
};

export default async function TiresPage({
  searchParams,
}: {
  searchParams: Promise<TiresSearchParams>;
}) {
  const { brand, rim, category, width, series, q, size, sort, page } = await searchParams;

  const exactSize = width && series && rim ? `${width}/${series}R${rim}` : undefined;
  const sortKey: TireSort = (TIRE_SORTS as readonly string[]).includes(sort ?? '') ? (sort as TireSort) : 'recommended';

  // กรอง + แบ่งหน้าที่ฝั่ง server — ส่งไปหน้าเว็บแค่ 16 รายการต่อหน้า
  const [listing, brandRows] = await Promise.all([
    getTireListingPage({
      brand, rim, category, width, series, q, size,
      sort: sortKey,
      page: Number(page) || 1,
    }),
    getBrands(),
  ]);

  const hasFilter = !!(brand || category || rim || exactSize || q || size);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">ยางรถยนต์</h1>
          <p className="text-slate-500 text-sm mt-1">
            {hasFilter ? `พบ ${listing.total.toLocaleString()} รายการ` : `สินค้าทั้งหมด ${listing.total.toLocaleString()} รายการ`}
            {q         && <span className="ml-2 text-green-600 font-medium">· &ldquo;{q}&rdquo;</span>}
            {brand     && <span className="ml-2 text-green-600 font-medium">· {brand}</span>}
            {exactSize && <span className="ml-2 text-green-600 font-medium">· {exactSize}</span>}
            {!exactSize && size && <span className="ml-2 text-green-600 font-medium">· {size}</span>}
            {!exactSize && rim && <span className="ml-2 text-green-600 font-medium">· ขอบ {rim}&quot;</span>}
            {category  && <span className="ml-2 text-green-600 font-medium">· {CATEGORIES[category] || category}</span>}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8">
        <Suspense fallback={<div className="h-96 animate-pulse bg-slate-200 rounded-xl" />}>
          <TiresGridClient
            listing={listing}
            brandLogos={brandRows.map((b) => ({ name: b.name, logo: b.logo }))}
            current={{ brand: brand ?? '', size: size ?? '', q: q ?? '', sort: sortKey }}
          />
        </Suspense>
      </div>
    </div>
  );
}
