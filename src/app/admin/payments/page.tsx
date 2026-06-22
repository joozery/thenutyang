import { getPaymentQrImage, getBookingsForPaymentReview } from '@/lib/payment-settings';
import { QrUploadForm } from '@/components/admin/payments/qr-upload-form';
import { PaymentReviewList } from '@/components/admin/payments/payment-review-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'การชำระเงิน/มัดจำ | Admin' };

export default async function AdminPaymentsPage() {
  const [qrImage, bookings] = await Promise.all([
    getPaymentQrImage(),
    getBookingsForPaymentReview(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">การชำระเงิน / มัดจำ</h1>
          <p className="text-sm text-slate-500 mt-1">ตรวจสอบสลิปการโอนเงินมัดจำ และตั้งค่า QR Code รับเงิน</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                รายการรอตรวจสอบ 
                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{bookings.length}</span>
              </h2>
            </div>
            <div className="flex-1">
              <PaymentReviewList bookings={bookings} />
            </div>
          </div>
        </div>
        
        <div className="xl:col-span-1">
          <QrUploadForm currentImage={qrImage} />
        </div>
      </div>
    </div>
  );
}
