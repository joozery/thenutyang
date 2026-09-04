'use client';

import { useState } from 'react';
import { X, Printer, CreditCard, Banknote, FileEdit, LayoutGrid, Calendar, Phone, Car, Tag, Receipt, FileMinus, FileClock, FileText, Search, ArrowRight, CheckCircle, Clock, AlertCircle, XCircle, Pencil, ArrowRightLeft, History, BookMarked } from 'lucide-react';
import type { DocRow, PaymentMethod } from '@/lib/documents';
import { fmtDate, fmtMoney, StatusBadge, TYPE_LABEL, PAYMENT_LABEL } from './shared';
import { isDocEditable } from '@/lib/doc-editable';
import { RecordPaymentForm } from './RecordPaymentForm';
import { OrderBooking } from '@/lib/payment-settings';
import Link from 'next/link';

export function ViewModal({
  doc,
  onClose,
  onStatusChange,
  isPending,
  allDocs,
  onRecordPayment,
  recordPaymentPending,
  onPrint,
  bookingStatusMap,
  costMap,
  onSaveCost,
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
  costMap: Map<string, number>;
  onSaveCost: (id: string, cost: number) => void;
}) {
  const [editingCost, setEditingCost] = useState(false);
  const [costDraft,   setCostDraft]   = useState('');
  const payments = doc.type === 'billing_note' ? allDocs.filter(d => d.type === 'payment_note' && d.relatedDocId === doc.id) : [];
  const paidSoFar = payments.reduce((sum, p) => sum + p.grandTotal, 0);
  const remaining = Math.max(0, doc.grandTotal - paidSoFar);
  const bookingStatus = doc.bookingRef ? bookingStatusMap[doc.bookingRef] : undefined;

  const hasCostOverride = doc.costPrice != null;
  const totalCost = hasCostOverride
    ? doc.costPrice!
    : doc.items.reduce((sum, item) => sum + (costMap.get(item.description.trim().toLowerCase()) ?? 0) * item.qty, 0);
  const profit = doc.grandTotal - totalCost;

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
                 {doc.customerTaxId && <p className="text-xs text-slate-500 mt-1.5 font-medium">เลขผู้เสียภาษี: <span className="text-slate-700">{doc.customerTaxId}{doc.customerBranch ? ` (${doc.customerBranch})` : ''}</span></p>}
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

          {/* Cost & Profit */}
          {doc.grandTotal > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200/50 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-slate-400 tracking-wide">ต้นทุนรวม</p>
                  {!editingCost && (
                    <button
                      onClick={() => { setEditingCost(true); setCostDraft(doc.costPrice != null ? String(doc.costPrice) : String(totalCost)); }}
                      title="กรอกต้นทุนเอง"
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-blue-600"
                    >
                      <Pencil size={11} /> แก้ไข
                    </button>
                  )}
                </div>
                {editingCost ? (
                  <input
                    type="number" min={0} step="any" autoFocus
                    value={costDraft}
                    onChange={e => setCostDraft(e.target.value)}
                    onBlur={() => {
                      setEditingCost(false);
                      const v = parseFloat(costDraft);
                      if (Number.isFinite(v) && v >= 0) onSaveCost(doc.id, v);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                      if (e.key === 'Escape') { setCostDraft(String(totalCost)); setEditingCost(false); }
                    }}
                    className="w-full px-3 py-1.5 text-xl font-black text-slate-800 tabular-nums border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-2xl font-black text-slate-800 tabular-nums">฿{fmtMoney(totalCost)}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  {doc.costPrice != null ? 'ต้นทุนที่กรอกเอง' : 'คำนวณจาก costPrice ของสินค้า'}
                </p>
              </div>
              <div className={`rounded-xl p-5 shadow-sm border ${profit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <p className="text-[11px] font-bold text-slate-400 tracking-wide mb-2">กำไรสุทธิ</p>
                <p className={`text-2xl font-black tabular-nums ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  ฿{fmtMoney(profit)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {doc.grandTotal > 0 ? `${((profit / doc.grandTotal) * 100).toFixed(1)}% ของยอดขาย` : ''}
                </p>
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
                        <td className="px-5 py-3.5 text-right font-medium text-emerald-600">
                          {item.discount > 0
                            ? item.discountType === 'amt'
                              ? `฿${fmtMoney(item.discount)}`
                              : `${item.discount}%`
                            : '—'}
                        </td>
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
                {/* มัดจำแสดงทุกชนิดเอกสารที่พกยอดมา (ใบจอง/ใบเสนอราคา/ใบเสร็จที่ต่อยอดกันมา) */}
                {doc.depositAmount > 0 && (
                  <>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-green-700 font-medium flex items-center gap-1.5">
                        <CheckCircle size={13} /> มัดจำที่รับแล้ว{doc.relatedDocNumber && <span className="text-slate-400 font-normal">(ตามใบ {doc.relatedDocNumber})</span>}
                      </span>
                      <span className="text-green-700 font-bold tabular-nums">-฿{fmtMoney(doc.depositAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-green-100 pt-3 mt-1">
                      <span className="font-bold text-slate-800">ยอดคงเหลือ</span>
                      <span className="text-2xl font-black text-rose-700 tabular-nums tracking-tight">
                        ฿{fmtMoney(Math.max(0, doc.grandTotal - doc.depositAmount))}
                      </span>
                    </div>
                  </>
                )}
                {/* fallback: ใบเก่าที่ยังไม่ได้ประทับมัดจำลงใบ — ดึงจากสถานะการจองแทน */}
                {!(doc.depositAmount > 0) && bookingStatus && bookingStatus.depositStatus === 'verified' && bookingStatus.depositAmount > 0 && (
                  <>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                        <CheckCircle size={13} /> มัดจำที่รับแล้ว
                      </span>
                      <span className="text-emerald-600 font-bold tabular-nums">-฿{fmtMoney(bookingStatus.depositAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-emerald-100 pt-3 mt-1">
                      <span className="font-bold text-slate-800">ยอดคงชำระ</span>
                      <span className="text-2xl font-black text-blue-700 tabular-nums tracking-tight">
                        ฿{fmtMoney(Math.max(0, doc.grandTotal - bookingStatus.depositAmount))}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Booking note: appointment date */}
          {doc.type === 'booking_note' && doc.dueDate && (
            <div className="flex flex-wrap items-center gap-3 px-1">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg">
                <Calendar size={14} /> วันนัดรับรถ {fmtDate(doc.dueDate)}
              </span>
            </div>
          )}

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
            {['unpaid', 'pending_approval', 'issued', 'reserved', 'deposit_paid'].includes(doc.status) && (
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
                  href={`/admin/documents/new?from=${doc.id}&type=booking_note`}
                  className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-700 bg-rose-50 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors"
                >
                  <BookMarked size={16} /> ออกใบจองมัดจำ
                </Link>
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

            {doc.type === 'booking_note' && (doc.status === 'reserved' || doc.status === 'deposit_paid') && (
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                {doc.status === 'reserved' && (
                  <button
                    onClick={() => onStatusChange(doc.id, 'deposit_paid')}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-40 transition-colors shadow-sm"
                  >
                    <CheckCircle size={16} /> บันทึกรับมัดจำ
                  </button>
                )}
                {doc.status === 'deposit_paid' && doc.depositAmount > 0 && (
                  <Link
                    href={`/admin/documents/new?from=${doc.id}&type=invoice&deposit=1`}
                    className="flex items-center gap-2 px-4 py-2 border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors"
                  >
                    <Receipt size={16} className="text-emerald-600" /> ออกใบเสร็จมัดจำ ฿{doc.depositAmount.toLocaleString()}
                  </Link>
                )}
                <Link
                  href={`/admin/documents/new?from=${doc.id}&type=invoice`}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  <Receipt size={16} className="text-blue-500" /> ออกใบเสร็จเต็มจำนวน
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