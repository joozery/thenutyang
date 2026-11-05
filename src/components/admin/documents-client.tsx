'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, FileText, Download, Eye, Clock, ChevronLeft, ChevronRight,
  Import, Printer, AlertCircle, LayoutGrid, Phone, Car,
  FileClock, Wallet, TrendingUp, ArrowRight, Settings, Wrench, Pencil,
} from 'lucide-react';
import type { DocRow, DocStats, PaymentMethod } from '@/lib/documents';
import { isDocEditable } from '@/lib/doc-editable';
import type { OrderBooking } from '@/lib/payment-settings';
import type { ProductCostRow } from '@/lib/products';
import { updateDocStatus, importFromBookings, deleteDocument, recordPartialPayment, updateDocCost, getDocumentsForExport, loadDocumentOverview } from '@/app/actions/documents';
import { DatePicker } from "@/components/ui/date-picker";

import { TYPE_LABEL, TYPE_STYLE, STATUS_LABEL, fmtDate, fmtMoney, StatusBadge } from './documents/shared';


// ── ViewModal ─────────────────────────────────────────────────────────────────
import { ViewModal } from './documents/ViewModal';

// ── ImportResultToast ─────────────────────────────────────────────────────────

import { Toast } from './documents/Toast';
import { RowMenu } from './documents/RowMenu';
// ── Main ──────────────────────────────────────────────────────────────────────

export function DocumentsClient({
  initialDocs,
  stats: initialStats,
  bookingStatusMap: initialBookingStatusMap,
  products,
  pagination,
  initialFilters,
  costProfitSummary: initialCostProfitSummary,
}: {
  initialDocs: DocRow[];
  stats:       DocStats | null;
  bookingStatusMap: Record<string, OrderBooking>;
  products: ProductCostRow[];
  pagination: { page: number; pageSize: number; totalItems: number; invoiceCount: number };
  initialFilters: { search: string; type: string; status: string; vat: string; dateFrom: string; dateTo: string };
  costProfitSummary: { totalCost: number; totalRevenue: number; profit: number } | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<DocStats>(initialStats ?? { invoiceCountMonth: 0, invoiceTotalMonth: 0, unpaidCount: 0, pendingQuoteCount: 0, billingOutstandingCount: 0, billingOutstandingTotal: 0, totalIncomeMonth: 0, totalExpenseMonth: 0 });
  const [bookingStatusMap, setBookingStatusMap] = useState(initialBookingStatusMap);
  const [costProfitSummary, setCostProfitSummary] = useState(initialCostProfitSummary ?? { totalCost: 0, totalRevenue: 0, profit: 0 });

  useEffect(() => {
    let active = true;
    loadDocumentOverview({ filters: { page: pagination.page, pageSize: pagination.pageSize, search: initialFilters.search, type: initialFilters.type, status: initialFilters.status, vat: initialFilters.vat, dateFrom: initialFilters.dateFrom, dateTo: initialFilters.dateTo } })
      .then((overview) => {
        if (!active) return;
        setStats(overview.stats);
        setBookingStatusMap(overview.bookingStatusMap);
        setCostProfitSummary(overview.costProfitSummary);
      });
    return () => { active = false; };
  }, [initialFilters, pagination.page, pagination.pageSize]);


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
  const [search,     setSearch]     = useState(initialFilters.search);
  const [typeFilter, setTypeFilter] = useState(initialFilters.type);
  const [statFilter, setStatFilter] = useState(initialFilters.status);
  const [vatFilter,  setVatFilter]  = useState(initialFilters.vat);
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom);
  const [dateTo,   setDateTo]   = useState(initialFilters.dateTo);

  useEffect(() => {
    setSearch(initialFilters.search);
    setTypeFilter(initialFilters.type);
    setStatFilter(initialFilters.status);
    setVatFilter(initialFilters.vat);
    setDateFrom(initialFilters.dateFrom);
    setDateTo(initialFilters.dateTo);
  }, [initialFilters]);

  const navigateWithFilters = (overrides: Record<string, string | number | undefined> = {}) => {
    const values = {
      search, type: typeFilter, status: statFilter, vat: vatFilter, dateFrom, dateTo,
      page: pagination.page, ...overrides,
    };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== '') params.set(key, String(value));
    }
    router.replace(`/admin/documents${params.toString() ? `?${params.toString()}` : ''}`);
  };

  useEffect(() => {
    if (search === initialFilters.search) return;
    const timer = window.setTimeout(() => navigateWithFilters({ search, page: 1 }), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

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

  const paginated = docs;
  const totalPages = Math.max(1, Math.ceil(pagination.totalItems / pagination.pageSize));

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

  const handleExportExcel = async () => {
    try {
      showToast('กำลังเตรียมไฟล์ Excel...');
      const xlsx = await import('xlsx');
       const exportDocs = await getDocumentsForExport({
         search, type: typeFilter, status: statFilter, vat: vatFilter, dateFrom, dateTo,
       });
       const exportData = exportDocs.map(d => ({
        'เลขเอกสาร': d.docNumber,
        'วันที่': new Date(d.issuedAt).toLocaleDateString('th-TH'),
        'ประเภท': TYPE_LABEL[d.type] || d.type,
        'ลูกค้า': d.customerName,
        'เบอร์โทร': d.customerPhone,
        'ป้ายทะเบียน': d.customerCar,
        'ยอดรวม': d.grandTotal,
        'สถานะ': STATUS_LABEL[d.status] || d.status,
      }));
      const ws = xlsx.utils.json_to_sheet(exportData);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Documents");
      xlsx.writeFile(wb, `documents_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถส่งออกไฟล์ได้', false);
    }
  };

  // ── ค่าที่คำนวณต่อแถว (ใช้ทั้งตารางและการ์ดบนมือถือ) ──
  const rows = paginated.map((d) => {
    const rowCost = d.type === 'invoice'
      ? (d.costPrice != null
        ? d.costPrice
        : d.items.reduce((sum, item) => sum + (costMap.get(item.description.trim().toLowerCase()) ?? 0) * item.qty, 0))
      : null;
    const rowProfit = rowCost !== null ? d.grandTotal - rowCost : null;
    const margin = rowProfit !== null && d.grandTotal > 0 ? (rowProfit / d.grandTotal) * 100 : null;
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
    return { d, rowCost, rowProfit, margin, bookingBadge };
  });

  // เลขหน้า: 1 … (p-1) p (p+1) … last
  const pageNumbers: (number | null)[] = (() => {
    const cur = pagination.page;
    const set = new Set([1, totalPages, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= totalPages));
    const sorted = [...set].sort((x, y) => x - y);
    const out: (number | null)[] = [];
    sorted.forEach((n, i) => { if (i > 0 && n - sorted[i - 1] > 1) out.push(null); out.push(n); });
    return out;
  })();

  const emptyState = (
    <div className="px-6 py-20 text-center">
      <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FileText className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-700 font-bold mb-1">ไม่พบเอกสาร</p>
      <p className="text-slate-400 text-sm">ลองเปลี่ยนเงื่อนไขการค้นหาใหม่</p>
    </div>
  );

  // ต้นทุน — คลิกเพื่อกรอกเอง (ราคายางเปลี่ยนได้)
  const renderCostCell = (id: string, rowCost: number | null) => {
    if (rowCost === null) return <span className="text-sm text-slate-300">—</span>;
    if (editingCostId === id) {
      return (
        <input
          type="number" min={0} step="any" autoFocus
          value={costDraft}
          onChange={e => setCostDraft(e.target.value)}
          onBlur={() => handleSaveCost(id, rowCost)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSaveCost(id, rowCost);
            if (e.key === 'Escape') setEditingCostId(null);
          }}
          className="w-28 px-2 py-1 text-sm text-right font-semibold tabular-nums border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
        />
      );
    }
    return (
      <button
        onClick={() => { setEditingCostId(id); setCostDraft(rowCost > 0 ? String(rowCost) : ''); }}
        title="คลิกเพื่อกรอกต้นทุนเอง"
        className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums text-slate-500 hover:text-blue-600 rounded px-1 -mx-1 hover:bg-blue-50 group/cost whitespace-nowrap"
      >
        ฿{fmtMoney(rowCost)}
        <Pencil size={11} className="text-slate-300 group-hover/cost:text-blue-500" />
      </button>
    );
  };

  const iconBtn = 'p-2 rounded-lg text-slate-400 transition-colors';
  const renderRowActions = (d: DocRow) => (
    <div className="flex items-center justify-end gap-0.5">
      <button onClick={() => setViewDoc(d)} title="ดูรายละเอียด" className={`${iconBtn} hover:bg-blue-50 hover:text-blue-600`}>
        <Eye size={16} />
      </button>
      {isDocEditable(d.type, d.status) && (
        <Link href={`/admin/documents/${d.id}/edit`} title="แก้ไขเอกสาร" className={`${iconBtn} hover:bg-amber-50 hover:text-amber-600`}>
          <Pencil size={16} />
        </Link>
      )}
      <button onClick={() => handleDirectPrint(d.id)} title="พิมพ์เอกสาร" className={`${iconBtn} hover:bg-emerald-50 hover:text-emerald-600`}>
        <Printer size={16} />
      </button>
      <RowMenu doc={d} onStatusChange={handleStatusChange} onDelete={handleDelete} />
    </div>
  );

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
            <span className="text-[13px] font-bold text-slate-600">ทั้งหมด <span className="text-blue-600 font-black ml-1">{pagination.totalItems.toLocaleString()}</span> <span className="font-medium text-slate-500">ฉบับ</span></span>
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
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <Download size={18} className="text-slate-400" /> ส่งออก Excel (ตามที่กรอง)
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
            <p className="text-[11px] text-slate-400 mt-1">{pagination.invoiceCount} ใบ {(dateFrom || dateTo) ? '(ตามช่วงที่เลือก)' : '(ทั้งหมด)'}</p>
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
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า, ทะเบียนรถ, เบอร์โทร, ยอดเงิน..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-medium"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <DatePicker value={dateFrom} max={dateTo || undefined} onChange={e => { setDateFrom(e.target.value); navigateWithFilters({ dateFrom: e.target.value, page: 1 }); }} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-400 bg-white" />
              <span className="text-slate-400 text-sm">–</span>
              <DatePicker value={dateTo} min={dateFrom || undefined} onChange={e => { setDateTo(e.target.value); navigateWithFilters({ dateTo: e.target.value, page: 1 }); }} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-400 bg-white" />
            </div>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); navigateWithFilters({ type: e.target.value, page: 1 }); }}
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
              onChange={e => { setStatFilter(e.target.value); navigateWithFilters({ status: e.target.value, page: 1 }); }}
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
              onChange={e => { setVatFilter(e.target.value); navigateWithFilters({ vat: e.target.value, page: 1 }); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">VAT: ทั้งหมด</option>
              <option value="vat">มี VAT</option>
              <option value="novat">ไม่มี VAT</option>
            </select>
          </div>
        </div>

        {/* Table (desktop) */}
        <div className={isPending ? 'hidden md:block overflow-x-auto transition-opacity opacity-60' : 'hidden md:block overflow-x-auto transition-opacity'}>
          <table className="w-full min-w-[980px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="pl-5 pr-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[112px]">วันที่</th>
                <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">เลขที่เอกสาร</th>
                <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ลูกค้า</th>
                <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-[130px]">ยอดเงิน</th>
                <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-[130px]">ต้นทุน</th>
                <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-[130px]">กำไร</th>
                <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center w-[140px]">สถานะ</th>
                <th className="pl-3 pr-5 py-3 w-[150px] text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>{emptyState}</td>
                </tr>
              ) : rows.map(({ d, rowCost, rowProfit, margin, bookingBadge }) => (
                <tr
                  key={d.id}
                  className={d.status === 'cancelled' ? 'group cursor-pointer transition-colors hover:bg-emerald-50/40 opacity-60' : 'group cursor-pointer transition-colors hover:bg-emerald-50/40'}
                  onClick={() => setViewDoc(d)}
                >
                  <td className="pl-5 pr-3 py-3 align-top">
                    <p className="text-[13px] font-semibold text-slate-700 tabular-nums whitespace-nowrap">{fmtDate(d.issuedAt)}</p>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-mono text-[13px] font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">{d.docNumber}</span>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TYPE_STYLE[d.type] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {TYPE_LABEL[d.type] ?? d.type}
                        </span>
                        {d.vatRate > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200">VAT</span>}
                        {bookingBadge && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${bookingBadge.cls}`}>{bookingBadge.label}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="min-w-0 max-w-[280px]">
                      <p className="text-sm font-semibold text-slate-800 truncate">{d.customerName || <span className="text-slate-400 font-normal">ไม่ระบุชื่อ</span>}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-[12px] text-slate-500 min-w-0">
                        {d.customerPhone && <span className="inline-flex items-center gap-1 shrink-0 tabular-nums"><Phone className="w-3 h-3 text-slate-400" />{d.customerPhone}</span>}
                        {d.customerCar && <span className="inline-flex items-center gap-1 min-w-0"><Car className="w-3 h-3 text-slate-400 shrink-0" /><span className="truncate">{d.customerCar}</span></span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top text-right">
                    <p className={`text-sm font-bold tabular-nums whitespace-nowrap ${d.grandTotal < 0 ? 'text-orange-600' : 'text-slate-900'}`}>
                      {d.grandTotal < 0 ? `-฿${fmtMoney(Math.abs(d.grandTotal))}` : `฿${fmtMoney(d.grandTotal)}`}
                    </p>
                  </td>
                  <td className="px-3 py-3 align-top text-right" onClick={e => e.stopPropagation()}>
                    {renderCostCell(d.id, rowCost)}
                  </td>
                  <td className="px-3 py-3 align-top text-right">
                    {rowProfit !== null ? (
                      <>
                        <p className={`text-sm font-bold tabular-nums whitespace-nowrap ${rowProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {rowProfit < 0 ? '-' : ''}฿{fmtMoney(Math.abs(rowProfit))}
                        </p>
                        {margin !== null && <p className="text-[11px] text-slate-400 tabular-nums">{margin.toFixed(1)}%</p>}
                      </>
                    ) : <span className="text-sm text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-3 align-top text-center" onClick={e => e.stopPropagation()}>
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="pl-3 pr-5 py-3 align-top" onClick={e => e.stopPropagation()}>
                    {renderRowActions(d)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards (mobile) */}
        <div className={isPending ? 'md:hidden divide-y divide-slate-100 transition-opacity opacity-60' : 'md:hidden divide-y divide-slate-100 transition-opacity'}>
          {rows.length === 0 ? emptyState : rows.map(({ d, rowCost, rowProfit, bookingBadge }) => (
            <div key={d.id} onClick={() => setViewDoc(d)} className={d.status === 'cancelled' ? 'p-4 active:bg-slate-50 opacity-60' : 'p-4 active:bg-slate-50'}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[13px] font-bold text-slate-900">{d.docNumber}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TYPE_STYLE[d.type] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>{TYPE_LABEL[d.type] ?? d.type}</span>
                  </div>
                  <p className="text-[12px] text-slate-400 mt-0.5">{fmtDate(d.issuedAt)}</p>
                </div>
                <div onClick={e => e.stopPropagation()} className="shrink-0"><StatusBadge status={d.status} /></div>
              </div>
              <div className="mt-2.5 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{d.customerName || 'ไม่ระบุชื่อ'}</p>
                  {(d.customerCar || d.customerPhone) && <p className="text-[12px] text-slate-500 truncate">{[d.customerCar, d.customerPhone].filter(Boolean).join(' · ')}</p>}
                  {bookingBadge && <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${bookingBadge.cls}`}>{bookingBadge.label}</span>}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-base font-bold tabular-nums ${d.grandTotal < 0 ? 'text-orange-600' : 'text-slate-900'}`}>
                    {d.grandTotal < 0 ? `-฿${fmtMoney(Math.abs(d.grandTotal))}` : `฿${fmtMoney(d.grandTotal)}`}
                  </p>
                  {rowProfit !== null && (
                    <p className="text-[11px] text-slate-400 tabular-nums">
                      ต้นทุน ฿{fmtMoney(rowCost ?? 0)} · <span className={rowProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}>กำไร {rowProfit < 0 ? '-' : ''}฿{fmtMoney(Math.abs(rowProfit))}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex justify-end" onClick={e => e.stopPropagation()}>
                {renderRowActions(d)}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 rounded-b-2xl">
          <p className="text-[13px] text-slate-500">
            แสดง <span className="font-bold text-slate-700 tabular-nums">{pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}</span> จาก <span className="font-bold text-slate-700 tabular-nums">{pagination.totalItems.toLocaleString()}</span> รายการ
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateWithFilters({ page: Math.max(1, pagination.page - 1) })}
              disabled={pagination.page <= 1}
              aria-label="หน้าก่อนหน้า"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pageNumbers.map((n, i) => n === null ? (
              <span key={`gap-${i}`} className="w-8 text-center text-slate-400 text-sm">…</span>
            ) : (
              <button
                key={n}
                onClick={() => navigateWithFilters({ page: n })}
                aria-current={n === pagination.page ? 'page' : undefined}
                className={`min-w-8 h-8 px-2 rounded-lg text-[13px] font-bold tabular-nums transition-colors ${n === pagination.page ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => navigateWithFilters({ page: Math.min(totalPages, pagination.page + 1) })}
              disabled={pagination.page >= totalPages}
              aria-label="หน้าถัดไป"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
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
