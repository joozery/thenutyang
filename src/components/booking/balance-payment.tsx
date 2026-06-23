'use client';

import { useActionState } from 'react';
import { CheckCircle, Wallet } from 'lucide-react';
import { uploadBalanceSlip } from '@/app/actions/payment';

type Props = {
  bookingRef: string;
  qrImage: string;
  remainingAmount: number;
  initialPaid: boolean;
  initialVerifyNote?: string;
};

export function BalancePayment({ bookingRef, qrImage, remainingAmount, initialPaid, initialVerifyNote }: Props) {
  const [state, formAction, isPending] = useActionState(uploadBalanceSlip, null);
  const paid = state?.verified || initialPaid;
  const reason = state?.verifyReason ?? initialVerifyNote;
  const awaitingReview = !paid && !!reason;

  if (paid) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
        <p className="text-sm text-green-700">ชำระยอดคงเหลือครบแล้ว ขอบคุณค่ะ</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">ชำระยอดคงเหลือ ฿{remainingAmount.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">ไม่อยากรอจ่ายหน้าร้าน? โอนจ่ายล่วงหน้าได้เลย</p>
        </div>
      </div>

      {awaitingReview && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-amber-700 text-sm mb-4">
          ส่งสลิปแล้ว — ทีมงานกำลังตรวจสอบ{reason ? ` (${reason})` : ''}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-red-600 text-sm">{state.error}</div>
        )}
        <input type="hidden" name="ref" value={bookingRef} />

        {qrImage ? (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mx-auto w-fit flex justify-center">
            <img src={qrImage} alt="QR Code ชำระเงิน" className="w-auto h-auto max-w-full max-h-[360px] object-contain bg-white rounded-xl shadow-sm" />
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">ยังไม่ได้ตั้งค่า QR Code รับเงิน กรุณาติดต่อร้าน</p>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">อัปโหลดสลิปการโอน</label>
          <input
            type="file" name="file" accept="image/jpeg,image/png,image/webp" required
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl transition-colors text-sm"
        >
          {isPending ? 'กำลังอัปโหลด...' : 'ส่งสลิปชำระยอดคงเหลือ'}
        </button>
      </form>
    </div>
  );
}
