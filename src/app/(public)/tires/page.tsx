import { Suspense } from 'react';
import Link from 'next/link';
import { getProducts } from '@/lib/products';
import { CATEGORIES } from '@/lib/tires';
import { TiresTableClient } from '@/components/tires/tires-table-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ยางรถยนต์ | THENUTTIRE' };

export default async function TiresPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; rim?: string; category?: string; width?: string; series?: string }>;
}) {
  const { brand, rim, category, width, series } = await searchParams;
  
  let exactSize: string | undefined;
  if (width && series && rim) {
    exactSize = `${width}/${series}R${rim}`;
  }

  const results = await getProducts({
    brand,
    rimSize: rim && !width ? Number(rim) : undefined,
    category,
    size: exactSize,
    width,
    series,
    rim
  });

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">ยางรถยนต์</h1>
          <p className="text-slate-500 text-sm mt-1">
            {brand || category || rim || exactSize ? `พบ ${results.length} รายการ` : `สินค้าทั้งหมด ${results.length} รายการ`}
            {brand     && <span className="ml-2 text-green-600 font-medium">· {brand}</span>}
            {exactSize && <span className="ml-2 text-green-600 font-medium">· {exactSize}</span>}
            {!exactSize && rim && <span className="ml-2 text-green-600 font-medium">· ขอบ {rim}"</span>}
            {category  && <span className="ml-2 text-green-600 font-medium">· {CATEGORIES[category] || category}</span>}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8">
        {results.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-200">
            <p className="text-slate-400 text-lg">ไม่พบสินค้าที่ตรงกับตัวกรอง</p>
            <Link href="/tires" className="mt-4 inline-block text-green-600 font-medium hover:underline">ดูสินค้าทั้งหมด</Link>
          </div>
        ) : (
          <TiresTableClient initialProducts={results} />
        )}
      </div>
    </div>
  );
}
