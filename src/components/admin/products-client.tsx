'use client';

import { useState, useMemo, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Download, Edit2, Trash2, X, Package,
  ChevronUp, ChevronDown, ChevronsUpDown, Tag, Layers,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  Upload, ImageIcon,
} from 'lucide-react';
import { createProduct, updateProduct, deleteProduct } from '@/app/actions/products';
import { uploadImage } from '@/app/actions/upload';
import { getBrands } from '@/app/actions/brands';
import type { ProductRow } from '@/lib/products';
import type { BrandRow } from '@/app/actions/brands';

type SortKey = keyof ProductRow;
type SortDir = 'asc' | 'desc';

const CATEGORIES: Record<string, string> = {
  touring: 'ทั่วไป', eco: 'ประหยัดพลังงาน', sport: 'สปอร์ต', suv: 'SUV/PPV', allseason: 'ออลซีซั่น',
};

const PAGE_SIZE = 10;

// สูตรจาก Excel: รูดบัตรคิดค่าธรรมเนียม 3%, ผ่อน 0% 4 เดือนคิดดอกเบี้ย 0.8%/เดือน + ค่าธรรมเนียม 1.5% ครั้งเดียว ทั้งสองบวก VAT 7% (x107%) บนค่าธรรมเนียม
function calcDerivedPrices(cash: number) {
  const priceCredit = cash + cash * 0.03 * 1.07;
  const priceInstallment = cash + cash * 4 * 0.008 * 1.07 + cash * 0.015 * 1.07;
  return { priceCredit: Math.round(priceCredit), priceInstallment: Math.round(priceInstallment) };
}

const EMPTY_FORM = {
  brand: '', model: '', size: '', type: '', note: '',
  priceCash: 0, priceCredit: 0, priceInstallment: 0, costPrice: 0,
  oldPrice: undefined as number | undefined,
  badge: '',
  image: '/yang.png',
  category: 'touring' as const,
  stock: 0, year: '26',
};

const BRAND_COLORS: Record<string, string> = {
  BRIDGESTONE: 'bg-blue-50 text-blue-700 border-blue-200',
  MICHELIN:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  YOKOHAMA:    'bg-orange-50 text-orange-700 border-orange-200',
  DUNLOP:      'bg-purple-50 text-purple-700 border-purple-200',
  GOODYEAR:    'bg-green-50 text-green-700 border-green-200',
  TOYO:        'bg-red-50 text-red-700 border-red-200',
  PIRELLI:     'bg-slate-50 text-slate-700 border-slate-300',
  MAXXIS:      'bg-teal-50 text-teal-700 border-teal-200',
};
const getBrandColor = (b: string) => BRAND_COLORS[b] ?? 'bg-slate-50 text-slate-700 border-slate-200';
const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

function SortIcon({ col, sortKey, sortDir }: { col: string; sortKey: string; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={11} className="text-slate-300 ml-1 inline" />;
  return sortDir === 'asc'
    ? <ChevronUp size={11} className="text-slate-700 ml-1 inline" />
    : <ChevronDown size={11} className="text-slate-700 ml-1 inline" />;
}

export function ProductsClient({ initialProducts, initialBrands }: { initialProducts: ProductRow[]; initialBrands: BrandRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [brands, setBrands] = useState<BrandRow[]>(initialBrands);
  const [brandOpen, setBrandOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sizeTab, setSizeTab]         = useState('all');
  const [brandFilter, setBrandFilter] = useState('');
  const [search, setSearch]           = useState('');
  const [sortKey, setSortKey]         = useState<string>('brand');
  const [sortDir, setSortDir]         = useState<SortDir>('asc');
  const [modal, setModal]             = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget]   = useState<ProductRow | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [page, setPage]               = useState(1);
  const [error, setError]             = useState('');

  const allSizes = useMemo(
    () => [...new Set(initialProducts.map(p => p.size))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [initialProducts]
  );

  const availableBrands = useMemo(() => {
    const base = sizeTab === 'all' ? initialProducts : initialProducts.filter(p => p.size === sizeTab);
    return [...new Set(base.map(p => p.brand))].sort();
  }, [initialProducts, sizeTab]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initialProducts
      .filter(p => {
        const matchSize  = sizeTab === 'all' || p.size === sizeTab;
        const matchBrand = !brandFilter || p.brand === brandFilter;
        const matchSearch = !q || String(p.brand || '').toLowerCase().includes(q) || String(p.model || '').toLowerCase().includes(q) || String(p.size || '').toLowerCase().includes(q);
        return matchSize && matchBrand && matchSearch;
      })
      .sort((a, b) => {
        const av = a[sortKey as keyof ProductRow] as string | number;
        const bv = b[sortKey as keyof ProductRow] as string | number;
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv : String(av).localeCompare(String(bv), 'th');
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [initialProducts, sizeTab, brandFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }

  function openAdd() { setForm(EMPTY_FORM); setError(''); setModal('add'); }
  function openEdit(p: ProductRow) {
    setEditTarget(p);
    setForm({
      brand: p.brand, model: p.model, size: p.size, type: p.type, note: p.note,
      priceCash: p.priceCash, priceCredit: p.priceCredit, priceInstallment: p.priceInstallment, costPrice: p.costPrice ?? 0,
      oldPrice: p.oldPrice, badge: p.badge ?? '',
      image: p.image || '/yang.png',
      category: p.category as typeof EMPTY_FORM.category,
      stock: p.stock, year: p.year,
    });
    setError('');
    setModal('edit');
  }
  function closeModal() { setModal(null); setEditTarget(null); setError(''); }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { url } = await uploadImage(fd, 'products');
      setForm(f => ({ ...f, image: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleSave() {
    if (!form.brand || !form.model || !form.size) return;
    const data = {
      ...form,
      oldPrice: form.oldPrice || undefined,
      badge: form.badge || undefined,
    };
    startTransition(async () => {
      const res = modal === 'add'
        ? await createProduct(data)
        : await updateProduct(editTarget!.id, data);
      if (!res.ok) { setError(res.error); return; }
      closeModal();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  const totalStock = initialProducts.reduce((s, p) => s + p.stock, 0);
  const lowStock   = initialProducts.filter(p => p.stock > 0 && p.stock <= 6).length;
  const allBrands  = [...new Set(initialProducts.map(p => p.brand))];

  return (
    <div className="max-w-full mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">สินค้า / สต๊อก</h1>
          <p className="text-xs text-slate-400 mt-0.5">ราคารวมค่าติดตั้ง จำนวน 1 เส้น</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Download size={13} /> Export
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition-colors shadow-sm">
            <Plus size={13} /> เพิ่มสินค้า
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Package size={16} className="text-slate-600" />, label: 'SKU ทั้งหมด',  value: initialProducts.length, sub: 'รายการ', bg: 'bg-slate-100' },
          { icon: <Layers  size={16} className="text-slate-600" />, label: 'ยี่ห้อ',        value: allBrands.length,       sub: 'ยี่ห้อ',  bg: 'bg-slate-100' },
          { icon: <Tag     size={16} className="text-slate-600" />, label: 'สต๊อกรวม',     value: totalStock,             sub: 'เส้น',   bg: 'bg-slate-100' },
          { icon: <Tag     size={16} className="text-amber-600" />, label: 'ใกล้หมด (≤6)', value: lowStock,               sub: 'รายการ', bg: 'bg-amber-50'  },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className={`${s.bg} p-2 rounded-lg`}>{s.icon}</div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
              <p className="text-lg font-bold text-slate-900 leading-none mt-0.5">
                {s.value} <span className="text-xs font-normal text-slate-400">{s.sub}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Size tabs */}
        <div className="flex items-center gap-0 overflow-x-auto border-b border-slate-100" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => { setSizeTab('all'); setBrandFilter(''); setPage(1); }}
            className={`shrink-0 px-5 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap
              ${sizeTab === 'all' ? 'border-slate-900 text-slate-900 bg-slate-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            ทั้งหมด <span className="ml-1.5 text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{initialProducts.length}</span>
          </button>
          {allSizes.map(size => (
            <button key={size}
              onClick={() => { setSizeTab(size); setBrandFilter(''); setPage(1); }}
              className={`shrink-0 px-5 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap
                ${sizeTab === size ? 'border-green-500 text-green-600 bg-green-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {size} <span className="ml-1.5 text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{initialProducts.filter(p => p.size === size).length}</span>
            </button>
          ))}
        </div>

        {/* Brand filter + search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">ยี่ห้อ:</span>
            <select
              value={brandFilter}
              onChange={e => { setBrandFilter(e.target.value); setPage(1); }}
              className="text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-colors w-48 font-semibold cursor-pointer appearance-none"
            >
              <option value="">ทั้งหมด ({availableBrands.length} ยี่ห้อ)</option>
              {availableBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <ChevronDown size={12} className="text-slate-400 -ml-7 pointer-events-none" />
          </div>
          <div className="relative shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" placeholder="ค้นหารุ่นยาง..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-8 py-1.5 w-48 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X size={12} /></button>}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('brand')}>
                  ยี่ห้อ / รุ่น <SortIcon col="brand" sortKey={sortKey} sortDir={sortDir} />
                </th>
                {sizeTab === 'all' && (
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('size')}>
                    ขนาด <SortIcon col="size" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                )}
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32">ประเภท</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-amber-600 uppercase tracking-wider w-24 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('costPrice')}>
                  ต้นทุน <SortIcon col="costPrice" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-700 uppercase tracking-wider w-32 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('priceCash')}>
                  เงินสด/โอน <SortIcon col="priceCash" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('priceCredit')}>
                  รูดบัตร <SortIcon col="priceCredit" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('priceInstallment')}>
                  ผ่อน 0% 4ด. <SortIcon col="priceInstallment" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-16 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('stock')}>
                  สต๊อก <SortIcon col="stock" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12">ปี</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-4 py-3.5 text-[11px] text-slate-300 tabular-nums">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBrandColor(p.brand)}`}>{p.brand}</span>
                      <span className="font-semibold text-slate-800 text-[13px]">{p.model}</span>
                    </div>
                  </td>
                  {sizeTab === 'all' && (
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{p.size}</span>
                    </td>
                  )}
                  <td className="px-4 py-3.5 text-center">
                    {p.type ? <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{p.type}</span> : <span className="text-slate-200">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-xs font-semibold text-amber-600 tabular-nums">{p.costPrice ? fmt(p.costPrice) : '—'}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm font-black text-slate-900 tabular-nums">{fmt(p.priceCash)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-400 tabular-nums text-xs">{fmt(p.priceCredit)}</td>
                  <td className="px-4 py-3.5 text-right text-slate-500 tabular-nums text-xs font-semibold bg-slate-50/60">{fmt(p.priceInstallment)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md tabular-nums ${p.stock === 0 ? 'bg-red-50 text-red-500' : p.stock <= 6 ? 'bg-amber-50 text-amber-600' : 'text-slate-500 bg-slate-50'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">'{p.year}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Edit2 size={12} /></button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="py-20 text-center text-sm text-slate-400">ไม่พบสินค้าในขนาดนี้</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 order-2 sm:order-1">
            แสดง <span className="font-semibold text-slate-600">{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> จาก <span className="font-semibold text-slate-600">{filtered.length}</span> รายการ
          </span>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            {(brandFilter || search || sizeTab !== 'all') && (
              <button onClick={() => { setSizeTab('all'); setBrandFilter(''); setSearch(''); setPage(1); }}
                className="mr-2 text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium border border-slate-200 px-2 py-1 rounded-lg bg-white hover:bg-slate-50 transition-colors">
                <X size={11} /> ล้างตัวกรอง
              </button>
            )}
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | '...')[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(n); return acc;
              }, [])
              .map((n, i) => n === '...'
                ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-[11px] text-slate-400">…</span>
                : <button key={n} onClick={() => setPage(n as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${page === n ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    {n}
                  </button>
              )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRightIcon size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">{modal === 'add' ? 'เพิ่มสินค้าใหม่' : 'แก้ไขสินค้า'}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <Field label="ยี่ห้อ *">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setBrandOpen(o => !o)}
                      className={`${inputCls} flex items-center gap-2 text-left`}
                    >
                      {form.brand ? (
                        <>
                          {brands.find(b => b.name === form.brand)?.logo ? (
                            <img src={brands.find(b => b.name === form.brand)!.logo} alt={form.brand} className="h-4 w-8 object-contain shrink-0" />
                          ) : null}
                          <span className="font-bold text-slate-800">{form.brand}</span>
                        </>
                      ) : (
                        <span className="text-slate-400">เลือกแบรนด์</span>
                      )}
                      <ChevronDown size={12} className="ml-auto text-slate-400 shrink-0" />
                    </button>
                    {brandOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                        {brands.length === 0 ? (
                          <div className="px-3 py-4 text-xs text-slate-400 text-center">
                            ยังไม่มีแบรนด์ —{' '}
                            <a href="/admin/brands" className="text-green-600 underline">เพิ่มแบรนด์ก่อน</a>
                          </div>
                        ) : brands.map(b => (
                          <button key={b.id} type="button"
                            onClick={() => { setForm(f => ({ ...f, brand: b.name })); setBrandOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${form.brand === b.name ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-700'}`}
                          >
                            {b.logo ? (
                              <img src={b.logo} alt={b.name} className="h-5 w-10 object-contain shrink-0" />
                            ) : (
                              <span className="w-10 text-center text-slate-300 font-bold text-[10px]">{b.name.slice(0, 2)}</span>
                            )}
                            {b.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>
                <Field label="รุ่น / ลาย *">
                  <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value.toUpperCase() }))} className={inputCls} placeholder="XM2+" />
                </Field>
                <Field label="ขนาดยาง *">
                  <input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} className={inputCls} placeholder="195/65R15" />
                </Field>
                <Field label="หมวดหมู่">
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as typeof form.category }))} className={inputCls}>
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="ประเภท">
                  <input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls} placeholder="EV, Non EV ..." />
                </Field>
                <Field label="ปีผลิต (2 หลัก)">
                  <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className={inputCls} placeholder="26" maxLength={2} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="ราคาเงินสด *">
                  <input type="number" value={form.priceCash || ''} onChange={e => { const cash = +e.target.value; setForm(f => ({ ...f, priceCash: cash, ...calcDerivedPrices(cash) })); }} className={inputCls} />
                  {form.costPrice > 0 && (() => {
                    const profit = form.priceCash - form.costPrice;
                    const marginPct = (profit / form.costPrice) * 100;
                    return (
                      <p className={`text-[10px] mt-1 font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        กำไร ฿{profit.toLocaleString()} ({marginPct.toFixed(1)}%)
                      </p>
                    );
                  })()}
                </Field>
                <Field label="รูดบัตร">
                  <input type="number" value={form.priceCredit || ''} onChange={e => setForm(f => ({ ...f, priceCredit: +e.target.value }))} className={inputCls} />
                  <p className="text-[10px] text-slate-400 mt-1">คำนวณอัตโนมัติจากราคาเงินสด แก้ไขเองได้</p>
                </Field>
                <Field label="ผ่อน 0%">
                  <input type="number" value={form.priceInstallment || ''} onChange={e => setForm(f => ({ ...f, priceInstallment: +e.target.value }))} className={inputCls} />
                  <p className="text-[10px] text-slate-400 mt-1">คำนวณอัตโนมัติจากราคาเงินสด แก้ไขเองได้</p>
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="ราคาต้นทุน (ซื้อเข้า)"><input type="number" value={form.costPrice || ''} onChange={e => setForm(f => ({ ...f, costPrice: +e.target.value }))} className={inputCls} /></Field>
                <Field label="ราคาเดิม (ถ้ามี)"><input type="number" value={form.oldPrice || ''} onChange={e => setForm(f => ({ ...f, oldPrice: +e.target.value || undefined }))} className={inputCls} /></Field>
                <Field label="จำนวนสต๊อก"><input type="number" value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: +e.target.value }))} className={inputCls} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Badge (เช่น ขายดี)">
                  <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} className={inputCls} placeholder="ขายดี, ลด 15%, SUV" />
                </Field>
                <Field label="หมายเหตุ / โปรโมชั่น">
                  <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className={inputCls} placeholder="4 เส้น ลด 200.-" />
                </Field>
              </div>
              <Field label="รูปสินค้า">
                <div className="flex items-center gap-3">
                  {/* Preview */}
                  <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                    {form.image && form.image !== '/yang.png' ? (
                      <img src={form.image} alt="preview" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon size={20} className="text-slate-300" />
                    )}
                  </div>
                  {/* Upload + URL */}
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 transition-colors"
                    >
                      <Upload size={12} />
                      {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป'}
                    </button>
                    <input
                      value={form.image}
                      onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                      className={inputCls}
                      placeholder="หรือวาง URL รูปภาพ"
                    />
                  </div>
                </div>
              </Field>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">ยกเลิก</button>
              <button onClick={handleSave} disabled={!form.brand || !form.model || !form.size || isPending}
                className="px-5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {isPending ? 'กำลังบันทึก...' : modal === 'add' ? 'เพิ่มสินค้า' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-slate-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">ลบสินค้า</h3>
            <p className="text-xs text-slate-500 mb-5">
              ยืนยันการลบ <span className="font-semibold text-slate-700">{deleteTarget.brand} {deleteTarget.model}</span>?<br />
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">ยกเลิก</button>
              <button onClick={handleDelete} disabled={isPending} className="flex-1 px-4 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-700 disabled:opacity-40 transition-colors">
                {isPending ? 'กำลังลบ...' : 'ลบเลย'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}
