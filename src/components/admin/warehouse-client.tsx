'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, ArrowDownCircle, ArrowUpCircle, AlertTriangle,
  Package, SlidersHorizontal, X, CheckCircle,
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

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10 transition-colors placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400';

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
    const q = search.toLowerCase();
    if (!q) return products;
    return products.filter(p => p.label.toLowerCase().includes(q));
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${type === 'in' ? 'bg-emerald-100 text-emerald-600' : type === 'out' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
              {type === 'in' ? <ArrowDownCircle size={16} /> : type === 'out' ? <ArrowUpCircle size={16} /> : <SlidersHorizontal size={16} />}
            </div>
            <h2 className="text-base font-black text-slate-900">{TITLES[type]}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Product Combobox */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">สินค้า <span className="text-green-500">*</span></label>
            <div className="relative">
              <div
                className="flex items-center w-full border border-slate-200 rounded-xl overflow-hidden focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-500/10 transition-colors bg-white"
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
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
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
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">ยกเลิก</button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(p => {
      const matchSearch = !q || p.label.toLowerCase().includes(q);
      const matchFilter = filter === 'all' || (filter === 'low' ? p.isLow : !p.isLow);
      return matchSearch && matchFilter;
    });
  }, [items, search, filter]);

  return (
    <div>
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาสินค้า..."
            className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-green-400"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'low', 'ok'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {f === 'all' ? 'ทั้งหมด' : f === 'low' ? '⚠ ใกล้หมด' : 'ปกติ'}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3">สินค้า</th>
              <th className="text-center px-4 py-3">สต๊อก</th>
              <th className="text-right px-4 py-3">ราคาทุน</th>
              <th className="text-right px-4 py-3">มูลค่า</th>
              <th className="text-center px-4 py-3">สถานะ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">ไม่พบสินค้า</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.label} className="w-10 h-10 object-cover rounded-lg bg-slate-100 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{p.brand} {p.model}</p>
                      <p className="text-xs text-slate-400">{p.size}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-lg font-black ${p.stock === 0 ? 'text-red-600' : p.isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                    {p.stock}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">เส้น</span>
                </td>
                <td className="px-4 py-3 text-right text-slate-600">฿{p.priceCash.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">฿{p.stockValue.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  {p.stock === 0
                    ? <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">หมด</span>
                    : p.isLow
                    ? <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-600">⚠ ใกล้หมด</span>
                    : <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600">ปกติ</span>
                  }
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onAdjust(p.id)}
                    className="text-xs font-semibold text-slate-500 hover:text-green-600 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    ปรับ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Movement Log ──────────────────────────────────────────────────────────────

function MovementLog({ movements }: { movements: MovementRow[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return movements;
    return movements.filter(m =>
      m.productName.toLowerCase().includes(q) || m.refNo.toLowerCase().includes(q)
    );
  }, [movements, search]);

  return (
    <div>
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาสินค้า, เลขอ้างอิง..."
            className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-green-400"
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  {movements.length === 0 ? 'ยังไม่มีประวัติการเคลื่อนไหว' : 'ไม่พบรายการ'}
                </td>
              </tr>
            ) : filtered.map(m => (
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <ArrowDownCircle size={16} /> รับสินค้าเข้า
            </button>
            <button
              onClick={() => setModal('out')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-green-600 hover:bg-green-50 transition-colors"
            >
              <ArrowUpCircle size={16} /> เบิกสินค้าออก
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'มูลค่าสต๊อกรวม',  value: `฿${(stats.totalValue / 1000).toFixed(0)}K`, sub: `${stats.totalItems} ชิ้น`, color: '' },
            { label: 'สินค้าใกล้หมด',   value: String(stats.lowStockCount), sub: `< 8 เส้น`, color: stats.lowStockCount > 0 ? 'text-amber-600' : '' },
            { label: 'รับเข้าวันนี้',   value: `+${stats.todayIn}`,  sub: 'ชิ้น', color: 'text-emerald-600' },
            { label: 'เบิกออกวันนี้',   value: `-${stats.todayOut}`, sub: 'ชิ้น', color: 'text-green-700' },
            { label: 'คงเหลือสุทธิ',    value: stats.todayIn - stats.todayOut >= 0 ? `+${stats.todayIn - stats.todayOut}` : String(stats.todayIn - stats.todayOut), sub: 'วันนี้', color: '' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
              <p className={`text-xl font-black ${s.color || 'text-slate-900'}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              <p className="text-[10px] text-slate-300 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Tabs */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-slate-100">
              {([
                { key: 'stock',     label: `สต๊อกสินค้า (${stockItems.length})` },
                { key: 'movements', label: `ประวัติการเคลื่อนไหว (${movements.length})` },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                    tab === t.key
                      ? 'border-green-600 text-green-600'
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
          <div className="space-y-4">
            {/* Low stock */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" />
                <h2 className="font-bold text-slate-900 text-sm">สินค้าใกล้หมด</h2>
                {lowItems.length > 0 && (
                  <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{lowItems.length}</span>
                )}
              </div>
              <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                {lowItems.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                    <CheckCircle size={14} /> สต๊อกครบทุกรายการ
                  </div>
                ) : lowItems.map(item => (
                  <div key={item.id} className={`rounded-xl p-3 border ${item.stock === 0 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">{item.label}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${item.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        {item.stock} เหลือ
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-amber-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${item.stock === 0 ? 'bg-red-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min((item.stock / 8) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">ขั้นต่ำ 8</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today summary */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                <Package size={15} className="text-slate-400" /> สรุปสต๊อกวันนี้
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'รับเข้าทั้งหมด', value: `+${stats.todayIn} ชิ้น`,  color: 'text-emerald-600' },
                  { label: 'เบิกออกทั้งหมด', value: `-${stats.todayOut} ชิ้น`, color: 'text-green-700'   },
                  { label: 'คงเหลือสุทธิ',   value: `${stats.todayIn - stats.todayOut >= 0 ? '+' : ''}${stats.todayIn - stats.todayOut} ชิ้น`, color: 'text-slate-900' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">{row.label}</span>
                    <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
                <div className="border-t border-slate-100 pt-2.5 mt-2.5 flex justify-between items-center">
                  <span className="text-sm text-slate-500">มูลค่าสต๊อกรวม</span>
                  <span className="text-sm font-black text-slate-900">฿{stats.totalValue.toLocaleString()}</span>
                </div>
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
