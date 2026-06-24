'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, FileText, Download, Eye, Clock, CheckCircle,
  XCircle, MoreHorizontal, ChevronLeft, ChevronRight,
  Import, X, Printer, CreditCard, Banknote, ArrowRightLeft,
  AlertCircle, FileEdit, LayoutGrid, Calendar, Phone, Car, Tag,
  Receipt, FileMinus, FileClock, Wallet, History, TrendingUp, ArrowRight, Settings, Wrench, Pencil,
} from 'lucide-react';
import type { DocRow, DocStats, PaymentMethod } from '@/lib/documents';
import { isDocEditable } from '@/lib/doc-editable';
import type { OrderBooking } from '@/lib/payment-settings';
import { updateDocStatus, importFromBookings, deleteDocument, recordPartialPayment } from '@/app/actions/documents';

// ── constants ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  invoice:      'ใบเสร็จ',
  quote:        'ใบเสนอราคา',
  credit_note:  'ใบลดหนี้',
  billing_note: 'ใบแจ้งหนี้',
  payment_note: 'ใบรับชำระ',
};

const TYPE_STYLE: Record<string, string> = {
  invoice:      'bg-blue-50 text-blue-700 border-blue-200/50',
  quote:        'bg-purple-50 text-purple-700 border-purple-200/50',
  credit_note:  'bg-orange-50 text-orange-700 border-orange-200/50',
  billing_note: 'bg-amber-50 text-amber-700 border-amber-200/50',
  payment_note: 'bg-teal-50 text-teal-700 border-teal-200/50',
};

const STATUS_LABEL: Record<string, string> = {
  paid:             'ชำระแล้ว',
  unpaid:           'ค้างชำระ',
  partial:          'ชำระบางส่วน',
  cancelled:        'ยกเลิก',
  pending_approval: 'รอตอบรับ',
  accepted:         'อนุมัติแล้ว',
  rejected:         'ปฏิเสธแล้ว',
  expired:          'หมดอายุ',
  issued:           'ออกแล้ว',
};

const STATUS_STYLE: Record<string, { label: string; className: string; dot: string }> = {
  paid:             { label: 'ชำระแล้ว', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', dot: 'bg-emerald-500' },
  unpaid:           { label: 'ค้างชำระ', className: 'bg-red-50 text-red-700 border-red-200/50', dot: 'bg-red-500' },
  partial:          { label: 'ชำระบางส่วน', className: 'bg-amber-50 text-amber-700 border-amber-200/50', dot: 'bg-amber-500' },
  cancelled:        { label: 'ยกเลิก', className: 'bg-slate-50 text-slate-500 border-slate-200/50', dot: 'bg-slate-400' },
  pending_approval: { label: 'รอตอบรับ', className: 'bg-amber-50 text-amber-700 border-amber-200/50', dot: 'bg-amber-500' },
  accepted:         { label: 'อนุมัติแล้ว', className: 'bg-blue-50 text-blue-700 border-blue-200/50', dot: 'bg-blue-500' },
  rejected:         { label: 'ปฏิเสธแล้ว', className: 'bg-slate-50 text-slate-500 border-slate-200/50', dot: 'bg-slate-400' },
  expired:          { label: 'หมดอายุ', className: 'bg-slate-50 text-slate-500 border-slate-200/50', dot: 'bg-slate-400' },
  issued:           { label: 'ออกแล้ว', className: 'bg-purple-50 text-purple-700 border-purple-200/50', dot: 'bg-purple-500' },
};

const PAYMENT_LABEL: Record<string, string> = {
  cash:        'เงินสด',
  transfer:    'โอนเงิน',
  credit_card: 'บัตรเครดิต',
  pending:     'รอชำระ',
};

const PAGE_SIZE = 20;

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

function fmtMoney(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: string }) {
  const st = STATUS_STYLE[status] || { label: status, className: 'bg-slate-50 text-slate-500 border-slate-200/50', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full border ${st.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ── RecordPaymentForm ─────────────────────────────────────────────────────────

function RecordPaymentForm({
  remaining,
  onSubmit,
  isPending,
}: {
  remaining: number;
  onSubmit: (amount: number, method: PaymentMethod, note: string) => void;
  isPending: boolean;
}) {
  const [amount, setAmount] = useState(remaining);
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [note, setNote]     = useState('');

  function submit() {
    if (!amount || amount <= 0 || amount > remaining + 0.01) return;
    onSubmit(amount, method, note);
    setNote('');
  }

  return (
    <div className="bg-white border border-slate-200/60 shadow-sm rounded-lg p-4 space-y-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">บันทึกรับชำระงวดนี้</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">จำนวนเงิน</label>
          <input
            type="number" min={0} max={remaining} value={amount || ''}
            onChange={e => setAmount(+e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">ช่องทาง</label>
          <select
            value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="cash">เงินสด</option>
            <option value="transfer">โอนเงิน</option>
            <option value="credit_card">บัตรเครดิต</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">หมายเหตุ (ถ้ามี)</label>
          <input
            value={note} onChange={e => setNote(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-400">คงเหลือ ฿{fmtMoney(remaining)}</p>
        <button
          type="button" onClick={submit}
          disabled={isPending || !amount || amount <= 0 || amount > remaining + 0.01}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-40 shadow-sm"
        >
          <Wallet size={14} /> บันทึกรับชำระ
        </button>
      </div>
    </div>
  );
}

// ── ViewModal ─────────────────────────────────────────────────────────────────

function ViewModal({
  doc,
  onClose,
  onStatusChange,
  isPending,
  allDocs,
  onRecordPayment,
  recordPaymentPending,
  onPrint,
  bookingStatusMap,
}: {
  doc: DocRow;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  isPending: boolean;
  allDocs: DocRow[];
  onRecordPayment: (billingNoteId: string, amount: number, method: PaymentMethod, note: string) => void;
  recordPaymentPending: boolean;
  onPrint: (id: string) => void;
  bookingStatusMap: Record<string, OrderBooking>;
}) {
  const payments = doc.type === 'billing_note' ? allDocs.filter(d => d.type === 'payment_note' && d.relatedDocId === doc.id) : [];
  const paidSoFar = payments.reduce((sum, p) => sum + p.grandTotal, 0);
  const remaining = Math.max(0, doc.grandTotal - paidSoFar);
  const bookingStatus = doc.bookingRef ? bookingStatusMap[doc.bookingRef] : undefined;

  const PayIcon = doc.paymentMethod === 'cash' ? Banknote
    : doc.paymentMethod === 'transfer' ? ArrowRightLeft
    : CreditCard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-slate-200/50">
        
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-white relative">
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-black text-slate-900 text-lg tracking-tight">{doc.docNumber}</h2>
                <StatusBadge status={doc.status} />
              </div>
              <p className="text-sm text-slate-500 mt-1 font-medium">{TYPE_LABEL[doc.type]} · ออกเมื่อ <span className="text-slate-700">{fmtDate(doc.issuedAt)}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDocEditable(doc.type, doc.status) && (
              <Link href={`/admin/documents/${doc.id}/edit`} className="flex items-center justify-center w-10 h-10 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="แก้ไขเอกสาร">
                <Pencil size={18} />
              </Link>
            )}
            <button onClick={() => onPrint(doc.id)} className="flex items-center justify-center w-10 h-10 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="พิมพ์">
              <Printer size={18} />
            </button>
            <button onClick={onClose} className="flex items-center justify-center w-10 h-10 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 bg-slate-50/30">
          
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200/50 rounded-xl p-5 shadow-sm flex gap-4">
               <div className="mt-1 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                 <Search size={16} />
               </div>
               <div>
                 <p className="text-[11px] font-bold text-slate-400 tracking-wide mb-1">ข้อมูลลูกค้า</p>
                 <p className="font-bold text-slate-800 text-[15px]">{doc.customerName}</p>
                 {doc.customerPhone && <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><Phone size={14} className="text-slate-400"/> {doc.customerPhone}</p>}
                 {doc.customerAddress && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{doc.customerAddress}</p>}
                 {doc.customerTaxId && <p className="text-xs text-slate-500 mt-1.5 font-medium">เลขผู้เสียภาษี: <span className="text-slate-700">{doc.customerTaxId}</span></p>}
               </div>
            </div>
            
            <div className="bg-white border border-slate-200/50 rounded-xl p-5 shadow-sm flex gap-4">
               <div className="mt-1 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                 <Car size={16} />
               </div>
               <div>
                 <p className="text-[11px] font-bold text-slate-400 tracking-wide mb-1">ข้อมูลอ้างอิง</p>
                 {doc.customerCar      && <p className="font-bold text-slate-800 text-[15px]">{doc.customerCar}</p>}
                 {doc.relatedDocNumber && <p className="text-sm text-slate-500 mt-1">สร้างจาก: <span className="font-medium text-slate-700">{doc.relatedDocNumber}</span></p>}
                 {doc.bookingRef       && <p className="text-sm text-slate-500 mt-1">Booking: <span className="font-medium text-slate-700">{doc.bookingRef}</span></p>}
                 {!doc.customerCar && !doc.bookingRef && !doc.relatedDocNumber && <p className="text-sm text-slate-400 italic mt-1">ไม่มีข้อมูลอ้างอิง</p>}
               </div>
            </div>
          </div>

          {/* สถานะการชำระเงิน (จากระบบจอง) — เอกสารที่ออกจาก booking เท่านั้น */}
          {bookingStatus && (
            <div className="bg-white border border-slate-200/50 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-slate-400 tracking-wide">สถานะการชำระเงิน (จากระบบจอง {bookingStatus.orderRef})</p>
                <Link
                  href={`/admin/payments?ref=${encodeURIComponent(bookingStatus.items[0]?.ref ?? '')}`}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  ไปจัดการการชำระเงิน <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
                  {bookingStatus.depositStatus === 'verified' ? <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                    : bookingStatus.depositStatus === 'submitted' ? <Clock size={15} className="text-amber-500 shrink-0" />
                    : bookingStatus.depositStatus === 'not_required' ? <AlertCircle size={15} className="text-slate-400 shrink-0" />
                    : <XCircle size={15} className="text-slate-400 shrink-0" />}
                  <div>
                    <p className="text-[11px] text-slate-400 leading-tight">มัดจำ</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                      {bookingStatus.depositStatus === 'verified' ? `ยืนยันแล้ว ฿${bookingStatus.depositAmount.toLocaleString()}`
                        : bookingStatus.depositStatus === 'submitted' ? 'รอตรวจสอบสลิป'
                        : bookingStatus.depositStatus === 'not_required' ? 'ไม่ต้องมัดจำ'
                        : 'ยังไม่ชำระ'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
                  {bookingStatus.balanceStatus === 'paid' ? <CheckCircle size={15} className="text-emerald-500 shrink-0" /> : <XCircle size={15} className="text-slate-400 shrink-0" />}
                  <div>
                    <p className="text-[11px] text-slate-400 leading-tight">ยอดคงเหลือ</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                      {bookingStatus.balanceStatus === 'paid' ? `จ่ายครบแล้ว ฿${bookingStatus.totalAmount.toLocaleString()}` : `ยังไม่ชำระ ฿${bookingStatus.remainingAmount.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Line items */}
          <div className="bg-white border border-slate-200/50 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
              <p className="text-sm font-bold text-slate-800">รายการสินค้า</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 font-medium">
                    <th className="text-left px-5 py-3 border-b border-slate-100">รายการ</th>
                    <th className="text-center px-5 py-3 border-b border-slate-100 w-24">จำนวน</th>
                    <th className="text-right px-5 py-3 border-b border-slate-100 w-32">ราคา/หน่วย</th>
                    {doc.items.some(i => i.discount > 0) && (
                      <th className="text-right px-5 py-3 border-b border-slate-100 w-24">ส่วนลด</th>
                    )}
                    <th className="text-right px-5 py-3 border-b border-slate-100 w-32">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doc.items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{item.description}</td>
                      <td className="px-5 py-3.5 text-center font-semibold text-slate-600">{item.qty}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">฿{fmtMoney(item.unitPrice)}</td>
                      {doc.items.some(i => i.discount > 0) && (
                        <td className="px-5 py-3.5 text-right font-medium text-emerald-600">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                      )}
                      <td className="px-5 py-3.5 text-right font-bold text-slate-800 tabular-nums">฿{fmtMoney(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Totals */}
            <div className="bg-slate-50 p-5 border-t border-slate-200 flex justify-end">
              <div className="w-full sm:w-1/2 md:w-2/5 lg:w-1/3 space-y-2.5">
                {[
                  ['ราคาก่อนหักส่วนลด', fmtMoney(doc.subtotal)],
                  ...(doc.discountTotal > 0 ? [['ส่วนลดรวม', `-฿${fmtMoney(doc.discountTotal)}`, 'text-emerald-600 font-bold']] : []),
                  doc.vatRate > 0 ? [`VAT ${doc.vatRate}% (รวมอยู่ในยอดข้างต้นแล้ว)`, fmtMoney(doc.vatAmount), 'text-slate-400'] : null,
                ].filter(Boolean).map((row) => {
                  const [label, value, cls] = row as string[];
                  return (
                    <div key={label} className="flex justify-between text-[13px]">
                      <span className="text-slate-500 font-medium">{label}</span>
                      <span className={`tabular-nums ${cls ?? 'text-slate-700 font-semibold'}`}>
                        {value.startsWith('-') ? value : `฿${value}`}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-3">
                  <span className="font-bold text-slate-800">ยอดรวมสุทธิ</span>
                  <span className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">฿{fmtMoney(doc.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing note: due date + payment history + record payment */}
          {doc.type === 'billing_note' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {doc.dueDate && (
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                    <Calendar size={14} /> ครบกำหนดชำระ {fmtDate(doc.dueDate)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                  ชำระแล้ว ฿{fmtMoney(paidSoFar)} · คงเหลือ ฿{fmtMoney(remaining)}
                </span>
              </div>

              {payments.length > 0 && (
                <div className="bg-white border border-slate-200/50 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                    <History size={14} className="text-slate-500" />
                    <p className="text-[13px] font-bold text-slate-700">ประวัติการรับชำระ</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {payments.map(p => (
                      <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 text-[13px] gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-700">{p.docNumber}</span>
                          <span className="text-slate-400 hidden sm:inline">•</span>
                          <span className="text-slate-500">{fmtDate(p.issuedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                          <span className="text-slate-500">{PAYMENT_LABEL[p.paymentMethod]}</span>
                          <span className="font-bold text-emerald-600 tabular-nums">฿{fmtMoney(p.grandTotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {doc.status !== 'paid' && doc.status !== 'cancelled' && remaining > 0 && (
                <RecordPaymentForm
                  remaining={remaining}
                  isPending={recordPaymentPending}
                  onSubmit={(amount, method, note) => onRecordPayment(doc.id, amount, method, note)}
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/50 shadow-sm flex flex-col gap-2">
              <p className="text-[11px] font-bold text-slate-400 tracking-wide">ช่องทางการชำระเงิน</p>
              <div className="flex items-center gap-2.5 text-[15px] font-bold text-slate-800">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-blue-500 shrink-0 border border-slate-100">
                  <PayIcon size={16} />
                </div>
                {PAYMENT_LABEL[doc.paymentMethod]}
              </div>
            </div>
            
            {/* Note */}
            {doc.note && (
              <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100 flex flex-col gap-2">
                <p className="text-[11px] font-bold text-amber-500 tracking-wide">หมายเหตุ</p>
                <p className="text-sm font-medium text-amber-800 leading-relaxed">{doc.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white">
          
          <div className="flex flex-wrap items-center gap-2">
            {doc.type === 'invoice' && doc.status === 'unpaid' && (
              <button
                onClick={() => onStatusChange(doc.id, 'paid')}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 transition-colors shadow-sm"
              >
                <CheckCircle size={16} /> รับชำระเงิน
              </button>
            )}
            {doc.type === 'quote' && doc.status === 'pending_approval' && (
              <>
                <button
                  onClick={() => onStatusChange(doc.id, 'accepted')}
                  disabled={isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-sm"
                >
                  <CheckCircle size={16} /> อนุมัติ
                </button>
                <button
                  onClick={() => onStatusChange(doc.id, 'rejected')}
                  disabled={isPending}
                  className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <XCircle size={16} /> ปฏิเสธ
                </button>
              </>
            )}
            {['unpaid', 'pending_approval', 'issued'].includes(doc.status) && (
              <button
                onClick={() => onStatusChange(doc.id, 'cancelled')}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 disabled:opacity-40 transition-colors"
              >
                <XCircle size={16} /> ยกเลิก
              </button>
            )}
            
            {doc.type === 'quote' && (
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <Link
                  href={`/admin/documents/new?from=${doc.id}&type=billing_note`}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  <FileClock size={16} className="text-amber-500" /> สร้างใบแจ้งหนี้
                </Link>
                <Link
                  href={`/admin/documents/new?from=${doc.id}&type=invoice`}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  <Receipt size={16} className="text-blue-500" /> สร้างใบเสร็จ
                </Link>
              </div>
            )}
          </div>
          
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors shrink-0">
            ปิดหน้าต่าง
          </button>
          
        </div>
      </div>
    </div>
  );
}

// ── ImportResultToast ─────────────────────────────────────────────────────────

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  return (
    <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] text-sm font-bold text-white transition-all transform animate-in slide-in-from-bottom-5 ${ok ? 'bg-slate-900' : 'bg-red-500'}`}>
      {ok ? <CheckCircle size={20} className="text-green-400" /> : <AlertCircle size={20} />}
      {msg}
      <button onClick={onClose} className="ml-3 opacity-70 hover:opacity-100 bg-white/10 p-1 rounded-lg transition-colors"><X size={16} /></button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function DocumentsClient({
  initialDocs,
  stats,
  bookingStatusMap,
}: {
  initialDocs: DocRow[];
  stats:       DocStats;
  bookingStatusMap: Record<string, OrderBooking>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [docs, setDocs] = useState(initialDocs);
  useEffect(() => { setDocs(initialDocs); }, [initialDocs]);

  // filters
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statFilter, setStatFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page,       setPage]       = useState(1);

  // modals
  const [viewDoc, setViewDoc] = useState<DocRow | null>(null);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // filtered & paginated
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return docs.filter(d =>
      (!q || d.docNumber.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q)) &&
      (!typeFilter || d.type === typeFilter) &&
      (!statFilter || d.status === statFilter) &&
      (!dateFilter || d.issuedAt.startsWith(dateFilter))
    );
  }, [docs, search, typeFilter, statFilter, dateFilter]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDirectPrint = (id: string) => {
    const existing = document.getElementById('print-iframe');
    if (existing) existing.remove();

    showToast('กำลังเตรียมพิมพ์เอกสาร...');
    const iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.className = 'fixed bottom-0 right-0 w-0 h-0 border-0';
    iframe.src = `/admin/documents/${id}/print`;
    
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
      }, 800);
    };
    document.body.appendChild(iframe);
  };

  const handleStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      const res = await updateDocStatus(id, status);
      if (res.error) {
        showToast(res.error, false);
        return;
      }
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status } : d));
      if (viewDoc?.id === id) setViewDoc(prev => prev ? { ...prev, status } : prev);
      router.refresh();
      showToast(STATUS_LABEL[status] ? `อัปเดตสถานะเป็น "${STATUS_LABEL[status]}"` : 'อัปเดตสำเร็จ');

      // อนุมัติใบเสนอราคาแล้ว — เปิดพิมพ์ทันที
      const willAutoPrint = status === 'accepted' && docs.find(d => d.id === id)?.type === 'quote';
      if (willAutoPrint) {
        handleDirectPrint(id);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('ต้องการลบเอกสารนี้?')) return;
    startTransition(async () => {
      const res = await deleteDocument(id);
      if (res.error) { showToast(res.error, false); return; }
      setDocs(prev => prev.filter(d => d.id !== id));
      if (viewDoc?.id === id) setViewDoc(null);
      router.refresh();
      showToast('ลบเอกสารแล้ว');
    });
  };

  const handleRecordPayment = (billingNoteId: string, amount: number, method: PaymentMethod, note: string) => {
    startTransition(async () => {
      const res = await recordPartialPayment(billingNoteId, amount, method, note);
      if (!res.success) { showToast(res.error ?? 'บันทึกไม่สำเร็จ', false); return; }
      if (viewDoc?.id === billingNoteId) {
        setViewDoc(prev => prev ? { ...prev, status: res.billingStatus ?? prev.status } : prev);
      }
      router.refresh();
      showToast(
        res.billingStatus === 'paid'
          ? `ชำระครบแล้ว — ออกใบเสร็จ ${res.invoiceDocNumber} ให้อัตโนมัติ`
          : 'บันทึกรับชำระสำเร็จ'
      );
    });
  };

  const handleImport = () => {
    startTransition(async () => {
      const res = await importFromBookings();
      if (res.error) { showToast(res.error, false); return; }
      if (res.imported === 0) {
        showToast(`ไม่มีรายการใหม่ (ข้ามแล้ว ${res.skipped} รายการ)`);
      } else {
        showToast(`นำเข้าสำเร็จ ${res.imported} รายการ (ข้าม ${res.skipped})`);
        router.refresh();
      }
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
            <FileText className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">บิล / เอกสาร</h1>
            <p className="text-[12px] sm:text-[13px] text-slate-400 mt-0.5 font-medium">จัดการใบเสร็จ ใบเสนอราคา และใบลดหนี้</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5">
            <LayoutGrid className="w-4 h-4 text-slate-500" />
            <span className="text-[13px] font-bold text-slate-600">ทั้งหมด <span className="text-blue-600 font-black ml-1">{docs.length}</span> <span className="font-medium text-slate-500">ฉบับ</span></span>
          </div>
          <Link
            href="/admin/documents/settings"
            title="ตั้งค่าเอกสาร / รายการบริการ"
            className="flex items-center justify-center w-11 h-11 rounded-xl border border-slate-200/80 text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-colors shrink-0"
          >
            <Settings size={18} />
          </Link>
        </div>
      </div>

      {/* Action Bar & Stats */}
      <div className="flex flex-col gap-5">
        
        {/* Top Row: Actions & Main Stat */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Actions */}
          <div className="lg:w-1/3 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-center gap-3">
            <Link
              href="/admin/documents/new"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#009e73] text-white rounded-xl font-bold text-sm hover:bg-[#008a65] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Plus size={18} /> สร้างเอกสารใหม่
            </Link>
            <button
              onClick={handleImport}
              disabled={isPending}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 transition-colors"
            >
              <Import size={18} className="text-slate-400" /> นำเข้าจากระบบจอง (Booking)
            </button>
            <Link
              href="/admin/documents/settings/services"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <Wrench size={18} className="text-slate-400" /> จัดการรายการบริการ/ค่าแรง
            </Link>
          </div>

          {/* Main Stat (Green Card) */}
          <div className="lg:w-2/3 bg-gradient-to-r from-[#10b981] to-[#059669] p-6 sm:p-8 rounded-2xl shadow-md text-white relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
                    <path d="M0,100 C150,200 250,0 400,100 C550,200 650,0 800,100 L800,200 L0,200 Z" fill="white" opacity="0.3"></path>
                    <path d="M0,150 C200,50 300,250 500,150 C650,50 750,200 800,150 L800,200 L0,200 Z" fill="white" opacity="0.15"></path>
                </svg>
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-emerald-50 font-medium text-[13px] mb-1">ยอดรวมใบเสร็จเดือนนี้</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl sm:text-5xl font-black drop-shadow-sm tracking-tight">฿{fmtMoney(stats.invoiceTotalMonth)}</p>
                </div>
                <p className="text-emerald-100 text-[12px] mt-2 flex items-center gap-1 font-medium">
                  <TrendingUp size={14} /> เพิ่มขึ้น 18.6% จากเดือนที่แล้ว
                </p>
              </div>
              <div className="shrink-0 hidden sm:block">
                <button className="inline-flex items-center justify-center gap-2 text-[13px] bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full backdrop-blur-sm font-bold border border-white/20 transition-colors">
                  ดูรายละเอียด <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {[
            { label: 'ใบเสร็จรับเงิน', label2: 'เดือนนี้', value: `${stats.invoiceCountMonth}`, sub: 'ใบ', icon: <FileText className="w-4 h-4 text-blue-600" />, iconBg: 'bg-blue-100/80 text-blue-600', cardBg: 'bg-blue-50/50 border-blue-100/40', textColor: 'text-slate-800' },
            { label: 'บิลค้างชำระ', label2: 'ทั้งหมด', value: `${stats.unpaidCount}`, sub: 'บิล', icon: <AlertCircle className="w-4 h-4 text-red-500" />, iconBg: 'bg-red-100/80 text-red-600', cardBg: 'bg-red-50/50 border-red-100/40', textColor: 'text-slate-800' },
            { label: 'ใบเสนอราคา', label2: 'รอดำเนินการ', value: `${stats.pendingQuoteCount}`, sub: 'ใบ', icon: <Clock className="w-4 h-4 text-amber-500" />, iconBg: 'bg-amber-100/80 text-amber-600', cardBg: 'bg-amber-50/40 border-amber-100/40', textColor: 'text-slate-800' },
            { label: 'ใบแจ้งหนี้', label2: `ค้างชำระ (฿${fmtMoney(stats.billingOutstandingTotal)})`, value: `${stats.billingOutstandingCount}`, sub: 'บิล', icon: <FileClock className="w-4 h-4 text-purple-600" />, iconBg: 'bg-purple-100/80 text-purple-600', cardBg: 'bg-purple-50/40 border-purple-100/40', textColor: 'text-slate-800' },
            { label: 'รายรับ (Income)', label2: 'เดือนนี้', value: `฿${(stats.totalIncomeMonth / 1000).toFixed(1)}k`, sub: 'รวม', icon: <Wallet className="w-4 h-4 text-emerald-600" />, iconBg: 'bg-emerald-100/80 text-emerald-600', cardBg: 'bg-emerald-50/40 border-emerald-100/40', textColor: 'text-slate-800' },
            { label: 'รายจ่าย (Expense)', label2: 'เดือนนี้', value: `฿${(stats.totalExpenseMonth / 1000).toFixed(1)}k`, sub: 'รวม', icon: <TrendingUp className="w-4 h-4 text-rose-600" />, iconBg: 'bg-rose-100/80 text-rose-600', cardBg: 'bg-rose-50/40 border-rose-100/40', textColor: 'text-slate-800' },
          ].map(s => (
            <div key={s.label} className={`${s.cardBg} rounded-2xl border p-5 shadow-[0_1px_3px_rgb(0,0,0,0.01)] hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between min-h-[130px]`}>
              <div className="absolute -right-6 -bottom-6 opacity-[0.04] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-500 pointer-events-none">
                <FileText size={110} className="text-slate-900" />
              </div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg} shadow-sm`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-700 leading-tight mb-0.5">{s.label}</p>
                  <p className="text-[11px] font-medium text-slate-400 line-clamp-1" title={s.label2}>{s.label2}</p>
                </div>
              </div>
              
              <div className="flex items-baseline gap-1.5 relative z-10 mt-5">
                <p className="text-4xl font-black text-slate-800 tracking-tight">{s.value}</p>
                <p className="text-[13px] font-bold text-slate-400">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Filter bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row flex-wrap gap-4 bg-slate-50/50 rounded-t-2xl">
          <div className="relative flex-1 md:min-w-[280px]">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-medium"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-400 bg-white"
            />
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">ทุกประเภท</option>
              <option value="invoice">ใบเสร็จรับเงิน</option>
              <option value="quote">ใบเสนอราคา</option>
              <option value="billing_note">ใบแจ้งหนี้</option>
              <option value="payment_note">ใบรับชำระ</option>
              <option value="credit_note">ใบลดหนี้</option>
            </select>
            <select
              value={statFilter}
              onChange={e => { setStatFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">ทุกสถานะ</option>
              <option value="paid">ชำระแล้ว</option>
              <option value="unpaid">ค้างชำระ</option>
              <option value="partial">ชำระบางส่วน</option>
              <option value="pending_approval">รอตอบรับ</option>
              <option value="accepted">อนุมัติแล้ว</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-32 min-h-[300px]">
          <table className="w-full min-w-[760px] text-left border-collapse whitespace-nowrap md:whitespace-normal table-fixed">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[24%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">เอกสาร</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ลูกค้า</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell text-right">ยอดเงิน</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                      <FileText className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-600 font-bold text-lg mb-1">ไม่พบเอกสาร</p>
                    <p className="text-slate-400 text-sm">ลองเปลี่ยนเงื่อนไขการค้นหาใหม่</p>
                  </td>
                </tr>
              ) : paginated.map(d => {
                const bs = d.bookingRef ? bookingStatusMap[d.bookingRef] : undefined;
                const bookingBadge = bs
                  ? bs.balanceStatus === 'paid'
                    ? { label: 'จ่ายครบแล้ว', cls: 'bg-emerald-50 text-emerald-600' }
                    : bs.depositStatus === 'verified'
                    ? { label: `มัดจำแล้ว ฿${bs.depositAmount.toLocaleString()}`, cls: 'bg-emerald-50 text-emerald-600' }
                    : bs.depositStatus === 'submitted'
                    ? { label: 'รอตรวจสอบมัดจำ', cls: 'bg-amber-50 text-amber-600' }
                    : bs.depositStatus === 'not_required'
                    ? null
                    : { label: 'ยังไม่มัดจำ', cls: 'bg-slate-100 text-slate-500' }
                  : d.source === 'booking'
                  ? { label: 'BOOKING', cls: 'bg-indigo-50 text-indigo-500' }
                  : null;
                return (
                <tr
                  key={d.id}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  onClick={() => setViewDoc(d)}
                >
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[12px] text-slate-800 font-bold bg-slate-100/80 px-2 py-0.5 rounded-md w-fit border border-slate-200/50 truncate">{d.docNumber}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${TYPE_STYLE[d.type] ?? 'bg-slate-100 text-slate-500'}`}>
                          {TYPE_LABEL[d.type]}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium pl-0.5 flex items-center gap-1.5 truncate">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {fmtDate(d.issuedAt)}
                        {bookingBadge && (
                           <span className={`text-[9px] px-1.5 rounded-sm font-bold tracking-wider shrink-0 ${bookingBadge.cls}`}>{bookingBadge.label}</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{d.customerName}</p>
                      {d.customerCar && <p className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate"><Car className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate">{d.customerCar}</span></p>}
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-right">
                    <p className={`text-sm font-black tabular-nums ${d.grandTotal < 0 ? 'text-orange-600' : 'text-slate-800'}`}>
                      {d.grandTotal < 0 ? `-฿${fmtMoney(Math.abs(d.grandTotal))}` : `฿${fmtMoney(d.grandTotal)}`}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setViewDoc(d)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/60 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all duration-200"
                        title="ดูรายละเอียด"
                      >
                        <Eye size={15} />
                      </button>
                      {isDocEditable(d.type, d.status) && (
                        <Link
                          href={`/admin/documents/${d.id}/edit`}
                          className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100/60 hover:bg-amber-600 hover:text-white hover:border-transparent transition-all duration-200"
                          title="แก้ไขเอกสาร"
                        >
                          <Pencil size={15} />
                        </Link>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDirectPrint(d.id); }}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/60 hover:bg-emerald-600 hover:text-white hover:border-transparent transition-all duration-200"
                        title="พิมพ์เอกสาร"
                      >
                        <Printer size={15} />
                      </button>
                      <div className="relative group/menu">
                        <button className="p-2 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-200 hover:text-slate-700 transition-all duration-200">
                          <MoreHorizontal size={15} />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200/60 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-10 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all origin-top-right scale-95 group-hover/menu:scale-100 p-1.5 flex flex-col gap-0.5">
                          {d.type === 'invoice' && d.status === 'unpaid' && (
                            <button
                              onClick={() => handleStatusChange(d.id, 'paid')}
                              className="w-full text-left px-3 py-2.5 text-[13px] text-emerald-600 hover:bg-emerald-50 rounded-lg font-bold flex items-center gap-2.5 transition-colors"
                            >
                              <CheckCircle size={15} /> รับชำระแล้ว
                            </button>
                          )}
                          {d.type === 'quote' && d.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(d.id, 'accepted')}
                                className="w-full text-left px-3 py-2.5 text-[13px] text-blue-600 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-2.5 transition-colors"
                              >
                                <CheckCircle size={15} /> อนุมัติใบเสนอราคา
                              </button>
                              <button
                                onClick={() => handleStatusChange(d.id, 'expired')}
                                className="w-full text-left px-3 py-2.5 text-[13px] text-slate-600 hover:bg-slate-100 rounded-lg font-bold flex items-center gap-2.5 transition-colors"
                              >
                                <Clock size={15} /> หมดอายุ
                              </button>
                            </>
                          )}
                          {d.type === 'quote' && (
                            <>
                              <div className="h-[1px] bg-slate-100 my-1 mx-2"></div>
                              <Link
                                href={`/admin/documents/new?from=${d.id}&type=billing_note`}
                                className="w-full text-left px-3 py-2.5 text-[13px] text-amber-600 hover:bg-amber-50 rounded-lg font-bold flex items-center gap-2.5 transition-colors"
                              >
                                <FileClock size={15} /> สร้างใบแจ้งหนี้อ้างอิงใบนี้
                              </Link>
                              <Link
                                href={`/admin/documents/new?from=${d.id}&type=invoice`}
                                className="w-full text-left px-3 py-2.5 text-[13px] text-blue-600 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-2.5 transition-colors"
                              >
                                <Receipt size={15} /> สร้างใบเสร็จอ้างอิงใบนี้
                              </Link>
                              <Link
                                href={`/admin/documents/new?from=${d.id}&type=credit_note`}
                                className="w-full text-left px-3 py-2.5 text-[13px] text-orange-600 hover:bg-orange-50 rounded-lg font-bold flex items-center gap-2.5 transition-colors"
                              >
                                <FileMinus size={15} /> สร้างใบลดหนี้อ้างอิงใบนี้
                              </Link>
                            </>
                          )}
                          <div className="h-[1px] bg-slate-100 my-1 mx-2"></div>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="w-full text-left px-3 py-2.5 text-[13px] text-red-600 hover:bg-red-50 rounded-lg font-bold flex items-center gap-2.5 transition-colors"
                          >
                            <XCircle size={15} /> ลบเอกสารนี้
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="p-4 sm:px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <p className="text-[13px] text-slate-500 font-medium">
              แสดง <span className="font-bold text-slate-700">{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</span> ถึง <span className="font-bold text-slate-700">{Math.min(page * PAGE_SIZE, filtered.length)}</span> จากทั้งหมด <span className="font-bold text-slate-700">{filtered.length}</span> รายการ
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center">
                <span className="text-[13px] font-bold text-slate-700 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                  หน้า {page} / {totalPages}
                </span>
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewDoc && (
        <ViewModal
          doc={viewDoc}
          onClose={() => setViewDoc(null)}
          onStatusChange={handleStatusChange}
          isPending={isPending}
          allDocs={docs}
          onRecordPayment={handleRecordPayment}
          recordPaymentPending={isPending}
          onPrint={handleDirectPrint}
          bookingStatusMap={bookingStatusMap}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </div>
  );
}
