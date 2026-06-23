'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, FileText, Download, Eye, Clock, CheckCircle,
  XCircle, MoreHorizontal, ChevronLeft, ChevronRight,
  Import, X, Printer, CreditCard, Banknote, ArrowRightLeft,
  AlertCircle, FileEdit, LayoutGrid, Calendar, Phone, Car, Tag,
  Receipt, FileMinus,
} from 'lucide-react';
import type { DocRow, DocStats } from '@/lib/documents';
import { updateDocStatus, importFromBookings, deleteDocument } from '@/app/actions/documents';

// ── constants ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  invoice:     'ใบเสร็จ',
  quote:       'ใบเสนอราคา',
  credit_note: 'ใบลดหนี้',
};

const TYPE_STYLE: Record<string, string> = {
  invoice:     'bg-blue-50 text-blue-700 border-blue-200/50',
  quote:       'bg-purple-50 text-purple-700 border-purple-200/50',
  credit_note: 'bg-orange-50 text-orange-700 border-orange-200/50',
};

const STATUS_LABEL: Record<string, string> = {
  paid:             'ชำระแล้ว',
  unpaid:           'ค้างชำระ',
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

// ── ViewModal ─────────────────────────────────────────────────────────────────

function ViewModal({
  doc,
  onClose,
  onStatusChange,
  isPending,
}: {
  doc: DocRow;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  isPending: boolean;
}) {
  const PayIcon = doc.paymentMethod === 'cash' ? Banknote
    : doc.paymentMethod === 'transfer' ? ArrowRightLeft
    : CreditCard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-200/60 flex items-center justify-center">
              <FileText size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black text-slate-900 text-base">{doc.docNumber}</p>
                <StatusBadge status={doc.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{TYPE_LABEL[doc.type]} · ออกเมื่อ {fmtDate(doc.issuedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/documents/${doc.id}/print`} target="_blank" className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors shadow-sm bg-white border border-slate-200/60" title="พิมพ์">
              <Printer size={16} />
            </Link>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Customer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200/60 shadow-sm rounded-lg p-4 flex items-start gap-3">
               <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                 <Search className="w-4 h-4" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ข้อมูลลูกค้า</p>
                 <p className="font-bold text-slate-800 text-sm">{doc.customerName}</p>
                 {doc.customerPhone && <p className="text-[13px] font-medium text-slate-500 mt-0.5"><Phone className="w-3 h-3 inline mr-1" />{doc.customerPhone}</p>}
                 {doc.customerAddress && <p className="text-[11px] text-slate-400 mt-1">{doc.customerAddress}</p>}
                 {doc.customerTaxId && <p className="text-[11px] text-slate-400">เลขผู้เสียภาษี: {doc.customerTaxId}</p>}
               </div>
            </div>
            
            <div className="bg-white border border-slate-200/60 shadow-sm rounded-lg p-4 flex items-start gap-3">
               <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                 <Car className="w-4 h-4" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ข้อมูลอ้างอิง</p>
                 {doc.customerCar      && <p className="text-sm font-bold text-slate-800">{doc.customerCar}</p>}
                 {doc.relatedDocNumber && <p className="text-[13px] font-medium text-slate-500 mt-0.5">สร้างจาก: {doc.relatedDocNumber}</p>}
                 {doc.bookingRef       && <p className="text-[13px] font-medium text-slate-500 mt-0.5">Booking: {doc.bookingRef}</p>}
                 {!doc.customerCar && !doc.bookingRef && !doc.relatedDocNumber && <p className="text-xs text-slate-400 italic">ไม่มีข้อมูลอ้างอิง</p>}
               </div>
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white border border-slate-200/60 shadow-sm rounded-lg overflow-hidden">
            <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">รายการสินค้า</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5">รายการ</th>
                  <th className="text-center px-4 py-2.5 w-20">จำนวน</th>
                  <th className="text-right px-4 py-2.5 w-28">ราคา/หน่วย</th>
                  {doc.items.some(i => i.discount > 0) && (
                    <th className="text-right px-4 py-2.5 w-20">ส่วนลด</th>
                  )}
                  <th className="text-right px-4 py-2.5 w-28">รวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {doc.items.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{item.description}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-slate-600">{item.qty}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-600 tabular-nums">฿{fmtMoney(item.unitPrice)}</td>
                    {doc.items.some(i => i.discount > 0) && (
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                    )}
                    <td className="px-4 py-2.5 text-right font-black text-slate-800 tabular-nums">฿{fmtMoney(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Totals */}
            <div className="bg-slate-50/50 border-t border-slate-200 px-4 py-3">
              <div className="ml-auto w-full md:w-2/5 space-y-1.5">
                {[
                  ['ราคาก่อนหักส่วนลด', fmtMoney(doc.subtotal)],
                  ...(doc.discountTotal > 0 ? [['ส่วนลดรวม', `-฿${fmtMoney(doc.discountTotal)}`, 'text-emerald-600 font-bold']] : []),
                  doc.vatRate > 0 ? [`VAT ${doc.vatRate}%`, fmtMoney(doc.vatAmount)] : null,
                ].filter(Boolean).map((row) => {
                  const [label, value, cls] = row as string[];
                  return (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">{label}</span>
                      <span className={`tabular-nums font-semibold ${cls ?? 'text-slate-700'}`}>
                        {value.startsWith('-') ? value : `฿${value}`}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center border-t border-slate-200/80 pt-2 mt-2">
                  <span className="font-black text-slate-800 text-sm">ยอดรวมสุทธิ</span>
                  <span className="text-xl font-black text-green-600 tabular-nums">฿{fmtMoney(doc.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Payment */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60 flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ช่องทางการชำระเงิน</p>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <PayIcon size={16} className="text-blue-500" />
                {PAYMENT_LABEL[doc.paymentMethod]}
              </div>
            </div>
            
            {/* Note */}
            {doc.note && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 flex flex-col justify-center">
                <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1.5">หมายเหตุ</p>
                <p className="text-xs font-medium text-amber-800">{doc.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap gap-2 justify-end bg-slate-50/50">
          {doc.type === 'invoice' && doc.status === 'unpaid' && (
            <button
              onClick={() => onStatusChange(doc.id, 'paid')}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 shadow-sm"
            >
              <CheckCircle size={14} /> รับชำระเงิน
            </button>
          )}
          {doc.type === 'quote' && doc.status === 'pending_approval' && (
            <>
              <button
                onClick={() => onStatusChange(doc.id, 'accepted')}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-40 shadow-sm"
              >
                <CheckCircle size={14} /> อนุมัติ
              </button>
              <button
                onClick={() => onStatusChange(doc.id, 'rejected')}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 disabled:opacity-40 bg-white"
              >
                <XCircle size={14} /> ปฏิเสธ
              </button>
            </>
          )}
          {['unpaid', 'pending_approval', 'issued'].includes(doc.status) && (
            <button
              onClick={() => onStatusChange(doc.id, 'cancelled')}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-bold hover:bg-red-50 disabled:opacity-40 bg-white"
            >
              <XCircle size={14} /> ยกเลิก
            </button>
          )}
          {doc.type === 'quote' && (
            <>
              <Link
                href={`/admin/documents/new?from=${doc.id}&type=invoice`}
                className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 bg-white shadow-sm"
              >
                <Receipt size={14} /> ออกใบเสร็จจากใบนี้
              </Link>
              <Link
                href={`/admin/documents/new?from=${doc.id}&type=credit_note`}
                className="flex items-center gap-1.5 px-4 py-2 border border-orange-200 text-orange-600 rounded-lg text-sm font-bold hover:bg-orange-50 bg-white shadow-sm"
              >
                <FileMinus size={14} /> ออกใบลดหนี้จากใบนี้
              </Link>
            </>
          )}
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 bg-white shadow-sm">
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
}: {
  initialDocs: DocRow[];
  stats:       DocStats;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [docs, setDocs] = useState(initialDocs);
  useEffect(() => { setDocs(initialDocs); }, [initialDocs]);

  // filters
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statFilter, setStatFilter] = useState('');
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
      (!statFilter || d.status === statFilter),
    );
  }, [docs, search, typeFilter, statFilter]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusChange = (id: string, status: string) => {
    // ต้องเปิดแท็บแบบ synchronous ในตัว handler ทันที ไม่งั้นเบราว์เซอร์จะบล็อก popup
    // เพราะ window.open หลัง await ถือว่าหลุดจาก user-gesture แล้ว
    const willAutoPrint = status === 'accepted' && docs.find(d => d.id === id)?.type === 'quote';
    const printWindow = willAutoPrint ? window.open('about:blank', '_blank') : null;

    startTransition(async () => {
      const res = await updateDocStatus(id, status);
      if (res.error) {
        printWindow?.close();
        showToast(res.error, false);
        return;
      }
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status } : d));
      if (viewDoc?.id === id) setViewDoc(prev => prev ? { ...prev, status } : prev);
      router.refresh();
      showToast(STATUS_LABEL[status] ? `อัปเดตสถานะเป็น "${STATUS_LABEL[status]}"` : 'อัปเดตสำเร็จ');

      // อนุมัติใบเสนอราคาแล้ว — เปิดหน้าพิมพ์ในแท็บที่เตรียมไว้ทันที ไม่ต้องกดปุ่มพิมพ์แยก
      if (printWindow) {
        printWindow.location.href = `/admin/documents/${id}/print`;
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
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">บิล / เอกสาร <span className="text-slate-400 font-normal ml-1 text-xl">/ Documents</span></h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">จัดการใบเสร็จ ใบเสนอราคา และใบลดหนี้</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-lg px-4 py-2.5">
            <LayoutGrid className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">ทั้งหมด <span className="text-blue-600 font-bold ml-1">{docs.length}</span> ฉบับ</span>
          </div>
        </div>
      </div>

      {/* Action Bar & Stats */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Actions Container */}
        <div className="lg:w-1/4 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3">
            <Link
              href="/admin/documents/new"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Plus size={18} /> สร้างเอกสารใหม่
            </Link>
            <button
              onClick={handleImport}
              disabled={isPending}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 transition-colors"
            >
              <Import size={18} /> นำเข้าจากระบบจอง (Booking)
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-[#00B900] to-green-700 p-6 rounded-2xl shadow-lg shadow-green-600/20 text-white relative overflow-hidden flex-1 flex flex-col justify-center">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <p className="text-green-100 font-medium text-sm mb-1">ยอดรวมใบเสร็จเดือนนี้</p>
              <p className="text-3xl font-black drop-shadow-sm tracking-tight">฿{fmtMoney(stats.invoiceTotalMonth)}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
                <span>จากใบเสร็จที่ชำระแล้ว</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:w-3/4 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'ใบเสร็จรับเงินเดือนนี้', value: `${stats.invoiceCountMonth}`, sub: 'ใบ', icon: <FileText className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
            { label: 'บิลค้างชำระทั้งหมด',     value: `${stats.unpaidCount}`, sub: 'บิล', icon: <AlertCircle className="w-5 h-5 text-red-500" />, bg: 'bg-red-50' },
            { label: 'ใบเสนอราคารอตอบรับ',  value: `${stats.pendingQuoteCount}`, sub: 'ใบ', icon: <Clock className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
                  {s.icon}
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-4xl font-black text-slate-800 tracking-tight">{s.value}</p>
                  <p className="text-sm font-bold text-slate-500">{s.sub}</p>
                </div>
                <p className="text-sm font-semibold text-slate-500 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Filter bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50 rounded-t-2xl">
          <div className="relative flex-1 md:max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-medium"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">ทุกประเภท</option>
              <option value="invoice">ใบเสร็จรับเงิน</option>
              <option value="quote">ใบเสนอราคา</option>
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
              <option value="pending_approval">รอตอบรับ</option>
              <option value="accepted">อนุมัติแล้ว</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-32 min-h-[300px]">
          <table className="w-full text-left border-collapse whitespace-nowrap md:whitespace-normal">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">เอกสาร</th>
                <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">ลูกค้า</th>
                <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">ยอดเงิน</th>
                <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider text-center">จัดการ</th>
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
              ) : paginated.map(d => (
                <tr
                  key={d.id}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  onClick={() => setViewDoc(d)}
                >
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] text-slate-800 font-bold bg-slate-100/80 px-2.5 py-1 rounded-md w-fit border border-slate-200/50">{d.docNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${TYPE_STYLE[d.type] ?? 'bg-slate-100 text-slate-500'}`}>
                          {TYPE_LABEL[d.type]}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium pl-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(d.issuedAt)}
                        {d.source === 'booking' && (
                           <span className="ml-1 text-[9px] bg-indigo-50 text-indigo-500 px-1.5 rounded-sm font-bold tracking-wider">BOOKING</span>
                        )}
                        {d.relatedDocNumber && (
                           <span className="ml-1 text-[9px] bg-purple-50 text-purple-500 px-1.5 rounded-sm font-bold tracking-wider" title={`สร้างจาก ${d.relatedDocNumber}`}>จาก {d.relatedDocNumber}</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-800">{d.customerName}</p>
                      {d.customerCar && <p className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-1"><Car className="w-3.5 h-3.5 text-slate-400" />{d.customerCar}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell">
                    <p className={`text-sm font-black tabular-nums ${d.grandTotal < 0 ? 'text-orange-600' : 'text-slate-800'}`}>
                      {d.grandTotal < 0 ? `-฿${fmtMoney(Math.abs(d.grandTotal))}` : `฿${fmtMoney(d.grandTotal)}`}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-center" onClick={e => e.stopPropagation()}>
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-6 py-5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setViewDoc(d)}
                        className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/60 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5"
                        title="ดูรายละเอียด"
                      >
                        <Eye size={16} />
                      </button>
                      <Link
                        href={`/admin/documents/${d.id}/print`}
                        target="_blank"
                        className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/60 hover:bg-emerald-600 hover:text-white hover:border-transparent transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5"
                        title="พิมพ์เอกสาร"
                      >
                        <Printer size={16} />
                      </Link>
                      <div className="relative group/menu">
                        <button className="p-2.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-200 hover:text-slate-700 transition-all duration-200">
                          <MoreHorizontal size={16} />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-slate-100 rounded-xl shadow-xl z-10 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all">
                          {d.type === 'invoice' && d.status === 'unpaid' && (
                            <button
                              onClick={() => handleStatusChange(d.id, 'paid')}
                              className="w-full text-left px-4 py-3 text-sm text-emerald-600 hover:bg-emerald-50 rounded-t-xl font-bold flex items-center gap-2 border-b border-slate-50"
                            >
                              <CheckCircle size={14} /> รับชำระแล้ว
                            </button>
                          )}
                          {d.type === 'quote' && d.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(d.id, 'accepted')}
                                className="w-full text-left px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 rounded-t-xl font-bold flex items-center gap-2 border-b border-slate-50"
                              >
                                <CheckCircle size={14} /> อนุมัติ
                              </button>
                              <button
                                onClick={() => handleStatusChange(d.id, 'expired')}
                                className="w-full text-left px-4 py-3 text-sm text-slate-500 hover:bg-slate-50 font-bold flex items-center gap-2 border-b border-slate-50"
                              >
                                <Clock size={14} /> หมดอายุ
                              </button>
                            </>
                          )}
                          {d.type === 'quote' && (
                            <>
                              <Link
                                href={`/admin/documents/new?from=${d.id}&type=invoice`}
                                className="w-full text-left px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 font-bold flex items-center gap-2 border-b border-slate-50"
                              >
                                <Receipt size={14} /> ออกใบเสร็จจากใบนี้
                              </Link>
                              <Link
                                href={`/admin/documents/new?from=${d.id}&type=credit_note`}
                                className="w-full text-left px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 font-bold flex items-center gap-2 border-b border-slate-50"
                              >
                                <FileMinus size={14} /> ออกใบลดหนี้จากใบนี้
                              </Link>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-b-xl font-bold flex items-center gap-2"
                          >
                            <XCircle size={14} /> ลบเอกสาร
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
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
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </div>
  );
}
