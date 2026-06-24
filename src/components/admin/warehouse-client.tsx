'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, ArrowDownCircle, ArrowUpCircle, AlertTriangle,
  Package, SlidersHorizontal, X, CheckCircle,
  Tag, Download, Upload, TrendingUp
} from 'lucide-react';
import type { StockItem, MovementRow, WarehouseStats } from '@/lib/warehouse';
import { receiveStock, disburseStock, adjustStock } from '@/app/actions/warehouse';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'เมื่อกี้';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)  return `${diffH} ชม.ที่แล้ว`;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

const inputCls = 'w-full px-3 py-2.5 rounded-md border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10 transition-colors placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400';

// ── Move Modal (รับเข้า / เบิกออก / ปรับสต๊อก) ─────────────────────────────

type MoveType = 'in' | 'out' | 'adjust';

function MoveModal({
  type,
  products,
  onClose,
  onDone,
}: {
  type: MoveType;
  products: StockItem[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const initialProduct = products.length === 1 ? products[0] : null;
  const [productId, setProductId] = useState(initialProduct ? initialProduct.id : '');
  const [qty, setQty] = useState(1);
  const [refNo, setRefNo] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialProduct ? initialProduct.label : '');

  const selected = products.find(p => p.id === productId);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    const normalizeTire = (s: string) => s.replace(/[\/rR\s]/g, '');
    const qNorm = normalizeTire(q);
    return products.filter(p => {
      const label = p.label.toLowerCase();
      return label.includes(q) || normalizeTire(label).includes(qNorm);
    });
  }, [products, search]);

  const TITLES: Record<MoveType, string> = {
    in:     'รับสินค้าเข้าคลัง',
    out:    'เบิกสินค้าออกจากคลัง',
    adjust: 'ปรับสต๊อก (ตรวจนับ)',
  };

  const isValid = !!productId && qty > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    setError('');
    startTransition(async () => {
      let res: { error?: string };
      if (type === 'in')     res = await receiveStock(productId, qty, refNo, note);
      else if (type === 'out') res = await disburseStock(productId, qty, refNo, note);
      else                   res = await adjustStock(productId, qty, note);

      if (res.error) setError(res.error);
      else { onDone(); onClose(); }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-md shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${type === 'in' ? 'bg-emerald-100 text-emerald-600' : type === 'out' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
              {type === 'in' ? <ArrowDownCircle size={16} /> : type === 'out' ? <ArrowUpCircle size={16} /> : <SlidersHorizontal size={16} />}
            </div>
            <h2 className="text-base font-black text-slate-900">{TITLES[type]}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Product Combobox */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">สินค้า <span className="text-green-500">*</span></label>
            <div className="relative">
              <div
                className="flex items-center w-full border border-slate-200 rounded-md overflow-hidden focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-500/10 transition-colors bg-white"
              >
                <Search size={14} className="ml-3 text-slate-400 shrink-0" />
                <input
                  placeholder="ค้นหาสินค้า หรือเลือกลูกศรด้านขวา..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setProductId(''); // Reset selection if user types
                  }}
                  className="w-full px-3 py-2.5 text-sm text-slate-800 focus:outline-none placeholder:text-slate-300"
                />
                {productId && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductId('');
                      setSearch('');
                    }}
                    className="p-1 mr-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {/* Dropdown list */}
              {(!productId || (selected && search !== selected.label)) && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">ไม่พบสินค้า</div>
                  ) : (
                    filteredProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setProductId(p.id);
                          setSearch(p.label);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm border-b border-slate-50 last:border-0 hover:bg-green-50 transition-colors ${productId === p.id ? 'bg-green-50 text-green-700 font-semibold' : 'text-slate-700'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate pr-4">{p.label}</span>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-600' : p.isLow ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                            สต๊อก: {p.stock}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

            </div>
            {selected && (
              <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${selected.isLow ? 'text-amber-600' : 'text-slate-400'}`}>
                <CheckCircle size={12} className={selected.isLow ? 'text-amber-500' : 'text-emerald-500'} /> 
                สต๊อกปัจจุบัน: {selected.stock} ชิ้น {selected.isLow ? '(⚠ ใกล้หมด)' : ''}
              </p>
            )}
          </div>

          {/* Qty */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              {type === 'adjust' ? 'จำนวนสต๊อกใหม่ (จากการตรวจนับ)' : 'จำนวน'} <span className="text-green-500">*</span>
            </label>
            <input
              type="number"
              min={type === 'adjust' ? 0 : 1}
              value={qty}
              onChange={e => setQty(Math.max(type === 'adjust' ? 0 : 1, Number(e.target.value)))}
              className={inputCls}
            />
            {type === 'adjust' && selected && (
              <p className="text-xs text-slate-400 mt-1">
                จะ{qty > selected.stock ? `เพิ่ม +${qty - selected.stock}` : qty < selected.stock ? `ลด -${selected.stock - qty}` : 'ไม่เปลี่ยน'} จาก {selected.stock} → {qty}
              </p>
            )}
          </div>

          {/* Ref No (not for adjust) */}
          {type !== 'adjust' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                {type === 'in' ? 'เลขที่ PO / อ้างอิง' : 'เลขที่บิล / อ้างอิง'}
              </label>
              <input
                value={refNo}
                onChange={e => setRefNo(e.target.value)}
                placeholder={type === 'in' ? 'PO-2026-001' : 'INV-2026-001'}
                className={inputCls}
              />
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">หมายเหตุ</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม..." className={inputCls} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-md px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-md text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">ยกเลิก</button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
              type === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : type === 'out' ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-800'
            }`}
          >
            {isPending ? 'กำลังบันทึก...' : 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stock Table ───────────────────────────────────────────────────────────────

function StockTable({ items, onAdjust }: { items: StockItem[]; onAdjust: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all');

  const lowCount = items.filter(p => p.isLow).length;
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    // normalize tire size: "215/55R17", "215/55r17", "215/55/17", "2155517" → "2155517"
    const normalizeTire = (s: string) => s.replace(/[\/rR\s]/g, '');
    const qNorm = normalizeTire(q);
    return items.filter(p => {
      if (!q) return filter === 'all' || (filter === 'low' ? p.isLow : !p.isLow);
      const label = p.label.toLowerCase();
      const matchSearch =
        label.includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        normalizeTire(label).includes(qNorm);
      const matchFilter = filter === 'all' || (filter === 'low' ? p.isLow : !p.isLow);
      return matchSearch && matchFilter;
    });
  }, [items, search, filter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหาสินค้า, SKU, บาร์โค้ด..."
            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:border-[#008a44] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar shrink-0">
          <button
            onClick={() => { setFilter('all'); setPage(1); }}
            className={`px-5 py-2.5 rounded-md text-[13px] font-bold whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-[#008a44] text-white shadow-sm ' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => { setFilter('low'); setPage(1); }}
            className={`px-4 py-2.5 rounded-md text-[13px] font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${filter === 'low' ? 'bg-[#008a44] text-white shadow-sm ' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            <span className={`text-xs ${filter === 'low' ? 'text-white/80' : 'text-slate-400'}`}>{lowCount}</span> ใกล้หมด
          </button>
          <button
            onClick={() => { setFilter('ok'); setPage(1); }}
            className={`px-5 py-2.5 rounded-md text-[13px] font-bold whitespace-nowrap transition-colors ${filter === 'ok' ? 'bg-[#008a44] text-white shadow-sm ' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            ปกติ
          </button>
        </div>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[12px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-4">สินค้า</th>
              <th className="text-center px-5 py-4">สต๊อก</th>
              <th className="text-right px-5 py-4">ราคาทุน</th>
              <th className="text-center px-5 py-4">มูลค่า</th>
              <th className="text-center px-5 py-4">สถานะ</th>
              <th className="text-center px-5 py-4">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50/80">
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">ไม่พบสินค้า</td></tr>
            ) : paginated.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <img src={p.image} alt={p.label} className="w-10 h-10 object-contain rounded-md shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {p.brandLogo && (
                          <img src={p.brandLogo} alt={p.brand} className="h-3.5 w-auto object-contain" title={p.brand} />
                        )}
                        <span className="font-bold text-slate-800 text-[13px] uppercase">{p.brand}</span>
                        <span className="font-bold text-slate-700 text-[13px] uppercase">{p.model}</span>
                      </div>
                      <p className="text-[12px] text-[#008a44] font-medium">{p.size}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-[13px] font-bold ${p.stock === 0 ? 'text-red-500' : p.isLow ? 'text-amber-500' : 'text-slate-800'}`}>
                    {p.stock}
                  </span>
                  <span className="text-[12px] text-slate-400 ml-1.5 font-medium">เส้น</span>
                </td>
                <td className="px-5 py-4 text-right text-slate-500 font-semibold text-[13px]">฿{p.priceCash.toLocaleString()}</td>
                <td className="px-5 py-4 text-center font-bold text-slate-700 text-[13px]">฿{p.stockValue.toLocaleString()}</td>
                <td className="px-5 py-4 text-center">
                  {p.stock === 0
                    ? <span className="inline-flex items-center justify-center min-w-[70px] text-[11px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-500">หมด</span>
                    : p.isLow
                    ? <span className="inline-flex items-center justify-center gap-1 min-w-[70px] text-[11px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600"><AlertTriangle size={10}/> ใกล้หมด</span>
                    : <span className="inline-flex items-center justify-center min-w-[70px] text-[11px] font-bold px-2 py-1 rounded-full bg-slate-50 text-slate-500">ปกติ</span>
                  }
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => onAdjust(p.id)}
                    className="text-[12px] font-bold text-slate-400 hover:text-[#008a44] transition-colors"
                  >
                    ปรับสต็อก
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-[12px] font-medium text-slate-400">
          แสดง {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} จาก {filtered.length} รายการ
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors">&lt;</button>
          
          <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#008a44] text-white font-bold text-[13px]">{page}</button>
          {page < totalPages && <button onClick={() => setPage(page + 1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-[13px] font-semibold">{page + 1}</button>}
          {page + 1 < totalPages && <button onClick={() => setPage(page + 2)} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-[13px] font-semibold">{page + 2}</button>}
          
          {totalPages > 3 && page + 2 < totalPages && <span className="px-2 text-slate-400 text-xs">...</span>}
          {totalPages > 3 && page + 2 < totalPages && <button onClick={() => setPage(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-[13px] font-semibold">{totalPages}</button>}
          
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors">&gt;</button>
        </div>
        <div className="flex items-center gap-2 border border-slate-200 rounded-md px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors">
          <span className="text-[12px] font-bold text-slate-500">10 / หน้า</span>
          <ArrowDownCircle size={12} className="text-slate-400 opacity-50" />
        </div>
      </div>
    </div>
  );
}

// ── Movement Log ──────────────────────────────────────────────────────────────

function MovementLog({ movements }: { movements: MovementRow[] }) {
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return movements;
    return movements.filter(m =>
      m.productName.toLowerCase().includes(q) || m.refNo.toLowerCase().includes(q)
    );
  }, [movements, search]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหาสินค้า, เลขอ้างอิง..."
            className="w-full pl-8 pr-4 py-2.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:border-[#008a44]"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3">เวลา</th>
              <th className="text-left px-4 py-3">ประเภท</th>
              <th className="text-left px-4 py-3">สินค้า</th>
              <th className="text-center px-4 py-3">จำนวน</th>
              <th className="text-center px-4 py-3">คงเหลือ</th>
              <th className="text-left px-4 py-3">อ้างอิง</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  {movements.length === 0 ? 'ยังไม่มีประวัติการเคลื่อนไหว' : 'ไม่พบรายการ'}
                </td>
              </tr>
            ) : paginated.map(m => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap text-xs">{fmtDate(m.date)}</td>
                <td className="px-4 py-3.5">
                  {m.type === 'in'
                    ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full"><ArrowDownCircle size={11} />รับเข้า</span>
                    : m.type === 'out'
                    ? <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full"><ArrowUpCircle size={11} />เบิกออก</span>
                    : <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full"><SlidersHorizontal size={11} />ปรับสต๊อก</span>
                  }
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-medium text-slate-800 text-xs leading-snug">{m.productName}</p>
                  {m.note && <p className="text-xs text-slate-400">{m.note}</p>}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className={`font-black text-sm ${m.type === 'in' ? 'text-emerald-600' : m.type === 'out' ? 'text-green-700' : 'text-slate-600'}`}>
                    {m.type === 'in' ? '+' : m.type === 'out' ? '-' : '→'}{m.qty}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center text-slate-500 font-semibold">{m.stockAfter}</td>
                <td className="px-4 py-3.5 text-xs text-green-600 font-medium">{m.refNo || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-[12px] font-medium text-slate-400">
          แสดง {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} จาก {filtered.length} รายการ
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors">&lt;</button>
          
          <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#008a44] text-white font-bold text-[13px]">{page}</button>
          {page < totalPages && <button onClick={() => setPage(page + 1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-[13px] font-semibold">{page + 1}</button>}
          {page + 1 < totalPages && <button onClick={() => setPage(page + 2)} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-[13px] font-semibold">{page + 2}</button>}
          
          {totalPages > 3 && page + 2 < totalPages && <span className="px-2 text-slate-400 text-xs">...</span>}
          {totalPages > 3 && page + 2 < totalPages && <button onClick={() => setPage(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-[13px] font-semibold">{totalPages}</button>}
          
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors">&gt;</button>
        </div>
        <div className="flex items-center gap-2 border border-slate-200 rounded-md px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors">
          <span className="text-[12px] font-bold text-slate-500">10 / หน้า</span>
          <ArrowDownCircle size={12} className="text-slate-400 opacity-50" />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function WarehouseClient({
  stockItems,
  movements,
  stats,
}: {
  stockItems: StockItem[];
  movements: MovementRow[];
  stats: WarehouseStats;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<'in' | 'out' | 'adjust' | null>(null);
  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);
  const [tab, setTab] = useState<'stock' | 'movements'>('stock');
  const [toast, setToast] = useState('');

  const handleAdjust = (id: string) => {
    setAdjustProductId(id);
    setModal('adjust');
  };

  const handleDone = () => {
    router.refresh();
    setToast('บันทึกสำเร็จ');
    setTimeout(() => setToast(''), 2500);
  };

  const lowItems = stockItems.filter(p => p.isLow);

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">คลังสินค้า</h1>
            <p className="text-sm text-slate-500 mt-1">ติดตามการเคลื่อนไหวสต๊อก · {stockItems.length} รายการ</p>
          </div>
          <div className="flex gap-2 items-center">
            {toast && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mr-2">
                <CheckCircle size={13} /> {toast}
              </span>
            )}
            <button
              onClick={() => setModal('in')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-[#008a44] text-[13px] font-bold text-[#008a44] hover:bg-green-50 transition-colors"
            >
              <ArrowDownCircle size={16} /> รับสินค้าเข้า
            </button>
            <button
              onClick={() => setModal('out')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#008a44] text-[13px] font-bold text-white hover:bg-[#007339] transition-colors shadow-sm "
            >
              <ArrowUpCircle size={16} /> เบิกสินค้าออก
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'มูลค่าสต๊อกรวม', value: `฿${(stats.totalValue / 1000).toFixed(0)}K`, sub: `${stats.totalItems.toLocaleString()} ชิ้น`, color: 'text-slate-800', icon: <Package size={18} className="text-emerald-600" />, bg: 'bg-emerald-50' },
            { label: 'สินค้าทั้งหมด',   value: String(stats.totalItems), sub: `< 8 เส้น`, color: 'text-slate-800', icon: <Tag size={18} className="text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'รับเข้าวันนี้',   value: `+${stats.todayIn}`,  sub: '0 ชิ้น', color: 'text-emerald-600', icon: <Download size={18} className="text-emerald-600" />, bg: 'bg-emerald-50' },
            { label: 'เบิกออกวันนี้',   value: `-${stats.todayOut}`, sub: '0 ชิ้น', color: 'text-rose-600', icon: <Upload size={18} className="text-rose-600" />, bg: 'bg-rose-50' },
            { label: 'คงเหลือสุทธิ',    value: stats.todayIn - stats.todayOut >= 0 ? `+${stats.todayIn - stats.todayOut}` : String(stats.todayIn - stats.todayOut), sub: 'วันนี้', color: 'text-slate-800', icon: <TrendingUp size={18} className="text-indigo-600" />, bg: 'bg-indigo-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-md border border-slate-100 p-5 flex items-center justify-between shadow-[0_1px_3px_rgb(0,0,0,0.01)] hover:shadow-md transition-shadow">
              <div>
                <p className="text-[12px] text-slate-400 font-bold">{s.label}</p>
                <p className={`text-xl font-black mt-1.5 ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">{s.sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${s.bg}`}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Tabs */}
          <div className="lg:col-span-2 bg-white rounded-md border border-slate-100 overflow-hidden shadow-sm flex flex-col">
            {/* Tab bar */}
            <div className="flex border-b border-slate-100 px-2 pt-2">
              {([
                { key: 'stock',     label: `สต๊อกสินค้า (${stockItems.length})` },
                { key: 'movements', label: `ประวัติการเคลื่อนไหว (${movements.length})` },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-6 py-4 text-[14px] font-bold transition-colors border-b-2 ${
                    tab === t.key
                      ? 'border-[#008a44] text-[#008a44]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'stock'
              ? <StockTable items={stockItems} onAdjust={handleAdjust} />
              : <MovementLog movements={movements} />
            }
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Low stock */}
            <div className="bg-white rounded-md border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle size={18} className="text-amber-500" />
                <h2 className="font-bold text-slate-800 text-[15px]">สินค้าใกล้หมด</h2>
                {lowItems.length > 0 && (
                  <span className="ml-auto text-xs font-bold bg-amber-50 text-amber-600 px-3 py-1 rounded-md">{lowItems.length}</span>
                )}
              </div>
              <div className="space-y-6 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
                {lowItems.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                    <CheckCircle size={14} /> สต๊อกครบทุกรายการ
                  </div>
                ) : lowItems.map(item => (
                  <div key={item.id} className="relative">
                    <div className="flex justify-between items-start mb-2.5">
                      <p className="text-[13px] font-bold text-slate-700 leading-relaxed pr-4">{item.label}</p>
                      <div className="text-right shrink-0">
                        <p className={`text-[14px] font-black ${item.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                          {item.stock} <span className="text-[12px] font-bold text-slate-400">เส้น</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">ขั้นต่ำ 8</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className={`h-1.5 w-full rounded-full ${item.stock === 0 ? 'bg-red-50' : 'bg-amber-50'}`}>
                      <div
                        className={`h-1.5 rounded-full ${item.stock === 0 ? 'bg-red-400' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min((item.stock / 8) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today summary */}
            <div className="bg-white rounded-md border border-slate-100 p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 mb-5 relative z-10">
                <Package size={18} className="text-slate-400" />
                <h3 className="font-bold text-slate-800 text-[15px]">สรุปสต๊อกวันนี้</h3>
              </div>
              
              <div className="space-y-3.5 relative z-10 w-[70%]">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-slate-500">รับเข้าทั้งหมด</span>
                  <span className="text-[13px] font-bold text-[#008a44]">+{stats.todayIn} ชิ้น</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-slate-500">เบิกออกทั้งหมด</span>
                  <span className="text-[13px] font-bold text-red-500">-{stats.todayOut} ชิ้น</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                  <span className="text-[13px] font-medium text-slate-500">คงเหลือสุทธิ</span>
                  <span className="text-[13px] font-bold text-[#008a44]">{stats.todayIn - stats.todayOut >= 0 ? '+' : ''}{stats.todayIn - stats.todayOut} ชิ้น</span>
                </div>
              </div>
              
              {/* Fake wave graphic on the right */}
              <div className="absolute -right-2 bottom-0 w-1/2 h-full pointer-events-none flex items-end justify-end">
                <svg viewBox="0 0 100 50" className="w-full h-20 text-[#008a44] opacity-[0.25]" preserveAspectRatio="none">
                  <path d="M0,40 Q10,20 20,30 T40,25 T60,10 T80,35 T100,15 L100,50 L0,50 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'in' && (
        <MoveModal type="in" products={stockItems} onClose={() => setModal(null)} onDone={handleDone} />
      )}
      {modal === 'out' && (
        <MoveModal type="out" products={stockItems} onClose={() => setModal(null)} onDone={handleDone} />
      )}
      {modal === 'adjust' && (
        <MoveModal
          type="adjust"
          products={adjustProductId ? stockItems.filter(p => p.id === adjustProductId) : stockItems}
          onClose={() => { setModal(null); setAdjustProductId(null); }}
          onDone={handleDone}
        />
      )}
    </>
  );
}
