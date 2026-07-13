import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/products';
import { BRAND_LOGOS, CATEGORIES } from '@/lib/tires';
import { ArrowLeft, CheckCircle, XCircle, Zap, Shield, Star } from 'lucide-react';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { TireGallery } from '@/components/tires/tire-gallery';

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

  // รูปหลัก + รูปแกลเลอรี (ตัดซ้ำ/ค่าว่างออก)
  const galleryImages = [...new Set([tire.image || '/yang.png', ...(tire.images ?? [])])].filter(Boolean);

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
          {/* Image gallery — คลิกรูปเพื่อเปิด popup ดูขนาดใหญ่ */}
          <div>
            <TireGallery
              images={galleryImages}
              alt={`${tire.brand} ${tire.model}`}
              badge={tire.badge}
              discount={discount}
            />
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
              <AddToCartButton
                tire={{ id: tire.id, brand: tire.brand, model: tire.model, size: tire.size, image: tire.image, price: tire.priceCash }}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-green-600 text-green-600 hover:bg-green-50 font-bold py-3.5 px-6 rounded-xl transition-colors text-sm"
              >
                เพิ่มลงตะกร้า
              </AddToCartButton>
              <AddToCartButton
                tire={{ id: tire.id, brand: tire.brand, model: tire.model, size: tire.size, image: tire.image, price: tire.priceCash }}
                goToCart
                className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-green-200 text-sm">
                จองเลย / ขอใบเสนอราคา
              </AddToCartButton>
            </div>
            <div className="flex gap-3">
              <Link href={`https://line.me/R/ti/p/@${process.env.NEXT_PUBLIC_LINE_OA_ID ?? '131zpewj'}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[#06C755] text-[#06C755] hover:bg-green-50 font-bold text-sm transition-colors">
                <svg role="img" viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><title>LINE</title><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.5 12 .5S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314z"/></svg>
                สอบถาม LINE
              </Link>
            </div>
            <p className="text-xs text-slate-400 text-center">ราคาต่อเส้น · ติดตั้ง ณ ร้าน · ผ่อน 0% สูงสุด 4 เดือน</p>
          </div>
        </div>
      </div>
    </div>
  );
}
