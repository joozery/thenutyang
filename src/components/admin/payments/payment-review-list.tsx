'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Clock, ImageOff, Banknote, Landmark, Undo2, Paperclip } from 'lucide-react';
import { updateDepositAmount, verifyDepositManually, markBalancePaid, revertBalancePayment } from '@/app/actions/payment';
import type { PaymentReviewRow } from '@/lib/payment-settings';

const STATUS_BADGE: Record<PaymentReviewRow['depositStatus'], { label: string; className: string }> = {
  pending:       { label: 'ยังไม่ชำระ',   className: 'bg-slate-100 text-slate-500' },
  submitted:     { label: 'รอตรวจสอบ',   className: 'bg-amber-50 text-amber-600' },
  verified:      { label: 'ยืนยันแล้ว',   className: 'bg-green-50 text-green-600' },
  not_required:  { label: 'ไม่ต้องมัดจำ (มีสต๊อก)', className: 'bg-slate-50 text-slate-400' },
};

const fmt = (n: number) => n.toLocaleString();

function PaymentRow({ row }: { row: PaymentReviewRow }) {
  const [amount, setAmount] = useState(row.depositAmount);
  const [status, setStatus] = useState(row.depositStatus);
  const [balanceStatus, setBalanceStatus] = useState(row.balanceStatus);
  const [balanceMethod, setBalanceMethod] = useState(row.balancePaymentMethod);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function saveAmount() {
    startTransition(async () => {
      setError('');
      const result = await updateDepositAmount(row.ref, amount);
      if (result.error) setError(result.error);
    });
  }

  function verify() {
    startTransition(async () => {
      setError('');
      const result = await verifyDepositManually(row.ref);
      if (result.error) setError(result.error);
      else setStatus('verified');
    });
  }

  function payBalance(method: 'cash' | 'transfer') {
    startTransition(async () => {
      setError('');
      const result = await markBalancePaid(row.ref, method);
      if (result.error) setError(result.error);
      else { setBalanceStatus('paid'); setBalanceMethod(method); }
    });
  }

  function undoBalance() {
    startTransition(async () => {
      setError('');
      const result = await revertBalancePayment(row.ref);
      if (result.error) setError(result.error);
      else { setBalanceStatus('unpaid'); setBalanceMethod(''); }
    });
  }

  const badge = STATUS_BADGE[status];
  const remaining = balanceStatus === 'paid' ? 0 : Math.max(0, row.totalAmount - (status === 'verified' ? amount : 0));

  return (
    <div className="group hover:bg-slate-50/50 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center gap-4 p-5 md:px-6">
        <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative">
          {row.depositSlipUrl ? (
            <a href={row.depositSlipUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group/slip">
              <img src={row.depositSlipUrl} alt="สลิป" className="w-full h-full object-cover transition-transform group-hover/slip:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/slip:opacity-100 transition-opacity flex items-center justify-center">
                 <span className="text-[10px] text-white font-bold tracking-widest">VIEW</span>
              </div>
            </a>
          ) : (
            <ImageOff size={20} className="text-slate-300" />
          )}
        </div>

        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-black text-slate-800 text-sm tracking-wide">{row.ref}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${badge.className}`}>{badge.label}</span>
          </div>
          <p className="text-[13px] text-slate-500 truncate">{row.name} <span className="mx-1 text-slate-300">•</span> {row.phone} <span className="mx-1 text-slate-300">•</span> {row.tireName}</p>
          {row.depositVerifyNote && (
            <p className={`text-[11px] mt-1.5 inline-flex items-center gap-1 font-medium ${status === 'verified' ? 'text-green-600' : 'text-amber-600'}`}>
              <CheckCircle2 size={12} /> {status === 'verified' ? 'Slip2Go: ' : ''}{row.depositVerifyNote}
            </p>
          )}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        {status !== 'not_required' && (
          <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <span className="text-xs text-slate-400 pl-2 font-medium">มัดจำ ฿</span>
            <input
              type="number" min={0} value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              onBlur={saveAmount}
              disabled={isPending}
              className="w-20 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 py-1 px-1"
            />
          </div>
        )}

        {status === 'submitted' && (
          <button
            type="button" onClick={verify} disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0 shadow-md shadow-green-500/20 hover:shadow-lg hover:-translate-y-0.5"
          >
            <CheckCircle2 size={14} /> ยืนยันรับเงิน
          </button>
        )}
        {status === 'pending' && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-50 px-3 py-2 rounded-xl shrink-0"><Clock size={14} /> รอลูกค้าโอน</span>
        )}
      </div>

      {/* ยอดคงเหลือที่ต้องชำระตอนมารับสินค้า */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 md:px-6 pb-5 md:pl-[104px]">
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500">รวม ฿{fmt(row.totalAmount)}</span>
          <div className="w-px h-3 bg-slate-200"></div>
          <span className="text-[11px] font-black text-slate-800">เหลือ ฿{fmt(remaining)}</span>
        </div>

        {row.balanceSlipUrl && (
          <a href={row.balanceSlipUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-medium text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
            <Paperclip size={12} /> ดูสลิปคงเหลือ
          </a>
        )}

        <div className="flex-1"></div>

        {balanceStatus === 'paid' ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
            <CheckCircle2 size={14} /> จ่ายครบแล้ว ({balanceMethod === 'cash' ? 'เงินสด' : 'โอน'})
            <div className="w-px h-3 bg-green-200 mx-1"></div>
            <button type="button" onClick={undoBalance} disabled={isPending} className="text-green-600/50 hover:text-green-600 transition-colors" title="ยกเลิก/แก้ไข">
              <Undo2 size={14} />
            </button>
          </span>
        ) : remaining > 0 ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => payBalance('cash')} disabled={isPending}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">
              <Banknote size={14} className="text-slate-400" /> รับเงินสด
            </button>
            <button type="button" onClick={() => payBalance('transfer')} disabled={isPending}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">
              <Landmark size={14} className="text-slate-400" /> รับโอน
            </button>
          </div>
        ) : (
          <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">ไม่ต้องชำระเพิ่ม</span>
        )}

        {row.balanceVerifyNote && balanceStatus !== 'paid' && (
          <div className="w-full mt-1">
             <p className="text-[11px] text-amber-600 flex items-center gap-1"><CheckCircle2 size={12} /> Slip2Go: {row.balanceVerifyNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PaymentReviewList({ bookings }: { bookings: PaymentReviewRow[] }) {
  if (bookings.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-slate-300" />
        </div>
        <h3 className="text-slate-500 font-medium text-lg">ตรวจสอบครบหมดแล้ว</h3>
        <p className="text-slate-400 text-sm mt-1">ยังไม่มีรายการจองที่รอการตรวจสอบชำระเงิน</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {bookings.map((row) => (
        <PaymentRow key={row.ref} row={row} />
      ))}
    </div>
  );
}
