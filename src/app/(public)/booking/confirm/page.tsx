import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getBookingByRef, getPaymentQrImage } from '@/lib/payment-settings';
import { DepositPayment } from '@/components/booking/deposit-payment';
import { BalancePayment } from '@/components/booking/balance-payment';

export const metadata = { title: 'ยืนยันการจอง | เดอะนัททายางยนต์' };

export default async function BookingConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const booking = ref ? await getBookingByRef(ref) : null;

  if (!booking) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <p className="text-slate-500">ไม่พบการจองหมายเลข {ref ?? ''}</p>
          <Link href="/" className="text-green-600 hover:underline mt-2 inline-block">กลับหน้าหลัก</Link>
        </div>
      </div>
    );
  }

  const qrImage = await getPaymentQrImage();

  return (
    <div className="bg-slate-50 min-h-screen px-4 py-8">
      <div className="max-w-md w-full mx-auto space-y-4">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-600 transition">
          <ArrowLeft className="w-4 h-4" /> กลับหน้าหลัก
        </Link>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-xs text-slate-400 mb-1">หมายเลขการจอง</p>
          <p className="text-xl font-black text-green-600 tracking-widest mb-4">{booking.ref}</p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">สินค้า</span>
              <span className="font-medium text-slate-800 text-right">{booking.tireName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">จำนวน</span>
              <span className="font-medium text-slate-800">{booking.quantity} เส้น</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ยอดรวม</span>
              <span className="font-bold text-slate-900">฿{booking.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500">ยอดคงเหลือชำระหน้าร้าน</span>
              <span className="font-bold text-green-600">฿{booking.remainingAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {booking.depositStatus !== 'not_required' && booking.balanceStatus !== 'paid' && (
          <DepositPayment
            bookingRef={booking.ref}
            qrImage={qrImage}
            depositAmount={booking.depositAmount}
            initialStatus={booking.depositStatus}
            initialVerifyNote={booking.depositVerifyNote}
          />
        )}

        {(booking.remainingAmount > 0 || booking.balanceStatus === 'paid') && (
          <BalancePayment
            bookingRef={booking.ref}
            qrImage={qrImage}
            remainingAmount={booking.remainingAmount}
            initialPaid={booking.balanceStatus === 'paid'}
            initialVerifyNote={booking.balanceVerifyNote}
          />
        )}
      </div>
    </div>
  );
}
