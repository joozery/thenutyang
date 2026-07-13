import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Zap, Shield, Star } from 'lucide-react';
import type { ProductRow } from '@/lib/products';
import { TireGallery } from '@/components/tires/tire-gallery';

const LINE_OA = process.env.NEXT_PUBLIC_LINE_OA_ID ?? '131zpewj';

export function ProductDetail({
  product,
  categoryKey,
  categoryLabel,
}: {
  product: ProductRow;
  categoryKey: string;
  categoryLabel: string;
}) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.priceCash) / product.oldPrice) * 100)
    : 0;

  const galleryImages = [...new Set([product.image || '/yang.png', ...(product.images ?? [])])].filter(Boolean);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href={`/${categoryKey}`} className="flex items-center gap-1 hover:text-green-600 transition">
            <ArrowLeft className="w-4 h-4" /> {categoryLabel}
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">{product.brand} {product.model}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image gallery — คลิกรูปเพื่อเปิด popup ดูขนาดใหญ่ */}
          <div>
            <TireGallery
              images={galleryImages}
              alt={`${product.brand} ${product.model}`}
              badge={product.badge}
              discount={discount}
            />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                {product.brand}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-3">{product.model}</h1>
              {product.size && <p className="text-slate-500 text-sm mt-1">{product.size} · {categoryLabel}</p>}
              {!product.size && <p className="text-slate-500 text-sm mt-1">{categoryLabel}</p>}
            </div>

            {/* Price */}
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-green-600">฿{product.priceCash.toLocaleString()}</span>
                <span className="text-sm text-slate-500 mb-1">(เงินสด)</span>
              </div>
              {product.oldPrice && (
                <p className="text-sm text-slate-400 mt-1">
                  ราคาปกติ <span className="line-through">฿{product.oldPrice.toLocaleString()}</span>
                  <span className="ml-2 text-amber-600 font-bold">ประหยัด ฿{(product.oldPrice - product.priceCash).toLocaleString()}</span>
                </p>
              )}
              {product.priceCredit > 0 && (
                <p className="text-xs text-slate-500 mt-2">รูดบัตร ฿{product.priceCredit.toLocaleString()}{product.priceInstallment > 0 && ` · ผ่อน 0% ฿${product.priceInstallment.toLocaleString()}`}</p>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 text-sm font-medium">
              {product.stock > 0 ? (
                <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-600">มีสินค้า {product.stock} ชิ้น พร้อมจำหน่าย</span></>
              ) : (
                <><XCircle className="w-4 h-4 text-slate-400" /><span className="text-slate-500">สินค้าหมด — สอบถามล่วงหน้าได้</span></>
              )}
            </div>

            {/* Details */}
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">รายละเอียดสินค้า</p>
              </div>
              <div className="divide-y divide-slate-50">
                {[
                  { label: 'ยี่ห้อ',   value: product.brand },
                  { label: 'รุ่น',     value: product.model },
                  ...(product.size ? [{ label: 'ขนาด/สเปค', value: product.size }] : []),
                  ...(product.type ? [{ label: 'ประเภท', value: product.type }] : []),
                  ...(product.note ? [{ label: 'หมายเหตุ', value: product.note }] : []),
                  ...(product.warranty ? [{ label: 'การรับประกัน', value: product.warranty }] : []),
                ].map(row => (
                  <div key={row.label} className="flex px-4 py-2.5 text-sm">
                    <span className="w-36 text-slate-500 shrink-0">{row.label}</span>
                    <span className="font-medium text-slate-800">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* รายละเอียดสินค้า */}
            {product.description && (
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">รายละเอียดสินค้า</p>
                </div>
                <p className="px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* การรับประกัน */}
            {product.warranty && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">การรับประกันสินค้า</p>
                  <p className="text-sm text-emerald-700 mt-0.5 whitespace-pre-line">{product.warranty}</p>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Shield className="w-5 h-5" />, label: 'สินค้าของแท้ 100%' },
                { icon: <Zap className="w-5 h-5" />,    label: 'บริการติดตั้งที่ร้าน' },
                { icon: <Star className="w-5 h-5" />,   label: 'รับประกันคุณภาพ' },
              ].map(f => (
                <div key={f.label} className="flex flex-col items-center gap-1.5 bg-white border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-green-600">{f.icon}</div>
                  <span className="text-[11px] text-slate-600 font-medium">{f.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href={`https://line.me/R/ti/p/@${LINE_OA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#06C755] hover:bg-[#05a849] text-white font-bold text-sm transition-colors shadow-lg shadow-green-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              สอบถามราคา / สั่งซื้อผ่าน LINE
            </a>
            <p className="text-xs text-slate-400 text-center">สอบถามสต็อกและนัดติดตั้งได้ทาง LINE หรือโทรหาร้านโดยตรง</p>
          </div>
        </div>
      </div>
    </div>
  );
}
