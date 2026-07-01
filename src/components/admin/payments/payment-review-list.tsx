'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, ImageOff, Banknote, Landmark, CreditCard, Undo2, Paperclip, RotateCcw, AlertTriangle } from 'lucide-react';
import { updateDepositAmount, verifyDepositManually, markBalancePaid, revertBalancePayment, refundDeposit } from '@/app/actions/payment';
import type { PaymentReviewRow } from '@/lib/payment-settings';

const STATUS_BADGE: Record<PaymentReviewRow['depositStatus'], { label: string; className: string }> = {
  pending:       { label: 'ยังไม่ชำระ',   className: 'bg-slate-100 text-slate-500' },
  submitted:     { label: 'รอตรวจสอบ',   className: 'bg-amber-50 text-amber-600' },
  verified:      { label: 'ยืนยันแล้ว',   className: 'bg-green-50 text-green-600' },
  not_required:  { label: 'ไม่ต้องมัดจำ (มีสต๊อก)', className: 'bg-slate-50 text-slate-400' },
};

const fmt = (n: number) => n.toLocaleString();

function PaymentRow({ row, highlighted }: { row: PaymentReviewRow; highlighted: boolean }) {
  const [amount, setAmount] = useState(row.depositAmount);
  const [status, setStatus] = useState(row.depositStatus);
  const [depositRefunded, setDepositRefunded] = useState(row.depositRefunded);
  const [balanceStatus, setBalanceStatus] = useState(row.balanceStatus);
  const [balanceMethod, setBalanceMethod] = useState(row.balancePaymentMethod);
  const [balanceReceivedAmount, setBalanceReceivedAmount] = useState(row.balanceReceivedAmount);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const remaining = balanceStatus === 'paid' ? 0 : Math.max(0, row.totalAmount - (status === 'verified' ? amount : 0));
  const [balanceAmount, setBalanceAmount] = useState(remaining);

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

  function doRefundDeposit() {
    if (!window.confirm(`ยืนยันคืนเงินมัดจำ ฿${fmt(amount)} ให้ลูกค้า ${row.name}?`)) return;
    startTransition(async () => {
      setError('');
      const result = await refundDeposit(row.ref);
      if (result.error) setError(result.error);
      else setDepositRefunded(true);
    });
  }

  function payBalance(method: 'cash' | 'transfer' | 'credit_card') {
    startTransition(async () => {
      setError('');
      const result = await markBalancePaid(row.ref, method, balanceAmount);
      if (result.error) setError(result.error);
      else { setBalanceStatus('paid'); setBalanceMethod(method); setBalanceReceivedAmount(balanceAmount); }
    });
  }

  function undoBalance() {
    startTransition(async () => {
      setError('');
      const result = await revertBalancePayment(row.ref);
      if (result.error) setError(result.error);
      else { setBalanceStatus('unpaid'); setBalanceMethod(''); setBalanceReceivedAmount(null); }
    });
  }

  const badge = STATUS_BADGE[status];
  // เตือนเบาๆ ถ้ายอดที่กรอกมากกว่ายอดคงเหลือที่ถูกต้อง (เทียบกับ remaining ไม่ใช่ totalAmount —
  // เผื่อกรณีมัดจำเป็น 10% ของยอด ยอดคงเหลือ 90% ก็ถือว่าถูกต้องแล้ว ไม่ควรเตือน)
  const looksLikeForgotDeposit = status === 'verified' && amount > 0 && balanceAmount > remaining * 1.01 + 0.01;

  useEffect(() => {
    if (!highlighted) return;
    document.getElementById(`payment-row-${row.ref}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlighted, row.ref]);

  return (
    <div
      id={`payment-row-${row.ref}`}
      className={`group hover:bg-slate-50/50 transition-colors ${highlighted ? 'ring-2 ring-inset ring-blue-400 bg-blue-50/40' : ''}`}
    >
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
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <span className="text-xs text-slate-400 pl-2 font-medium">มัดจำ ฿</span>
              <input
                type="number" min={0} value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                onBlur={saveAmount}
                disabled={isPending}
                className="w-20 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 py-1 px-1"
              />
            </div>
            {status === 'verified' && (
              depositRefunded ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <RotateCcw size={11} /> คืนมัดจำแล้ว
                </span>
              ) : (
                <button type="button" onClick={doRefundDeposit} disabled={isPending}
                  title="คืนเงินมัดจำให้ลูกค้า"
                  className="flex items-center gap-1 text-[11px] font-bold text-orange-500 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors disabled:opacity-50">
                  <RotateCcw size={11} /> คืนเงินมัดจำ
                </button>
              )
            )}
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
            <CheckCircle2 size={14} />
            จ่ายครบแล้ว ({balanceMethod === 'cash' ? 'เงินสด' : balanceMethod === 'credit_card' ? 'บัตรเครดิต' : 'โอน'}
            {balanceReceivedAmount != null && balanceReceivedAmount !== remaining ? ` · รับจริง ฿${fmt(balanceReceivedAmount)}` : ''})
            <div className="w-px h-3 bg-green-200 mx-1"></div>
            <button type="button" onClick={undoBalance} disabled={isPending} className="text-green-600/50 hover:text-green-600 transition-colors" title="ยกเลิก/แก้ไข">
              <Undo2 size={14} />
            </button>
          </span>
        ) : remaining > 0 && (status === 'verified' || status === 'not_required') ? (
          <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                <span className="text-[11px] text-slate-400 font-medium">รับจริง ฿</span>
                <input
                  type="number" min={0} value={balanceAmount}
                  onChange={(e) => setBalanceAmount(Number(e.target.value))}
                  disabled={isPending}
                  className="w-20 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 py-0.5 px-1"
                />
              </div>
              <button type="button" onClick={() => payBalance('cash')} disabled={isPending || !balanceAmount}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">
                <Banknote size={14} className="text-slate-400" /> เงินสด
              </button>
              <button type="button" onClick={() => payBalance('transfer')} disabled={isPending || !balanceAmount}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">
                <Landmark size={14} className="text-slate-400" /> โอน
              </button>
              <button type="button" onClick={() => payBalance('credit_card')} disabled={isPending || !balanceAmount}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">
                <CreditCard size={14} className="text-slate-400" /> บัตรเครดิต
              </button>
            </div>
            {looksLikeForgotDeposit && (
              <p className="text-[11px] text-orange-600 flex items-center gap-1">
                <AlertTriangle size={11} /> ยอดนี้ใกล้เคียงราคาเต็ม ลูกค้าหักมัดจำ ฿{fmt(amount)} ออกแล้วหรือยัง? ถ้าจ่ายซ้ำ กดคืนเงินมัดจำด้านบนได้
              </p>
            )}
          </div>
        ) : remaining > 0 ? (
          <span className="text-[11px] font-medium text-amber-500 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">รอตรวจสอบมัดจำก่อนจ่ายส่วนต่าง</span>
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
  const searchParams = useSearchParams();
  const highlightRef = searchParams.get('ref');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filterByDate = (list: PaymentReviewRow[]) => {
    return list.filter(b => {
      const d = new Date(b.createdAt);
      const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
      const to   = dateTo   ? new Date(dateTo   + 'T23:59:59') : null;
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    });
  };

  const pendingDeposits = filterByDate(bookings.filter(b => b.balanceStatus !== 'paid' && (b.depositStatus === 'pending' || b.depositStatus === 'submitted')));
  const pendingBalances = filterByDate(bookings.filter(b => b.balanceStatus === 'unpaid' && (b.depositStatus === 'verified' || b.depositStatus === 'not_required')));
  const completed       = filterByDate(bookings.filter(b => b.balanceStatus === 'paid'));

  const tabOf = (ref: string | null): 'deposit' | 'balance' | 'completed' => {
    const row = ref ? bookings.find(b => b.ref === ref) : undefined;
    if (!row) return 'deposit';
    if (row.balanceStatus === 'paid') return 'completed';
    if (row.depositStatus === 'verified' || row.depositStatus === 'not_required') return 'balance';
    return 'deposit';
  };

  const [activeTab, setActiveTab] = useState<'deposit' | 'balance' | 'completed'>(() => tabOf(highlightRef));
  useEffect(() => { if (highlightRef) setActiveTab(tabOf(highlightRef)); }, [highlightRef]);

  const getFilteredBookings = () => {
    if (activeTab === 'deposit') return pendingDeposits;
    if (activeTab === 'balance') return pendingBalances;
    return completed;
  };

  const displayedBookings = getFilteredBookings();

  return (
    <div className="flex flex-col h-full">
      {/* Date filter */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-slate-100 bg-white flex-wrap">
        <span className="text-xs font-medium text-slate-500 shrink-0">กรองวันที่</span>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100"
        />
        <span className="text-xs text-slate-400">—</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100"
        />
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            ล้าง
          </button>
        )}
      </div>

      <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 pt-4 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'deposit' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          รอมัดจำ
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'deposit' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{pendingDeposits.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('balance')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'balance' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          รอจ่ายส่วนต่าง
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'balance' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{pendingBalances.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'completed' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          เสร็จสิ้น
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{completed.length}</span>
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {displayedBookings.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-slate-300" />
            </div>
            <h3 className="text-slate-500 font-medium text-lg">ไม่มีรายการในหมวดหมู่นี้</h3>
            <p className="text-slate-400 text-sm mt-1">รายการทั้งหมดถูกจัดการเรียบร้อยแล้ว</p>
          </div>
        ) : (
          displayedBookings.map((row) => (
            <PaymentRow key={row.ref} row={row} highlighted={row.ref === highlightRef} />
          ))
        )}
      </div>
    </div>
  );
}
