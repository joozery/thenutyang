import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/products';
import { BRAND_LOGOS, CATEGORIES } from '@/lib/tires';
import { ArrowLeft, CheckCircle, XCircle, Zap, Shield, Star } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tire = await getProductById(id);
  if (!tire) return { title: 'ไม่พบสินค้า' };
  return { title: `${tire.brand} ${tire.model} ${tire.size} | THENUTTIRE` };
}

export default async function TireDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tire = await getProductById(id);
  if (!tire) notFound();

  const discount = tire.oldPrice
    ? Math.round(((tire.oldPrice - tire.priceCash) / tire.oldPrice) * 100)
    : 0;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/tires" className="flex items-center gap-1 hover:text-green-600 transition">
            <ArrowLeft className="w-4 h-4" /> ยางรถยนต์
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">{tire.brand} {tire.model}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 flex items-center justify-center min-h-[360px] relative">
            {tire.badge && (
              <span className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">{tire.badge}</span>
            )}
            {discount > 0 && (
              <span className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">ลด {discount}%</span>
            )}
            <img src={tire.image || '/yang.png'} alt={`${tire.brand} ${tire.model}`} className="max-h-72 w-auto object-contain" />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              {BRAND_LOGOS[tire.brand] && (
                <div className="h-7 mb-3 flex items-center">
                  <Image src={BRAND_LOGOS[tire.brand]} alt={tire.brand} width={120} height={28}
                    className={`h-full w-auto object-contain max-w-[120px] ${['MICHELIN', 'BRIDGESTONE', 'PIRELLI'].includes(tire.brand) ? 'scale-[1.8] origin-left' : 'origin-left'}`} />
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-4">{tire.model}</h1>
              <p className="text-slate-500 text-sm mt-1">{tire.size} · {CATEGORIES[tire.category]}</p>
            </div>

            {/* Price */}
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-green-600">฿{tire.priceCash.toLocaleString()}</span>
                <span className="text-sm text-slate-500 mb-1">/ เส้น (เงินสด)</span>
              </div>
              {tire.oldPrice && (
                <p className="text-sm text-slate-400 mt-1">
                  ราคาปกติ <span className="line-through">฿{tire.oldPrice.toLocaleString()}</span>
                  <span className="ml-2 text-amber-600 font-bold">ประหยัด ฿{(tire.oldPrice - tire.priceCash).toLocaleString()}</span>
                </p>
              )}
              {tire.priceCredit > 0 && (
                <p className="text-xs text-slate-500 mt-2">รูดบัตร ฿{tire.priceCredit.toLocaleString()} · ผ่อน 0% ฿{tire.priceInstallment.toLocaleString()}</p>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 text-sm font-medium">
              {tire.stock > 0 ? (
                <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-600">มีสินค้า {tire.stock} เส้น พร้อมจัดส่ง</span></>
              ) : (
                <><XCircle className="w-4 h-4 text-slate-400" /><span className="text-slate-500">สินค้าหมด — จองล่วงหน้าได้</span></>
              )}
            </div>

            {/* Specs */}
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ข้อมูลสเปค</p>
              </div>
              <div className="divide-y divide-slate-50">
                {[
                  { label: 'ขนาด',          value: tire.size },
                  { label: 'ขอบล้อ',         value: `${tire.rimSize} นิ้ว` },
                  { label: 'ดัชนีโหลด',      value: tire.specs?.load ?? '-' },
                  { label: 'ดัชนีความเร็ว',  value: tire.specs?.speed ?? '-' },
                  { label: 'ประเภท',          value: tire.specs?.type ?? CATEGORIES[tire.category] },
                  ...(tire.note ? [{ label: 'โปรโมชั่น', value: tire.note }] : []),
                ].map(row => (
                  <div key={row.label} className="flex px-4 py-2.5 text-sm">
                    <span className="w-36 text-slate-500">{row.label}</span>
                    <span className="font-medium text-slate-800">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Shield className="w-5 h-5" />, label: 'ยางแท้ 100%' },
                { icon: <Zap className="w-5 h-5" />,    label: 'ติดตั้งทันที' },
                { icon: <Star className="w-5 h-5" />,   label: 'รับประกันคุณภาพ' },
              ].map(f => (
                <div key={f.label} className="flex flex-col items-center gap-1.5 bg-white border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-green-600">{f.icon}</div>
                  <span className="text-[11px] text-slate-600 font-medium">{f.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex gap-3 pt-2">
              <Link href={`/booking?tireId=${tire.id}`}
                className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-green-200 text-sm">
                จองเลย / ขอใบเสนอราคา
              </Link>
              <Link href={`https://line.me/R/ti/p/@${process.env.NEXT_PUBLIC_LINE_OA_ID ?? '131zpewj'}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-[#06C755] text-[#06C755] hover:bg-green-50 font-bold text-sm transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19.952 12.447c0-4.41-4.42-7.997-9.852-7.997S.248 8.037.248 12.447c0 3.95 3.503 7.264 8.236 7.888.32.07.757.21.867.484.1.247.065.634.032.883l-.14.84c-.042.247-.195.966.846.527 1.04-.44 5.613-3.306 7.656-5.659 1.41-1.548 2.207-3.12 2.207-4.963z"/></svg>
                สอบถาม LINE
              </Link>
            </div>
            <p className="text-xs text-slate-400 text-center">ราคาต่อเส้น · ติดตั้ง ณ ร้าน · ผ่อน 0% สูงสุด 10 เดือน</p>
          </div>
        </div>
      </div>
    </div>
  );
}
