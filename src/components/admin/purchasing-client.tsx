'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Plus, ShoppingBag, Clock, CheckCircle, XCircle,
  MoreHorizontal, ChevronLeft, ChevronRight, X,
  Eye, Ban, Truck, Printer, FileEdit,
} from 'lucide-react';
import type { PORow, POStatusThai } from '@/lib/purchasing';
import { receivePO, cancelPO, updatePOPayment } from '@/app/actions/purchasing';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── status config ─────────────────────────────────────────────────────────────

const statusStyle: Record<POStatusThai, { color: string; icon: React.ReactNode }> = {
  'รอรับสินค้า': { color: 'bg-amber-100 text-amber-700',   icon: <Clock       size={12} /> },
  'รับสินค้าแล้ว': { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={12} /> },
  'ยกเลิก':     { color: 'bg-red-100 text-red-600',       icon: <XCircle     size={12} /> },
  'ร่าง':       { color: 'bg-slate-100 text-slate-500',   icon: <FileEdit    size={12} /> },
};

const paymentStatusStyle: Record<string, { color: string; label: string }> = {
  unpaid:  { color: 'bg-red-100 text-red-600', label: 'ยังไม่ชำระ' },
  partial: { color: 'bg-amber-100 text-amber-600', label: 'ชำระบางส่วน' },
  paid:    { color: 'bg-emerald-100 text-emerald-700', label: 'ชำระแล้ว' },
};

// ── Print Preview Modal ───────────────────────────────────────────────────────

// ── PO Detail Modal ───────────────────────────────────────────────────────────

function PODetailModal({
  order, onClose, onReceive, onCancel, onPay,
}: {
  order: PORow;
  onClose: () => void;
  onReceive: (id: string) => void;
  onCancel: (id: string) => void;
  onPay: (id: string) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">{order.poNumber}</h2>
              <p className="text-sm text-slate-400">{order.supplier}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[order.status].color}`}>
                {statusStyle[order.status].icon}{order.status}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${paymentStatusStyle[order.paymentStatus].color}`}>
                {paymentStatusStyle[order.paymentStatus].label}
              </span>
              <Link href={`/admin/purchasing/${order.id}/print`} target="_blank" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="พิมพ์">
                <Printer size={17} />
              </Link>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">วันที่สั่งซื้อ</p>
                <p className="font-semibold text-slate-800">{fmtDate(order.orderDate)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">กำหนดรับสินค้า</p>
                <p className="font-semibold text-slate-800">{fmtDate(order.dueDate)}</p>
              </div>
            </div>
            {order.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-600 font-semibold mb-0.5">หมายเหตุ</p>
                <p className="text-sm text-slate-700">{order.notes}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">รายการสินค้า ({order.items.length} รายการ)</p>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-400 font-semibold">
                      <th className="text-left px-4 py-2.5">สินค้า</th>
                      <th className="text-center px-3 py-2.5">ปี (Year)</th>
                      <th className="text-center px-3 py-2.5">จำนวน</th>
                      <th className="text-right px-4 py-2.5">ราคา/หน่วย</th>
                      <th className="text-right px-4 py-2.5">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.productName}</td>
                        <td className="px-3 py-3 text-center text-slate-500">{item.year || '-'}</td>
                        <td className="px-3 py-3 text-center text-slate-600">{item.qty} {item.unit}</td>
                        <td className="px-4 py-3 text-right text-slate-600">฿{item.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">฿{item.lineTotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-100 text-xs">
                      <td colSpan={3} className="px-4 py-2 text-right text-slate-500">ก่อนภาษี</td>
                      <td className="px-4 py-2 text-right font-semibold text-slate-700">฿{order.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-slate-50 text-xs">
                      <td colSpan={3} className="px-4 py-2 text-right text-slate-500">VAT 7%</td>
                      <td className="px-4 py-2 text-right font-semibold text-slate-700">฿{order.vat.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-bold text-slate-700">มูลค่ารวมสุทธิ</td>
                      <td className="px-4 py-3 text-right font-black text-green-600">฿{order.grandTotal.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {order.status === 'รอรับสินค้า' && (
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => { onCancel(order.id); onClose(); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 flex items-center gap-2"
              >
                <Ban size={14} /> ยกเลิก PO
              </button>
              {order.paymentStatus !== 'paid' && (
                <button
                  onClick={() => { onPay(order.id); onClose(); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-amber-600 border border-amber-200 hover:bg-amber-50 flex items-center gap-2"
                >
                  ชำระเงิน
                </button>
              )}
              <button
                onClick={() => { onReceive(order.id); onClose(); }}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center gap-2"
              >
                <Truck size={14} /> ยืนยันรับสินค้า
              </button>
            </div>
          )}
          {order.status === 'รับสินค้าแล้ว' && order.paymentStatus !== 'paid' && (
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => { onPay(order.id); onClose(); }}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center gap-2"
              >
                ชำระเงิน
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Confirm Cancel Modal ──────────────────────────────────────────────────────

function ConfirmCancelModal({ orderId, onConfirm, onClose }: {
  orderId: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <XCircle size={24} className="text-red-600" />
        </div>
        <h3 className="text-center text-lg font-black text-slate-900 mb-1">ยืนยันการยกเลิก</h3>
        <p className="text-center text-sm text-slate-500 mb-6">
          ต้องการยกเลิกใบสั่งซื้อ <span className="font-bold text-slate-700">{orderId}</span> ใช่หรือไม่?
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">ไม่ใช่</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">ยืนยันยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

// ── Row Action Menu ───────────────────────────────────────────────────────────

function ActionMenu({ order, onView, onReceive, onCancelRequest, onPayRequest }: {
  order: PORow;
  onView: () => void;
  onReceive: () => void;
  onCancelRequest: () => void;
  onPayRequest: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={e => { e.stopPropagation(); setOpen(v => !v); }} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
            <button onClick={() => { setOpen(false); onView(); }} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium">
              <Eye size={14} className="text-slate-400" /> ดูรายละเอียด
            </button>
            {order.paymentStatus !== 'paid' && order.status !== 'ยกเลิก' && (
              <button onClick={() => { setOpen(false); onPayRequest(); }} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 font-medium">
                💰 ชำระเงิน
              </button>
            )}
            {order.status === 'รอรับสินค้า' && (
              <>
                <button onClick={() => { setOpen(false); onReceive(); }} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 font-medium">
                  <CheckCircle size={14} /> รับสินค้า
                </button>
                <button onClick={() => { setOpen(false); onCancelRequest(); }} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium">
                  <XCircle size={14} /> ยกเลิก PO
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────

function POPaymentModal({ order, onConfirm, onClose }: {
  order: PORow; onConfirm: (id: string, amount: number, date: string) => void; onClose: () => void;
}) {
  const remaining = order.grandTotal - order.amountPaid;
  const [amount, setAmount] = useState(remaining);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (amount <= 0 || amount > remaining) return;
    startTransition(() => {
      onConfirm(order.id, amount, date);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-lg font-black text-slate-900 mb-4">บันทึกการชำระเงิน</h3>
        <div className="space-y-4 mb-6">
          <div className="bg-slate-50 p-3 rounded-xl flex justify-between">
            <span className="text-sm text-slate-500">ยอดที่ต้องชำระ (คงเหลือ)</span>
            <span className="text-sm font-bold text-slate-800">฿{remaining.toLocaleString()}</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">จำนวนเงินที่ชำระ (บาท)</label>
            <input type="number" min={1} max={remaining} value={amount || ''} onChange={e => setAmount(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">วันที่ชำระ</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">ยกเลิก</button>
          <button onClick={handleConfirm} disabled={isPending || amount <= 0 || amount > remaining} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50">
            {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

export function PurchasingClient({ initialOrders }: { initialOrders: PORow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<PORow | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<PORow | null>(null);

  // sync when server re-renders (after router.refresh)
  useEffect(() => { setOrders(initialOrders); }, [initialOrders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime   = dateTo   ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    return orders.filter(o => {
      const matchSearch = o.poNumber.toLowerCase().includes(q) || o.supplier.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ทั้งหมด' || o.status === statusFilter;
      const orderTime = new Date(o.orderDate).getTime();
      const matchDate = (!fromTime || orderTime >= fromTime) && (!toTime || orderTime <= toTime);
      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    pending:    orders.filter(o => o.status === 'รอรับสินค้า').length,
    received:   orders.filter(o => o.status === 'รับสินค้าแล้ว').length,
    totalValue: orders.filter(o => o.status !== 'ยกเลิก').reduce((s, o) => s + o.grandTotal, 0),
    suppliers:  new Set(orders.map(o => o.supplier)).size,
  }), [orders]);

  const handleReceive = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'รับสินค้าแล้ว' as POStatusThai } : o));
    if (selectedOrder?.id === id) setSelectedOrder(prev => prev ? { ...prev, status: 'รับสินค้าแล้ว' } : null);
    startTransition(async () => {
      await receivePO(id);
      router.refresh();
    });
  };

  const handleCancel = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'ยกเลิก' as POStatusThai } : o));
    setCancelTarget(null);
    startTransition(async () => {
      await cancelPO(id);
      router.refresh();
    });
  };

  const handlePay = (id: string, amount: number, date: string) => {
    startTransition(async () => {
      await updatePOPayment(id, amount, date);
      setPayTarget(null);
      router.refresh();
    });
  };

  const startItem = filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, filtered.length);

  return (
    <>
      <div className={`max-w-7xl mx-auto transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">จัดซื้อ</h1>
            <p className="text-sm text-slate-500 mt-1">ใบสั่งซื้อทั้งหมด {orders.length} รายการ</p>
          </div>
          <Link href="/admin/purchasing/new" className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors w-fit">
            <Plus size={16} /> สร้างใบสั่งซื้อ
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'รอรับสินค้า',              value: String(stats.pending) },
            { label: 'รับแล้วทั้งหมด',            value: String(stats.received) },
            { label: 'มูลค่ารวม (ไม่รวมยกเลิก)', value: `฿${(stats.totalValue / 1000).toFixed(0)}K` },
            { label: 'ซัพพลายเออร์',              value: String(stats.suppliers) },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4">
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="ค้นหาเลขที่ PO, ซัพพลายเออร์..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400"
            >
              {['ทั้งหมด', 'ร่าง', 'รอรับสินค้า', 'รับสินค้าแล้ว', 'ยกเลิก'].map(t => (
                <option key={t} value={t}>{t === 'ทั้งหมด' ? 'สถานะ: ทั้งหมด' : t}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400"
              />
              <span className="text-slate-400 text-sm">–</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400"
              />
            </div>
          </div>

          <div className="w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-4 py-3">เลขที่ PO</th>
                  <th className="text-left px-4 py-3">ซัพพลายเออร์</th>
                  <th className="text-center px-4 py-3">รายการ</th>
                  <th className="text-right px-4 py-3">มูลค่า</th>
                  <th className="text-left px-4 py-3">วันที่สั่ง</th>
                  <th className="text-left px-4 py-3">กำหนดรับ</th>
                  <th className="text-center px-4 py-3">สถานะสินค้า</th>
                  <th className="text-center px-4 py-3">การชำระเงิน</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-14 text-slate-400 text-sm">ไม่พบรายการที่ตรงกับเงื่อนไข</td></tr>
                ) : paged.map((o, idx) => (
                  <tr key={o.id} onClick={() => setSelectedOrder(o)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3.5 font-bold text-green-600">{o.poNumber}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <ShoppingBag size={14} className="text-slate-500" />
                        </div>
                        <span className="font-medium text-slate-800">{o.supplier}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-600">{o.items.length} รายการ</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-800">฿{o.grandTotal.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-slate-500">{fmtDate(o.orderDate)}</td>
                    <td className="px-4 py-3.5 text-slate-500">{fmtDate(o.dueDate)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[o.status].color}`}>
                        {statusStyle[o.status].icon}{o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${paymentStatusStyle[o.paymentStatus].color}`}>
                        {paymentStatusStyle[o.paymentStatus].label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <ActionMenu
                        order={o}
                        onView={() => setSelectedOrder(o)}
                        onReceive={() => handleReceive(o.id)}
                        onCancelRequest={() => setCancelTarget(o.id)}
                        onPayRequest={() => setPayTarget(o)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">แสดง {startItem}–{endItem} จาก {filtered.length} รายการ</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const n = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${n === page ? 'bg-green-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {n}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <PODetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onReceive={handleReceive}
          onCancel={id => setCancelTarget(id)}
          onPay={id => {
            const o = orders.find(x => x.id === id);
            if (o) setPayTarget(o);
          }}
        />
      )}
      {cancelTarget && (
        <ConfirmCancelModal
          orderId={orders.find(o => o.id === cancelTarget)?.poNumber ?? cancelTarget}
          onConfirm={() => handleCancel(cancelTarget)}
          onClose={() => setCancelTarget(null)}
        />
      )}
      {payTarget && (
        <POPaymentModal
          order={payTarget}
          onConfirm={handlePay}
          onClose={() => setPayTarget(null)}
        />
      )}
    </>
  );
}
