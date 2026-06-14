"use client";

import { useState, useMemo } from 'react';
import {
  Search, Plus, Download, Edit2, Trash2, X, Package,
  ChevronUp, ChevronDown, ChevronsUpDown, Tag, Layers,
  ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Product = {
  id: number;
  brand: string;
  model: string;
  size: string;
  type: string;
  note: string;
  priceCash: number;
  priceCredit: number;
  priceInstallment: number;
  stock: number;
  year: string;
};

type SortKey = keyof Product;
type SortDir = 'asc' | 'desc';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ALL_PRODUCTS: Product[] = [
  // 155/65R13
  { id: 101, brand: "MAXXIS",    model: "MAP5",          size: "155/65R13", type: "",           note: "",               priceCash: 1500, priceCredit: 1545.00, priceInstallment: 1575.44, stock: 14, year: "26" },
  { id: 102, brand: "GITI",      model: "T20",           size: "155/65R13", type: "",           note: "",               priceCash: 1960, priceCredit: 2008.50, priceInstallment: 2048.07, stock: 8,  year: "26" },
  { id: 103, brand: "SAILUN",    model: "ELITE 2",       size: "155/65R13", type: "",           note: "",               priceCash: 1450, priceCredit: 1493.50, priceInstallment: 1522.92, stock: 20, year: "26" },
  // 185/65R15
  { id: 1,   brand: "BRIDGESTONE",model: "TECHNO",       size: "185/65R15", type: "",           note: "",               priceCash: 2050, priceCredit: 2111.50, priceInstallment: 2153.09, stock: 20, year: "26" },
  { id: 2,   brand: "YOKOHAMA",  model: "E70",           size: "185/65R15", type: "",           note: "",               priceCash: 1950, priceCredit: 2008.50, priceInstallment: 2048.07, stock: 24, year: "26" },
  { id: 3,   brand: "CONTI",     model: "CC7",           size: "185/65R15", type: "",           note: "",               priceCash: 1850, priceCredit: 1905.50, priceInstallment: 1943.04, stock: 18, year: "26" },
  { id: 4,   brand: "GOODYEAR",  model: "DURAPLUS 2",   size: "185/65R15", type: "",           note: "4 เส้น ลด 200.-",priceCash: 1800, priceCredit: 1854.00, priceInstallment: 1890.52, stock: 28, year: "26" },
  { id: 5,   brand: "DUNLOP",    model: "SP2030",        size: "185/65R15", type: "",           note: "",               priceCash: 1800, priceCredit: 1854.00, priceInstallment: 1890.52, stock: 30, year: "26" },
  // 195/65R15
  { id: 6,   brand: "DAYTON",    model: "DT30",          size: "195/65R15", type: "",           note: "4 เส้น ลด 200.-",priceCash: 1700, priceCredit: 1751.00, priceInstallment: 1785.49, stock: 32, year: "26" },
  { id: 7,   brand: "BRIDGESTONE",model: "EP150",        size: "195/65R15", type: "",           note: "4 เส้น ลด 400.-",priceCash: 2350, priceCredit: 2420.50, priceInstallment: 2468.18, stock: 16, year: "26" },
  { id: 8,   brand: "MICHELIN",  model: "XM2+",          size: "195/65R15", type: "",           note: "",               priceCash: 3300, priceCredit: 3399.00, priceInstallment: 3465.96, stock: 8,  year: "26" },
  { id: 9,   brand: "GOODYEAR",  model: "MAXGUARD",      size: "195/65R15", type: "",           note: "4 เส้น ลด 200.-",priceCash: 2150, priceCredit: 2214.50, priceInstallment: 2258.12, stock: 14, year: "26" },
  { id: 10,  brand: "TOYO",      model: "CR1",           size: "195/65R15", type: "",           note: "",               priceCash: 2300, priceCredit: 2369.00, priceInstallment: 2415.67, stock: 22, year: "26" },
  { id: 11,  brand: "DUNLOP",    model: "EC300+",        size: "195/65R15", type: "",           note: "",               priceCash: 1850, priceCredit: 1905.50, priceInstallment: 1943.04, stock: 16, year: "26" },
  // 205/55R16
  { id: 12,  brand: "BRIDGESTONE",model: "EP300",        size: "205/55R16", type: "",           note: "4 เส้น ลด 400.-",priceCash: 2750, priceCredit: 2832.50, priceInstallment: 2888.30, stock: 12, year: "26" },
  { id: 13,  brand: "YOKOHAMA",  model: "AE51",          size: "205/55R16", type: "",           note: "",               priceCash: 2850, priceCredit: 2935.50, priceInstallment: 2993.33, stock: 10, year: "26" },
  { id: 14,  brand: "PIRELLI",   model: "CINTURATO ROSSO",size:"205/55R16", type: "",           note: "",               priceCash: 2450, priceCredit: 2523.50, priceInstallment: 2573.21, stock: 4,  year: "25" },
  { id: 15,  brand: "DUNLOP",    model: "LM705",         size: "205/55R16", type: "",           note: "",               priceCash: 2100, priceCredit: 2163.00, priceInstallment: 2205.61, stock: 20, year: "26" },
  // 215/45R17
  { id: 16,  brand: "DUNLOP",    model: "BLUE RESPONSE TG",size:"215/45R17",type: "EV",        note: "",               priceCash: 2000, priceCredit: 2060.00, priceInstallment: 2100.58, stock: 12, year: "26" },
  { id: 17,  brand: "YOKOHAMA",  model: "V553",          size: "215/45R17", type: "EV / Non EV",note: "",              priceCash: 2950, priceCredit: 3038.50, priceInstallment: 3098.36, stock: 6,  year: "26" },
  // 265/65R17
  { id: 18,  brand: "TOYO",      model: "H/T2",          size: "265/65R17", type: "",           note: "ตัวหนังสือขาว",  priceCash: 3100, priceCredit: 3193.00, priceInstallment: 3255.90, stock: 8,  year: "26" },
  { id: 19,  brand: "ALLIANCE",  model: "AL30",          size: "185/70R14", type: "",           note: "",               priceCash: 1800, priceCredit: 1854.00, priceInstallment: 1890.52, stock: 40, year: "26" },
];

const PAGE_SIZE = 10;

const EMPTY_FORM: Omit<Product, 'id'> = {
  brand: '', model: '', size: '', type: '', note: '',
  priceCash: 0, priceCredit: 0, priceInstallment: 0, stock: 0, year: '26',
};

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

// Brand color map
const BRAND_COLORS: Record<string, string> = {
  BRIDGESTONE: "bg-blue-50 text-blue-700 border-blue-200",
  MICHELIN:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  YOKOHAMA:    "bg-orange-50 text-orange-700 border-orange-200",
  DUNLOP:      "bg-purple-50 text-purple-700 border-purple-200",
  GOODYEAR:    "bg-green-50 text-green-700 border-green-200",
  TOYO:        "bg-red-50 text-red-700 border-red-200",
  PIRELLI:     "bg-slate-50 text-slate-700 border-slate-300",
  MAXXIS:      "bg-teal-50 text-teal-700 border-teal-200",
};
const getBrandColor = (brand: string) =>
  BRAND_COLORS[brand] ?? "bg-slate-50 text-slate-700 border-slate-200";

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={11} className="text-slate-300 ml-1 inline" />;
  return sortDir === 'asc'
    ? <ChevronUp size={11} className="text-slate-700 ml-1 inline" />
    : <ChevronDown size={11} className="text-slate-700 ml-1 inline" />;
}

export default function ProductsPage() {
  // Derive all unique sizes sorted naturally
  const allSizes = useMemo(
    () => [...new Set(ALL_PRODUCTS.map(p => p.size))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    []
  );

  const [products, setProducts]       = useState<Product[]>(ALL_PRODUCTS);
  const [sizeTab, setSizeTab]         = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [search, setSearch]           = useState('');
  const [sortKey, setSortKey]         = useState<SortKey>('brand');
  const [sortDir, setSortDir]         = useState<SortDir>('asc');
  const [modal, setModal]             = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget]   = useState<Product | null>(null);
  const [form, setForm]               = useState<Omit<Product, 'id'>>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [page, setPage]                 = useState(1);

  // Brands available in current size tab
  const availableBrands = useMemo(() => {
    const base = sizeTab === 'all' ? products : products.filter(p => p.size === sizeTab);
    return [...new Set(base.map(p => p.brand))].sort();
  }, [products, sizeTab]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products
      .filter(p => {
            const matchSize   = sizeTab === 'all' || p.size === sizeTab;
        const matchBrand  = !brandFilter || p.brand === brandFilter;
        const matchSearch = !q || p.brand.toLowerCase().includes(q) || p.model.toLowerCase().includes(q);
        return matchSize && matchBrand && matchSearch;
      })
      .sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv : String(av).localeCompare(String(bv), 'th');
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [products, sizeTab, brandFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }

  // Reset page when filter changes
  // (handled inline via setPage(1) in each filter setter)

  function openAdd()    { setForm(EMPTY_FORM); setModal('add'); }
  function openEdit(p: Product) { const { id, ...r } = p; setEditTarget(p); setForm(r); setModal('edit'); }
  function closeModal() { setModal(null); setEditTarget(null); }

  function handleSave() {
    if (!form.brand || !form.model) return;
    if (modal === 'add') {
      setProducts(prev => [...prev, { id: Math.max(...prev.map(p => p.id)) + 1, ...form }]);
    } else if (modal === 'edit' && editTarget) {
      setProducts(prev => prev.map(p => p.id === editTarget.id ? { id: p.id, ...form } : p));
    }
    closeModal();
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  // Stats
  const totalStock  = products.reduce((s, p) => s + p.stock, 0);
  const lowStock    = products.filter(p => p.stock > 0 && p.stock <= 6).length;
  const allBrands   = [...new Set(products.map(p => p.brand))];

  return (
    <div className="max-w-full mx-auto space-y-5">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">สินค้า / สต๊อก</h1>
          <p className="text-xs text-slate-400 mt-0.5">ราคารวมค่าติดตั้ง จำนวน 1 เส้น · อัปเดต 25/03/69</p>
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

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Package size={16} className="text-slate-600" />, label: "SKU ทั้งหมด",  value: products.length,   sub: "รายการ",  bg: "bg-slate-100" },
          { icon: <Layers  size={16} className="text-slate-600" />, label: "ยี่ห้อ",        value: allBrands.length, sub: "ยี่ห้อ",  bg: "bg-slate-100" },
          { icon: <Tag     size={16} className="text-slate-600" />, label: "สต๊อกรวม",   value: totalStock,       sub: "เส้น",    bg: "bg-slate-100" },
          { icon: <Tag     size={16} className="text-amber-600" />, label: "ใกล้หมด (≤6)",value: lowStock,         sub: "รายการ",  bg: "bg-amber-50" },
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

      {/* ── Size Tab Selector ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-0 overflow-x-auto border-b border-slate-100" style={{ scrollbarWidth: 'none' }}>
          {/* "ทั้งหมด" tab */}
          <button
            onClick={() => { setSizeTab('all'); setBrandFilter(''); }}
            className={`shrink-0 px-5 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap
              ${sizeTab === 'all'
                ? 'border-slate-900 text-slate-900 bg-slate-50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
          >
            ทั้งหมด
            <span className="ml-1.5 text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
              {products.length}
            </span>
          </button>
          {allSizes.map(size => {
            const count = products.filter(p => p.size === size).length;
            return (
              <button
                key={size}
                onClick={() => { setSizeTab(size); setBrandFilter(''); }}
                className={`shrink-0 px-5 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap
                  ${sizeTab === size
                    ? 'border-rose-500 text-rose-600 bg-rose-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {size}
                <span className="ml-1.5 text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Brand Pill Filter + Search ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">ยี่ห้อ:</span>
            <button
              onClick={() => setBrandFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
                ${!brandFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
            >
              ทั้งหมด
            </button>
            {availableBrands.map(b => (
              <button
                key={b}
                onClick={() => setBrandFilter(b === brandFilter ? '' : b)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
                  ${brandFilter === b
                    ? `${getBrandColor(b)} shadow-sm`
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
              >
                {b}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหารุ่นยาง..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-8 py-1.5 w-48 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('brand')}>
                  ยี่ห้อ / รุ่น <SortIcon col="brand" sortKey={sortKey} sortDir={sortDir} />
                </th>
                {sizeTab === 'all' && (
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleSort('size')}>
                    ขนาด <SortIcon col="size" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                )}
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32">ประเภท</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-700 uppercase tracking-wider w-32 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('priceCash')}>
                  เงินสด/โอน <SortIcon col="priceCash" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('priceCredit')}>
                  รูดบัตร <SortIcon col="priceCredit" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('priceInstallment')}>
                  ผ่อน 0% 4ด. <SortIcon col="priceInstallment" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-16 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('stock')}>
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
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBrandColor(p.brand)}`}>
                        {p.brand}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-800 text-[13px]">{p.model}</span>
                      </div>
                    </div>
                  </td>
                  {sizeTab === 'all' && (
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {p.size}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3.5 text-center">
                    {p.type
                      ? <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{p.type}</span>
                      : <span className="text-slate-200">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm font-black text-slate-900 tabular-nums">{fmt(p.priceCash)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-400 tabular-nums text-xs">{fmt(p.priceCredit)}</td>
                  <td className="px-4 py-3.5 text-right text-slate-500 tabular-nums text-xs font-semibold bg-slate-50/60">{fmt(p.priceInstallment)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md tabular-nums ${
                      p.stock === 0   ? 'bg-red-50 text-red-500' :
                      p.stock <= 6    ? 'bg-amber-50 text-amber-600' :
                                        'text-slate-500 bg-slate-50'
                    }`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">'{p.year}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors" title="แก้ไข">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors" title="ลบ">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-sm text-slate-400">
                    ไม่พบสินค้าในขนาดนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* info */}
          <span className="text-[11px] text-slate-400 order-2 sm:order-1">
            แสดง{' '}
            <span className="font-semibold text-slate-600">
              {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
            </span>{' '}
            จาก{' '}<span className="font-semibold text-slate-600">{filtered.length}</span> รายการ
            {sizeTab !== 'all' && <span> · ขนาด <span className="font-semibold text-slate-800">{sizeTab}</span></span>}
            {brandFilter && <span> · <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] border ${getBrandColor(brandFilter)}`}>{brandFilter}</span></span>}
          </span>

          {/* pagination controls */}
          <div className="flex items-center gap-1 order-1 sm:order-2">
            {/* clear filters */}
            {(brandFilter || search || sizeTab !== 'all') && (
              <button onClick={() => { setSizeTab('all'); setBrandFilter(''); setSearch(''); setPage(1); }}
                className="mr-2 text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium border border-slate-200 px-2 py-1 rounded-lg bg-white hover:bg-slate-50 transition-colors">
                <X size={11} /> ล้างตัวกรอง
              </button>
            )}

            {/* prev */}
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>

            {/* page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | '...')[]
              >((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === '...'
                  ? <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[11px] text-slate-400">…</span>
                  : <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors
                        ${page === n
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {n}
                    </button>
              )
            }

            {/* next */}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">{modal === 'add' ? 'เพิ่มสินค้าใหม่' : 'แก้ไขสินค้า'}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <Field label="ยี่ห้อ *">
                  <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value.toUpperCase() }))} className={inputCls} placeholder="MICHELIN" />
                </Field>
                <Field label="รุ่น / ลาย *">
                  <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value.toUpperCase() }))} className={inputCls} placeholder="XM2+" />
                </Field>
                <Field label="ขนาดยาง">
                  <input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} className={inputCls} placeholder="195/65R15" />
                </Field>
                <Field label="ประเภท">
                  <input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls} placeholder="EV, Non EV ..." />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="ราคาเงินสด"><input type="number" value={form.priceCash || ''} onChange={e => setForm(f => ({ ...f, priceCash: +e.target.value }))} className={inputCls} /></Field>
                <Field label="รูดบัตร"><input type="number" value={form.priceCredit || ''} onChange={e => setForm(f => ({ ...f, priceCredit: +e.target.value }))} className={inputCls} /></Field>
                <Field label="ผ่อน 0%"><input type="number" value={form.priceInstallment || ''} onChange={e => setForm(f => ({ ...f, priceInstallment: +e.target.value }))} className={inputCls} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="จำนวนสต๊อก"><input type="number" value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: +e.target.value }))} className={inputCls} /></Field>
                <Field label="ปีผลิต (2 หลัก)"><input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className={inputCls} placeholder="26" maxLength={2} /></Field>
              </div>
              <Field label="หมายเหตุ / โปรโมชั่น">
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className={inputCls} placeholder="4 เส้น ลด 200.-" />
              </Field>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">ยกเลิก</button>
              <button onClick={handleSave} disabled={!form.brand || !form.model}
                className="px-5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {modal === 'add' ? 'เพิ่มสินค้า' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
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
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors">ลบเลย</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}
