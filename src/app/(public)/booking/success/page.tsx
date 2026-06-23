import Link from 'next/link';
import { CheckCircle, Home, MessageCircle, Printer } from 'lucide-react';
import { CopyButton } from '@/components/booking/copy-button';
import { ClearCartOnSuccess } from '@/components/cart/clear-cart-on-success';
import { DepositPayment } from '@/components/booking/deposit-payment';
import { BalancePayment } from '@/components/booking/balance-payment';
import { getPaymentQrImage, getBookingsByOrderRef } from '@/lib/payment-settings';

export const metadata = { title: 'จองสำเร็จ | เดอะนัททายางยนต์' };

const LINE_OA_ID = process.env.LINE_OA_ID ?? 'thenutyang';

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; sent?: string; cart?: string }>;
}) {
  const { ref, sent, cart } = await searchParams;
  const quoteSent = sent === '1';
  const orderRef = ref ?? '';

  const [qrImage, order] = await Promise.all([
    getPaymentQrImage(),
    orderRef ? getBookingsByOrderRef(orderRef) : null,
  ]);

  return (
    <div className="bg-slate-50 min-h-screen px-4 py-12">
      <ClearCartOnSuccess shouldClear={cart === '1'} />
      <div className="max-w-2xl w-full mx-auto space-y-4">
        {/* Success card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-9 h-9 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">จองสำเร็จแล้ว!</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            ขอบคุณที่เลือกใช้บริการเดอะนัททายางยนต์
          </p>

          {orderRef && (
            <div className="mt-5 bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">หมายเลขการจองของคุณ</p>
              <p className="text-xl font-black text-green-600 tracking-widest">{orderRef}</p>
            </div>
          )}
        </div>

        {/* รายการที่จอง */}
        {order && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-1">รายการที่จอง</h2>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.ref} className="flex items-center justify-between py-3 text-sm gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{item.tireName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.quantity} เส้น</p>
                  </div>
                  <p className="font-bold text-slate-800 shrink-0">฿{item.totalAmount.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
              <span className="text-sm font-bold text-slate-700">ยอดรวมทั้งหมด</span>
              <span className="text-lg font-black text-green-600">฿{order.totalAmount.toLocaleString()}</span>
            </div>
            <Link
              href={`/booking/print?ref=${orderRef}`}
              target="_blank"
              className="mt-4 w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-2.5 rounded-xl transition-colors text-sm"
            >
              <Printer className="w-4 h-4" />
              พิมพ์ใบเสนอราคา / ดาวน์โหลด PDF
            </Link>
          </div>
        )}

        {/* ชำระมัดจำ / ยอดคงเหลือ — รวมยอดทุกรายการ ชำระทีเดียวจบ */}
        {order && (order.depositStatus !== 'not_required' && order.balanceStatus !== 'paid' || order.remainingAmount > 0 || order.balanceStatus === 'paid') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.depositStatus !== 'not_required' && order.balanceStatus !== 'paid' && (
              <DepositPayment
                bookingRef={orderRef}
                qrImage={qrImage}
                depositAmount={order.depositAmount}
                initialStatus={order.depositStatus}
                initialVerifyNote={order.depositVerifyNote}
              />
            )}

            {(order.remainingAmount > 0 || order.balanceStatus === 'paid') && (
              <BalancePayment
                bookingRef={orderRef}
                qrImage={qrImage}
                remainingAmount={order.remainingAmount}
                initialPaid={order.balanceStatus === 'paid'}
                initialVerifyNote={order.balanceVerifyNote}
              />
            )}
          </div>
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
                  {orderRef && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm font-bold text-green-600 select-all">
                        {orderRef}
                      </div>
                      <CopyButton text={orderRef} />
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
