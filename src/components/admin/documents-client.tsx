'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, FileText, Download, Eye, Clock, CheckCircle,
  XCircle, MoreHorizontal, ChevronLeft, ChevronRight,
  Import, X, Printer, CreditCard, Banknote, ArrowRightLeft,
  AlertCircle, FileEdit, LayoutGrid, Calendar, Phone, Car, Tag,
  Receipt, FileMinus, FileClock, Wallet, History, TrendingUp, ArrowRight, Settings, Wrench, Pencil, BookMarked,
} from 'lucide-react';
import type { DocRow, DocStats, PaymentMethod } from '@/lib/documents';
import { isDocEditable } from '@/lib/doc-editable';
import type { OrderBooking } from '@/lib/payment-settings';
import type { ProductRow } from '@/lib/products';
import { updateDocStatus, importFromBookings, deleteDocument, recordPartialPayment, updateDocCost } from '@/app/actions/documents';
import { DatePicker } from "@/components/ui/date-picker";

import { TYPE_LABEL, TYPE_STYLE, STATUS_LABEL, STATUS_STYLE, PAYMENT_LABEL, fmtDate, fmtMoney, StatusBadge, PAGE_SIZE } from './documents/shared';

import { RecordPaymentForm } from './documents/RecordPaymentForm';

// ── ViewModal ─────────────────────────────────────────────────────────────────
import { ViewModal } from './documents/ViewModal';

// ── ImportResultToast ─────────────────────────────────────────────────────────

import { Toast } from './documents/Toast';
// ── Main ──────────────────────────────────────────────────────────────────────

export function DocumentsClient({
  initialDocs,
  stats,
  bookingStatusMap,
  products,
}: {
  initialDocs: DocRow[];
  stats:       DocStats;
  bookingStatusMap: Record<string, OrderBooking>;
  products: ProductRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // description → costPrice lookup (key = "${brand} ${model} ${size}".toLowerCase())
  const costMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      const key = `${p.brand} ${p.model} ${p.size}`.trim().toLowerCase();
      if (key && p.costPrice > 0) m.set(key, p.costPrice);
    }
    return m;
  }, [products]);

  const [docs, setDocs] = useState(initialDocs);
  useEffect(() => { setDocs(initialDocs); }, [initialDocs]);

  // filters
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statFilter, setStatFilter] = useState('');
  const [vatFilter,  setVatFilter]  = useState(''); // '' = ทั้งหมด | 'vat' = มี VAT | 'novat' = ไม่มี VAT
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [page,       setPage]       = useState(1);

  // modals
  const [viewDoc, setViewDoc] = useState<DocRow | null>(null);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  // inline cost editing (ต้นทุนกรอกเองได้ — ราคายางเปลี่ยนได้)
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [costDraft,     setCostDraft]     = useState('');

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // filtered & paginated
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    // ค้นทะเบียนรถแบบไม่สนช่องว่าง/ขีด — พิมพ์ 'ญข929' ต้องเจอ 'ญข 929' ที่บันทึกไว้
    const qCompact = q.replace(/[\s-]+/g, '');
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime   = dateTo   ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    return docs.filter(d => {
      const issuedTime = new Date(d.issuedAt).getTime();
      const matchSearch = !q
        || d.docNumber.toLowerCase().includes(q)
        || d.customerName.toLowerCase().includes(q)
        || d.customerPhone.includes(q)
        || d.customerCar.toLowerCase().includes(q)
        || (!!qCompact && d.customerCar.toLowerCase().replace(/[\s-]+/g, '').includes(qCompact))
        || d.grandTotal.toString().includes(q)
        || fmtMoney(d.grandTotal).includes(q);
      const matchVat = !vatFilter
        || (vatFilter === 'vat' && d.vatAmount > 0)
        || (vatFilter === 'novat' && !(d.vatAmount > 0));
      return matchSearch && matchVat &&
        (!typeFilter || d.type === typeFilter) &&
        (!statFilter || d.status === statFilter) &&
        (!fromTime || issuedTime >= fromTime) &&
        (!toTime || issuedTime <= toTime);
    });
  }, [docs, search, typeFilter, statFilter, vatFilter, dateFrom, dateTo]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // สรุปต้นทุน + กำไรจาก docs ที่กรองอยู่ (เฉพาะ invoice/ใบเสร็จ)
  const costProfitSummary = useMemo(() => {
    let totalCost = 0;
    let totalRevenue = 0;
    for (const doc of filtered) {
      if (doc.type !== 'invoice') continue;
      totalRevenue += doc.grandTotal;
      if (doc.costPrice != null) {
        totalCost += doc.costPrice;
      } else {
        for (const item of doc.items) {
          totalCost += (costMap.get(item.description.trim().toLowerCase()) ?? 0) * item.qty;
        }
      }
    }
    return { totalCost, totalRevenue, profit: totalRevenue - totalCost };
  }, [filtered, costMap]);

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

  const saveCost = (id: string, value: number) => {
    if (!Number.isFinite(value) || value < 0) return;
    startTransition(async () => {
      const res = await updateDocCost(id, value);
      if (!res.success) { showToast(res.error ?? 'บันทึกต้นทุนไม่สำเร็จ', false); return; }
      setDocs(prev => prev.map(d => d.id === id ? { ...d, costPrice: value } : d));
      if (viewDoc?.id === id) setViewDoc(prev => prev ? { ...prev, costPrice: value } : prev);
      router.refresh();
      showToast('บันทึกต้นทุนแล้ว');
    });
  };

  const handleSaveCost = (id: string, currentCost: number) => {
    const value = parseFloat(costDraft);
    setEditingCostId(null);
    if (!Number.isFinite(value) || value === currentCost) return;
    saveCost(id, value);
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
            { label: 'รายรับ (Income)', label2: 'เดือนนี้', value: `฿${fmtMoney(stats.totalIncomeMonth)}`, sub: 'รวม', small: true, icon: <Wallet className="w-4 h-4 text-emerald-600" />, iconBg: 'bg-emerald-100/80 text-emerald-600', cardBg: 'bg-emerald-50/40 border-emerald-100/40', textColor: 'text-slate-800' },
            { label: 'รายจ่าย (Expense)', label2: 'เดือนนี้', value: `฿${fmtMoney(stats.totalExpenseMonth)}`, sub: 'รวม', small: true, icon: <TrendingUp className="w-4 h-4 text-rose-600" />, iconBg: 'bg-rose-100/80 text-rose-600', cardBg: 'bg-rose-50/40 border-rose-100/40', textColor: 'text-slate-800' },
          ].map((s: { label: string; label2: string; value: string; sub: string; small?: boolean; icon: React.ReactNode; iconBg: string; cardBg: string; textColor: string }) => (
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
                <p className={`${s.small ? 'text-xl' : 'text-4xl'} font-black text-slate-800 tracking-tight tabular-nums`}>{s.value}</p>
                <p className="text-[13px] font-bold text-slate-400">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cost & Profit Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
            <p className="text-[12px] font-bold text-slate-400 mb-1">ยอดขายรวม (ใบเสร็จ)</p>
            <p className="text-2xl font-black text-slate-800 tabular-nums">฿{fmtMoney(costProfitSummary.totalRevenue)}</p>
            <p className="text-[11px] text-slate-400 mt-1">{filtered.filter(d => d.type === 'invoice').length} ใบ {(dateFrom || dateTo) ? '(ตามช่วงที่เลือก)' : '(ทั้งหมด)'}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <p className="text-[12px] font-bold text-slate-400 mb-1">ต้นทุนรวม</p>
            <p className="text-2xl font-black text-orange-700 tabular-nums">฿{fmtMoney(costProfitSummary.totalCost)}</p>
            <p className="text-[11px] text-slate-400 mt-1">จากต้นทุนที่กรอกเอง หรือ costPrice ของสินค้า</p>
          </div>
          <div className={`rounded-2xl p-5 border ${costProfitSummary.profit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className="text-[12px] font-bold text-slate-400 mb-1">กำไรรวม</p>
            <p className={`text-2xl font-black tabular-nums ${costProfitSummary.profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              ฿{fmtMoney(costProfitSummary.profit)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {costProfitSummary.totalRevenue > 0
                ? `${((costProfitSummary.profit / costProfitSummary.totalRevenue) * 100).toFixed(1)}% margin`
                : 'ยังไม่มีข้อมูล'}
            </p>
          </div>
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
              placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า, ทะเบียนรถ, เบอร์โทร, ยอดเงิน..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-medium"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <DatePicker value={dateFrom} max={dateTo || undefined} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-400 bg-white" />
              <span className="text-slate-400 text-sm">–</span>
              <DatePicker value={dateTo} min={dateFrom || undefined} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-400 bg-white" />
            </div>
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
              <option value="booking_note">ใบจอง</option>
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
              <option value="reserved">จองแล้ว</option>
              <option value="deposit_paid">รับมัดจำแล้ว</option>
            </select>
            <select
              value={vatFilter}
              onChange={e => { setVatFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">VAT: ทั้งหมด</option>
              <option value="vat">มี VAT</option>
              <option value="novat">ไม่มี VAT</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-32 min-h-[300px]">
          <table className="w-full min-w-[960px] text-left border-collapse whitespace-nowrap md:whitespace-normal table-fixed">
            <colgroup>
              <col className="w-[21%]" />
              <col className="w-[18%]" />
              <col className="w-[11%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">เอกสาร</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ลูกค้า</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell text-right">ยอดเงิน</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell text-right">ต้นทุน</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell text-right">กำไร</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                      <FileText className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-600 font-bold text-lg mb-1">ไม่พบเอกสาร</p>
                    <p className="text-slate-400 text-sm">ลองเปลี่ยนเงื่อนไขการค้นหาใหม่</p>
                  </td>
                </tr>
              ) : paginated.map(d => {
                const rowCost = d.type === 'invoice'
                  ? (d.costPrice != null
                    ? d.costPrice
                    : d.items.reduce((sum, item) => sum + (costMap.get(item.description.trim().toLowerCase()) ?? 0) * item.qty, 0))
                  : null;
                const rowProfit = rowCost !== null ? d.grandTotal - rowCost : null;
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
                  <td className="px-5 py-3 hidden md:table-cell text-right" onClick={e => e.stopPropagation()}>
                    {rowCost !== null
                      ? editingCostId === d.id
                        ? (
                          <input
                            type="number" min={0} step="any" autoFocus
                            value={costDraft}
                            onChange={e => setCostDraft(e.target.value)}
                            onBlur={() => handleSaveCost(d.id, rowCost)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveCost(d.id, rowCost);
                              if (e.key === 'Escape') setEditingCostId(null);
                            }}
                            className="w-24 px-2 py-1 text-sm text-right font-semibold tabular-nums border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                          />
                        )
                        : (
                          <button
                            onClick={() => { setEditingCostId(d.id); setCostDraft(rowCost > 0 ? String(rowCost) : ''); }}
                            title="คลิกเพื่อกรอกต้นทุนเอง"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-slate-500 hover:text-blue-600 group/cost"
                          >
                            ฿{fmtMoney(rowCost)}
                            <Pencil size={11} className="text-slate-300 group-hover/cost:text-blue-500" />
                          </button>
                        )
                      : <p className="text-sm text-slate-300">—</p>}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-right">
                    {rowProfit !== null
                      ? <p className={`text-sm font-bold tabular-nums ${rowProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>฿{fmtMoney(rowProfit)}</p>
                      : <p className="text-sm text-slate-300">—</p>}
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
          costMap={costMap}
          onSaveCost={saveCost}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </div>
  );
}
