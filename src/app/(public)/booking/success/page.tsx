import Link from 'next/link';
import { CheckCircle, Home, MessageCircle } from 'lucide-react';
import { CopyButton } from '@/components/booking/copy-button';
import { ClearCartOnSuccess } from '@/components/cart/clear-cart-on-success';
import { DepositPayment } from '@/components/booking/deposit-payment';
import { BalancePayment } from '@/components/booking/balance-payment';
import { getPaymentQrImage, getBookingByRef } from '@/lib/payment-settings';

export const metadata = { title: 'จองสำเร็จ | เดอะนัททายางยนต์' };

const LINE_OA_ID = process.env.LINE_OA_ID ?? 'thenutyang';

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; sent?: string; cart?: string }>;
}) {
  const { ref, sent, cart } = await searchParams;
  const quoteSent = sent === '1';
  const refs = ref ? ref.split(',').filter(Boolean) : [];
  const refsText = refs.join(', ');

  const [qrImage, primaryBooking] = await Promise.all([
    getPaymentQrImage(),
    refs[0] ? getBookingByRef(refs[0]) : null,
  ]);

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4 py-12">
      <ClearCartOnSuccess shouldClear={cart === '1'} />
      <div className="max-w-md w-full space-y-4">
        {/* Success card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-9 h-9 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">จองสำเร็จแล้ว!</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            ขอบคุณที่เลือกใช้บริการเดอะนัททายางยนต์
          </p>

          {refs.length > 0 && (
            <div className="mt-5 bg-green-50 border border-green-100 rounded-xl p-4 space-y-1">
              <p className="text-xs text-slate-500 mb-1">
                {refs.length > 1 ? `หมายเลขการจองของคุณ (${refs.length} รายการ)` : 'หมายเลขการจองของคุณ'}
              </p>
              {refs.map((r) => (
                <p key={r} className="text-xl font-black text-green-600 tracking-widest">{r}</p>
              ))}
            </div>
          )}
        </div>

        {primaryBooking && primaryBooking.depositStatus !== 'not_required' && primaryBooking.balanceStatus !== 'paid' && (
          <DepositPayment
            bookingRef={refs[0]}
            qrImage={qrImage}
            depositAmount={primaryBooking.depositAmount}
            initialStatus={primaryBooking.depositStatus}
            initialVerifyNote={primaryBooking.depositVerifyNote}
          />
        )}

        {primaryBooking && (primaryBooking.remainingAmount > 0 || primaryBooking.balanceStatus === 'paid') && (
          <BalancePayment
            bookingRef={refs[0]}
            qrImage={qrImage}
            remainingAmount={primaryBooking.remainingAmount}
            initialPaid={primaryBooking.balanceStatus === 'paid'}
            initialVerifyNote={primaryBooking.balanceVerifyNote}
          />
        )}

        {quoteSent ? (
          /* ส่งใบเสนอราคาผ่าน LINE แล้วทันที */
          <div className="bg-white rounded-2xl border border-[#06C755]/30 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#06C755] rounded-full flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M19.952 12.447c0-4.41-4.42-7.997-9.852-7.997S.248 8.037.248 12.447c0 3.95 3.503 7.264 8.236 7.888.32.07.757.21.867.484.1.247.065.634.032.883l-.14.84c-.042.247-.195.966.846.527 1.04-.44 5.613-3.306 7.656-5.659 1.41-1.548 2.207-3.12 2.207-4.963z"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">ส่งใบเสนอราคาให้คุณทาง LINE แล้ว! 🎉</p>
                <p className="text-xs text-slate-500 mt-0.5">กรุณาตรวจสอบ LINE ของคุณ</p>
              </div>
            </div>
            <div className="bg-[#06C755]/5 rounded-xl p-4 text-center">
              <MessageCircle className="w-8 h-8 text-[#06C755] mx-auto mb-2" />
              <p className="text-sm text-slate-600">
                ทีมงานจะติดต่อยืนยันการนัดหมายผ่าน LINE<br />
                ภายใน <span className="font-bold text-slate-800">30 นาที</span> (ในเวลาทำการ)
              </p>
            </div>
          </div>
        ) : (
          /* ยังไม่ได้ login — ให้ลูกค้าส่ง ref ใน LINE */
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#06C755] rounded-full flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M19.952 12.447c0-4.41-4.42-7.997-9.852-7.997S.248 8.037.248 12.447c0 3.95 3.503 7.264 8.236 7.888.32.07.757.21.867.484.1.247.065.634.032.883l-.14.84c-.042.247-.195.966.846.527 1.04-.44 5.613-3.306 7.656-5.659 1.41-1.548 2.207-3.12 2.207-4.963z"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">รับใบเสนอราคาผ่าน LINE</p>
                <p className="text-xs text-slate-500">ทำตามขั้นตอนด้านล่างเพื่อรับใบเสนอราคาทันที</p>
              </div>
            </div>

            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#06C755] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">เพิ่มเพื่อน LINE OA ของเรา</p>
                  <a
                    href={`https://line.me/R/ti/p/@${LINE_OA_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 bg-[#06C755] hover:bg-[#05b34a] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M19.952 12.447c0-4.41-4.42-7.997-9.852-7.997S.248 8.037.248 12.447c0 3.95 3.503 7.264 8.236 7.888.32.07.757.21.867.484.1.247.065.634.032.883l-.14.84c-.042.247-.195.966.846.527 1.04-.44 5.613-3.306 7.656-5.659 1.41-1.548 2.207-3.12 2.207-4.963z"/>
                    </svg>
                    เพิ่มเพื่อน @{LINE_OA_ID}
                  </a>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#06C755] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">ส่งหมายเลขการจองในแชท LINE</p>
                  {refsText && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm font-bold text-green-600 select-all">
                        {refsText}
                      </div>
                      <CopyButton text={refsText} />
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-1.5">คัดลอกและวางในแชท LINE เลยค่ะ</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#06C755] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">รับใบเสนอราคาทันที!</p>
                  <p className="text-xs text-slate-400 mt-0.5">ระบบจะส่งรายละเอียดราคาและวันนัดให้อัตโนมัติ</p>
                </div>
              </li>
            </ol>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-3 rounded-xl transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
          <Link
            href="/tires"
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            ดูยางเพิ่มเติม
          </Link>
        </div>
      </div>
    </div>
  );
}
