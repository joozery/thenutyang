'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

export type SupplierPORow = {
  id: string;
  poNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  orderDate: string; // ISO
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'ร่าง',           cls: 'bg-slate-100 text-slate-500' },
  pending:   { label: 'รอรับสินค้า',    cls: 'bg-amber-50 text-amber-600' },
  received:  { label: 'รับสินค้าแล้ว',  cls: 'bg-emerald-50 text-emerald-600' },
  cancelled: { label: 'ยกเลิก',         cls: 'bg-red-50 text-red-500' },
};

const PAY_BADGE: Record<string, { label: string; cls: string }> = {
  unpaid:  { label: 'ค้างชำระ',     cls: 'bg-red-50 text-red-500' },
  partial: { label: 'ชำระบางส่วน', cls: 'bg-amber-50 text-amber-600' },
  paid:    { label: 'ชำระแล้ว',     cls: 'bg-emerald-50 text-emerald-600' },
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SupplierPOTable({ pos }: { pos: SupplierPORow[] }) {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const qAmount = q.replace(/[,฿\s]/g, '');
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime   = dateTo   ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    return pos.filter(po => {
      if (q) {
        const matchAmount = /^\d+(\.\d+)?$/.test(qAmount) && String(po.grandTotal).startsWith(qAmount);
        if (!po.poNumber.toLowerCase().includes(q) && !matchAmount) return false;
      }
      const t = new Date(po.orderDate).getTime();
      if (fromTime && t < fromTime) return false;
      if (toTime && t > toTime) return false;
      return true;
    });
  }, [pos, search, dateFrom, dateTo]);

  const hasFilter = !!(search || dateFrom || dateTo);

  return (
    <>
      {/* ค้นหา + ช่วงวันที่ */}
      <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาเลข PO หรือจำนวนเงิน..."
            className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:border-green-400"
          />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="ตั้งแต่วันที่"
            className="px-2.5 py-2 rounded-md border border-slate-200 text-xs text-slate-600 focus:outline-none focus:border-green-400" />
          <span className="text-slate-300 text-xs">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="ถึงวันที่"
            className="px-2.5 py-2 rounded-md border border-slate-200 text-xs text-slate-600 focus:outline-none focus:border-green-400" />
          {hasFilter && (
            <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }} title="ล้างตัวกรอง"
              className="p-2 rounded-md border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-3">เลขที่</th>
              <th className="text-left px-4 py-3">วันที่</th>
              <th className="text-center px-4 py-3">สถานะ</th>
              <th className="text-center px-4 py-3">การชำระ</th>
              <th className="text-right px-5 py-3">ยอดรวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                {hasFilter ? 'ไม่พบรายการตามเงื่อนไขที่ค้นหา' : 'ยังไม่มีใบสั่งซื้อ'}
              </td></tr>
            ) : filtered.map(po => {
              const st = STATUS_BADGE[po.status] ?? STATUS_BADGE.pending;
              const pay = PAY_BADGE[po.paymentStatus] ?? PAY_BADGE.unpaid;
              return (
                <tr key={po.id} className="hover:bg-green-50/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/purchasing/${po.id}/edit`} className="font-bold text-slate-800 text-[13px] hover:text-green-700 hover:underline underline-offset-2 transition-colors">
                      {po.poNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(po.orderDate)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {po.status === 'cancelled'
                      ? <span className="text-[10px] text-slate-300">—</span>
                      : <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pay.cls}`}>{pay.label}</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-slate-800 text-[13px]">฿{po.grandTotal.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hasFilter && (
        <div className="px-5 py-2.5 border-t border-slate-50 text-xs text-slate-400">
          พบ {filtered.length} จาก {pos.length} ใบ · รวม ฿{filtered.reduce((s, p) => s + p.grandTotal, 0).toLocaleString()}
        </div>
      )}
    </>
  );
}
