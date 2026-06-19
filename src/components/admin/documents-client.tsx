'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, FileText, Download, Eye, Clock, CheckCircle,
  XCircle, MoreHorizontal, ChevronLeft, ChevronRight,
  Import, X, Printer, CreditCard, Banknote, ArrowRightLeft,
  AlertCircle, FileEdit,
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
  invoice:     'bg-blue-100 text-blue-700',
  quote:       'bg-purple-100 text-purple-700',
  credit_note: 'bg-orange-100 text-orange-700',
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

const STATUS_STYLE: Record<string, string> = {
  paid:             'bg-emerald-100 text-emerald-700',
  unpaid:           'bg-red-100 text-red-600',
  cancelled:        'bg-slate-100 text-slate-400',
  pending_approval: 'bg-amber-100 text-amber-700',
  accepted:         'bg-blue-100 text-blue-700',
  rejected:         'bg-slate-100 text-slate-400',
  expired:          'bg-slate-100 text-slate-400',
  issued:           'bg-purple-100 text-purple-700',
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
  const Icon = status === 'paid' || status === 'accepted' || status === 'issued'
    ? CheckCircle
    : status === 'unpaid' || status === 'rejected' || status === 'cancelled' || status === 'expired'
    ? XCircle
    : Clock;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[status] ?? 'bg-slate-100 text-slate-500'}`}>
      <Icon size={10} />{STATUS_LABEL[status] ?? status}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <FileText size={16} className="text-green-600" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">{doc.docNumber}</p>
              <p className="text-xs text-slate-400">{TYPE_LABEL[doc.type]} · {fmtDate(doc.issuedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="พิมพ์">
              <Printer size={15} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Customer */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">ข้อมูลลูกค้า</p>
            <p className="font-bold text-slate-800">{doc.customerName}</p>
            {doc.customerPhone && <p className="text-sm text-slate-500">{doc.customerPhone}</p>}
            {doc.customerCar   && <p className="text-sm text-slate-500">{doc.customerCar}</p>}
            {doc.bookingRef    && <p className="text-xs text-slate-400">อ้างอิง Booking: {doc.bookingRef}</p>}
          </div>

          {/* Line items */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">รายการ</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-400 font-semibold">
                  <th className="text-left px-3 py-2 rounded-tl-lg">รายการ</th>
                  <th className="text-center px-3 py-2">จำนวน</th>
                  <th className="text-right px-3 py-2">ราคา/หน่วย</th>
                  {doc.items.some(i => i.discount > 0) && (
                    <th className="text-right px-3 py-2">ลด%</th>
                  )}
                  <th className="text-right px-3 py-2 rounded-tr-lg">รวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {doc.items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2.5 text-slate-800">{item.description}</td>
                    <td className="px-3 py-2.5 text-center text-slate-600">{item.qty}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">฿{fmtMoney(item.unitPrice)}</td>
                    {doc.items.some(i => i.discount > 0) && (
                      <td className="px-3 py-2.5 text-right text-emerald-600">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                    )}
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">฿{fmtMoney(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            {[
              ['ราคาก่อนหักส่วนลด', fmtMoney(doc.subtotal)],
              ...(doc.discountTotal > 0 ? [['ส่วนลดรวม', `-฿${fmtMoney(doc.discountTotal)}`, 'text-emerald-600']] : []),
              doc.vatRate > 0 ? [`VAT ${doc.vatRate}%`, fmtMoney(doc.vatAmount)] : null,
            ].filter(Boolean).map((row) => {
              const [label, value, cls] = row as string[];
              return (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className={`tabular-nums font-semibold ${cls ?? 'text-slate-700'}`}>
                    {value.startsWith('-') ? value : `฿${value}`}
                  </span>
                </div>
              );
            })}
            <div className="flex justify-between items-center border-t border-slate-200 pt-2">
              <span className="font-bold text-slate-700">ยอดรวมสุทธิ</span>
              <span className="text-xl font-black text-green-600 tabular-nums">฿{fmtMoney(doc.grandTotal)}</span>
            </div>
          </div>

          {/* Payment & status */}
          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <PayIcon size={14} className="text-slate-400" />
              {PAYMENT_LABEL[doc.paymentMethod]}
            </div>
            <StatusBadge status={doc.status} />
          </div>

          {doc.note && (
            <p className="text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-xl p-3">
              หมายเหตุ: {doc.note}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
          {doc.type === 'invoice' && doc.status === 'unpaid' && (
            <button
              onClick={() => onStatusChange(doc.id, 'paid')}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-40"
            >
              <CheckCircle size={14} /> รับชำระเงิน
            </button>
          )}
          {doc.type === 'quote' && doc.status === 'pending_approval' && (
            <>
              <button
                onClick={() => onStatusChange(doc.id, 'accepted')}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40"
              >
                <CheckCircle size={14} /> อนุมัติ
              </button>
              <button
                onClick={() => onStatusChange(doc.id, 'rejected')}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-40"
              >
                <XCircle size={14} /> ปฏิเสธ
              </button>
            </>
          )}
          {['unpaid', 'pending_approval', 'issued'].includes(doc.status) && (
            <button
              onClick={() => onStatusChange(doc.id, 'cancelled')}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-40"
            >
              <XCircle size={14} /> ยกเลิก
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ImportResultToast ─────────────────────────────────────────────────────────

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold ${ok ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
      {ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
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
    startTransition(async () => {
      const res = await updateDocStatus(id, status);
      if (res.error) { showToast(res.error, false); return; }
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status } : d));
      if (viewDoc?.id === id) setViewDoc(prev => prev ? { ...prev, status } : prev);
      router.refresh();
      showToast(STATUS_LABEL[status] ? `อัปเดตสถานะเป็น "${STATUS_LABEL[status]}"` : 'อัปเดตสำเร็จ');
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
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">บิล / เอกสาร</h1>
          <p className="text-sm text-slate-500 mt-1">เอกสารทั้งหมด {docs.length} ฉบับ</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleImport}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <Import size={15} /> นำเข้าจาก Booking
          </button>
          <Link
            href="/admin/documents/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
          >
            <Plus size={16} /> สร้างเอกสาร
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'ใบเสร็จเดือนนี้',     value: `${stats.invoiceCountMonth} ใบ`,                      color: 'text-slate-900' },
          { label: 'ยอดรวมเดือนนี้',       value: `฿${Math.round(stats.invoiceTotalMonth / 1000)}K`,  color: 'text-green-600' },
          { label: 'ค้างชำระ',             value: `${stats.unpaidCount} บิล`,                           color: 'text-red-600' },
          { label: 'ใบเสนอราคารอตอบรับ',  value: `${stats.pendingQuoteCount} ใบ`,                      color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400"
          >
            <option value="">ประเภท: ทั้งหมด</option>
            <option value="invoice">ใบเสร็จ</option>
            <option value="quote">ใบเสนอราคา</option>
            <option value="credit_note">ใบลดหนี้</option>
          </select>
          <select
            value={statFilter}
            onChange={e => { setStatFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400"
          >
            <option value="">สถานะ: ทั้งหมด</option>
            <option value="paid">ชำระแล้ว</option>
            <option value="unpaid">ค้างชำระ</option>
            <option value="pending_approval">รอตอบรับ</option>
            <option value="accepted">อนุมัติแล้ว</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="text-left px-4 py-3">เลขที่เอกสาร</th>
                <th className="text-left px-4 py-3">ประเภท</th>
                <th className="text-left px-4 py-3">ลูกค้า</th>
                <th className="text-right px-4 py-3">ยอดเงิน</th>
                <th className="text-left px-4 py-3">วันที่</th>
                <th className="text-center px-4 py-3">สถานะ</th>
                <th className="text-center px-4 py-3">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p>ไม่พบเอกสาร</p>
                  </td>
                </tr>
              ) : paginated.map(d => (
                <tr
                  key={d.id}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  onClick={() => setViewDoc(d)}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-slate-300 shrink-0" />
                      <span className="font-bold text-green-600">{d.docNumber}</span>
                      {d.source === 'booking' && (
                        <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-medium">Booking</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_STYLE[d.type] ?? 'bg-slate-100 text-slate-500'}`}>
                      {TYPE_LABEL[d.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-800">{d.customerName}</p>
                    {d.customerCar && <p className="text-xs text-slate-400">{d.customerCar}</p>}
                  </td>
                  <td className={`px-4 py-3.5 text-right font-bold tabular-nums ${d.grandTotal < 0 ? 'text-orange-600' : 'text-slate-800'}`}>
                    {d.grandTotal < 0 ? `-฿${fmtMoney(Math.abs(d.grandTotal))}` : `฿${fmtMoney(d.grandTotal)}`}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{fmtDate(d.issuedAt)}</td>
                  <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setViewDoc(d)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        title="ดู"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        title="ดาวน์โหลด"
                        onClick={() => showToast('ฟีเจอร์ PDF กำลังพัฒนา')}
                      >
                        <Download size={14} />
                      </button>
                      <div className="relative group">
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                          <MoreHorizontal size={14} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="w-full text-left px-3 py-2.5 text-xs text-red-500 hover:bg-red-50 rounded-xl font-semibold flex items-center gap-2"
                          >
                            <XCircle size={12} /> ลบเอกสาร
                          </button>
                          {d.type === 'invoice' && d.status === 'unpaid' && (
                            <button
                              onClick={() => handleStatusChange(d.id, 'paid')}
                              className="w-full text-left px-3 py-2.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded-xl font-semibold flex items-center gap-2"
                            >
                              <CheckCircle size={12} /> รับชำระแล้ว
                            </button>
                          )}
                          {d.type === 'quote' && d.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(d.id, 'accepted')}
                                className="w-full text-left px-3 py-2.5 text-xs text-blue-600 hover:bg-blue-50 rounded-xl font-semibold flex items-center gap-2"
                              >
                                <CheckCircle size={12} /> อนุมัติ
                              </button>
                              <button
                                onClick={() => handleStatusChange(d.id, 'expired')}
                                className="w-full text-left px-3 py-2.5 text-xs text-slate-500 hover:bg-slate-50 rounded-xl font-semibold flex items-center gap-2"
                              >
                                <Clock size={12} /> หมดอายุ
                              </button>
                            </>
                          )}
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
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            แสดง {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const n = page <= 3 ? i + 1 : page + i - 2;
              if (n < 1 || n > totalPages) return null;
              return (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${n === page ? 'bg-green-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {n}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
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
