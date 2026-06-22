'use client';

import { useActionState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { uploadDepositSlip } from '@/app/actions/payment';

type Props = {
  bookingRef: string;
  qrImage: string;
  depositAmount: number;
  initialStatus: 'pending' | 'submitted' | 'verified';
  initialVerifyNote?: string;
};

export function DepositPayment({ bookingRef, qrImage, depositAmount, initialStatus, initialVerifyNote }: Props) {
  const [state, formAction, isPending] = useActionState(uploadDepositSlip, null);
  const submitted = state?.ok || initialStatus !== 'pending';
  const verified = state?.verified ?? (initialStatus === 'verified');
  const reason = state?.verifyReason ?? initialVerifyNote;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">ชำระมัดจำ ฿{depositAmount.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">สแกน QR Code แล้วอัปโหลดสลิปเพื่อยืนยันการจอง</p>
        </div>
      </div>

      {submitted ? (
        <div className={`border rounded-xl p-4 flex items-start gap-3 ${verified ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
          <CheckCircle className={`w-6 h-6 shrink-0 ${verified ? 'text-green-500' : 'text-amber-500'}`} />
          <div>
            <p className={`text-sm ${verified ? 'text-green-700' : 'text-amber-700'}`}>
              {verified ? 'ตรวจสอบยอดชำระแล้ว ขอบคุณค่ะ' : 'ส่งสลิปแล้ว — ทีมงานกำลังตรวจสอบ'}
            </p>
            {!verified && reason && (
              <p className="text-xs text-amber-600 mt-1">{reason}</p>
            )}
          </div>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-red-600 text-sm">{state.error}</div>
          )}
          <input type="hidden" name="ref" value={bookingRef} />

          {qrImage ? (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mx-auto w-fit">
              <img src={qrImage} alt="QR Code ชำระเงิน" className="w-72 h-72 object-contain bg-white rounded-xl shadow-sm" />
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">ยังไม่ได้ตั้งค่า QR Code รับเงิน กรุณาติดต่อร้าน</p>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">อัปโหลดสลิปการโอน</label>
            <input
              type="file" name="file" accept="image/jpeg,image/png,image/webp" required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-600 file:font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {isPending ? 'กำลังอัปโหลด...' : 'ส่งสลิปยืนยันการชำระเงิน'}
          </button>
        </form>
      )}
    </div>
  );
}
