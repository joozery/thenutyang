'use client';

import { useState, useMemo, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Edit2, Trash2, X, Package,
  ChevronUp, ChevronDown, ChevronsUpDown, Tag, Layers,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  Upload, ImageIcon, CircleDot, Disc3, Wrench, Disc, Zap, Droplets,
  Car, Battery, Filter, Gauge, Shield, Box, Settings,
} from 'lucide-react';
import { createProduct, updateProduct, deleteProduct } from '@/app/actions/products';
import { createCategory, deleteCategory } from '@/app/actions/categories';
import { createProductType, deleteProductType } from '@/app/actions/productTypes';
import { uploadImage } from '@/app/actions/upload';
import type { ProductRow } from '@/lib/products';
import type { BrandRow } from '@/app/actions/brands';
import type { CategoryRow } from '@/app/actions/categories';
import type { ProductTypeRow } from '@/app/actions/productTypes';

type SortDir = 'asc' | 'desc';

const ICON_MAP: Record<string, React.ElementType> = {
  CircleDot, Disc3, Wrench, Disc, Zap, Droplets,
  Package, Car, Battery, Filter, Gauge, Shield, Box, Settings,
};

const ICON_OPTIONS = [
  { name: 'CircleDot', label: 'ยาง' },
  { name: 'Disc3',     label: 'ล้อ' },
  { name: 'Wrench',    label: 'เครื่องมือ' },
  { name: 'Disc',      label: 'จาน' },
  { name: 'Zap',       label: 'โช๊ค' },
  { name: 'Droplets',  label: 'น้ำมัน' },
  { name: 'Package',   label: 'กล่อง' },
  { name: 'Car',       label: 'รถ' },
  { name: 'Battery',   label: 'แบต' },
  { name: 'Filter',    label: 'กรอง' },
  { name: 'Gauge',     label: 'มาตรวัด' },
  { name: 'Shield',    label: 'โล่' },
  { name: 'Box',       label: 'สินค้า' },
];

const PAGE_SIZE = 15;

function calcDerivedPrices(cash: number) {
  const priceCredit = cash + cash * 0.03;
  const priceInstallment = cash + cash * 4 * 0.008 * 1.07 + cash * 0.015 * 1.07;
  return { priceCredit: Math.round(priceCredit * 100) / 100, priceInstallment: Math.round(priceInstallment * 100) / 100 };
}

const EMPTY_FORM = {
  brand: '', model: '', size: '', type: '', note: '',
  priceCash: 0, priceCredit: 0, priceInstallment: 0, costPrice: 0,
  oldPrice: undefined as number | undefined,
  badge: '', image: '/yang.png',
  images: [] as string[],
  category: 'touring',
  stock: 0, year: '26',
};

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

function SortIcon({ col, sortKey, sortDir }: { col: string; sortKey: string; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={11} className="text-slate-300 ml-1 inline" />;
  return sortDir === 'asc'
    ? <ChevronUp size={11} className="text-slate-700 ml-1 inline" />
    : <ChevronDown size={11} className="text-slate-700 ml-1 inline" />;
}

export function ProductsClient({
  initialProducts,
  initialBrands,
  initialCategories,
  initialProductTypes,
  activeType,
}: {
  initialProducts: ProductRow[];
  initialBrands: BrandRow[];
  initialCategories: CategoryRow[];
  initialProductTypes: ProductTypeRow[];
  activeType: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch]               = useState('');
  const [sizeTab, setSizeTab]             = useState('all');
  const [brandFilter, setBrandFilter]     = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortKey, setSortKey]             = useState('brand');
  const [sortDir, setSortDir]             = useState<SortDir>('asc');
  const [modal, setModal]                 = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget]       = useState<ProductRow | null>(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget]   = useState<ProductRow | null>(null);
  const [page, setPage]                   = useState(1);
  const [error, setError]                 = useState('');

  /* ─── categories state ─── */
  const [categories, setCategories]     = useState<CategoryRow[]>(initialCategories);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatKey, setNewCatKey]       = useState('');
  const [newCatLabel, setNewCatLabel]   = useState('');
  const [catError, setCatError]         = useState('');
  const [catPending, setCatPending]     = useState(false);

  /* ─── product types state ─── */
  const [productTypes, setProductTypes]   = useState<ProductTypeRow[]>(initialProductTypes);
  const [ptModalOpen, setPtModalOpen]     = useState(false);
  const [newPtKey, setNewPtKey]           = useState('');
  const [newPtLabel, setNewPtLabel]       = useState('');
  const [newPtIcon, setNewPtIcon]         = useState('Package');
  const [newPtUnit, setNewPtUnit]         = useState('ชิ้น');
  const [ptError, setPtError]             = useState('');
  const [ptPending, setPtPending]         = useState(false);

  const isTire = activeType === 'tires';
  const tabInfo = productTypes.find(t => t.key === activeType) ?? productTypes[0] ?? { label: 'สินค้า', unit: 'ชิ้น', icon: 'Package' };

  /* ─── filters ─── */
  const allSizes = useMemo(
    () => [...new Set(initialProducts.map(p => p.size).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
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
        const matchSize     = sizeTab === 'all' || p.size === sizeTab;
        const matchBrand    = !brandFilter || p.brand === brandFilter;
        const matchCategory = !categoryFilter || p.category === categoryFilter;
        const matchSearch = !q ||
          p.brand.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          (p.size || '').toLowerCase().includes(q);
        return matchSize && matchBrand && matchCategory && matchSearch;
      })
      .sort((a, b) => {
        const av = a[sortKey as keyof ProductRow] as string | number;
        const bv = b[sortKey as keyof ProductRow] as string | number;
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''), 'th');
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
      brand: p.brand, model: p.model, size: p.size ?? '',
      type: p.type, note: p.note,
      priceCash: p.priceCash, priceCredit: p.priceCredit,
      priceInstallment: p.priceInstallment, costPrice: p.costPrice ?? 0,
      oldPrice: p.oldPrice, badge: p.badge ?? '',
      image: p.image || '/yang.png',
      images: p.images ?? [],
      category: p.category ?? 'touring',
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

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const { url } = await uploadImage(fd, 'products');
        setForm(f => ({ ...f, images: [...f.images, url] }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setIsUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  }

  function removeGalleryImage(idx: number) {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  function handleSave() {
    if (!form.brand || !form.model) return;
    if (isTire && !form.size) return;
    const data = {
      ...form,
      productType: activeType,
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

  async function handleAddProductType() {
    setPtError('');
    const key   = newPtKey.trim().toLowerCase().replace(/\s+/g, '_');
    const label = newPtLabel.trim();
    const unit  = newPtUnit.trim() || 'ชิ้น';
    if (!key || !label) { setPtError('กรุณากรอก Key และชื่อประเภทสินค้า'); return; }
    setPtPending(true);
    const res = await createProductType({ key, label, icon: newPtIcon, unit });
    setPtPending(false);
    if (!res.ok) { setPtError(res.error ?? 'เกิดข้อผิดพลาด'); return; }
    setProductTypes(prev => [...prev, { id: Date.now().toString(), key, label, icon: newPtIcon, unit, order: prev.length }]);
    setNewPtKey(''); setNewPtLabel(''); setNewPtIcon('Package'); setNewPtUnit('ชิ้น');
    router.refresh();
  }

  async function handleDeleteProductType(id: string) {
    setPtPending(true);
    await deleteProductType(id);
    setPtPending(false);
    setProductTypes(prev => prev.filter(t => t.id !== id));
    router.refresh();
  }

  async function handleAddCategory() {
    setCatError('');
    const key   = newCatKey.trim().toLowerCase().replace(/\s+/g, '_');
    const label = newCatLabel.trim();
    if (!key || !label) { setCatError('กรุณากรอก Key และชื่อหมวดหมู่'); return; }
    setCatPending(true);
    const res = await createCategory(activeType, key, label);
    setCatPending(false);
    if (!res.ok) { setCatError(res.error ?? 'เกิดข้อผิดพลาด'); return; }
    setCategories(prev => [...prev, { id: Date.now().toString(), key, label, productType: activeType }]);
    setNewCatKey('');
    setNewCatLabel('');
    router.refresh();
  }

  async function handleDeleteCategory(id: string) {
    setCatPending(true);
    await deleteCategory(id);
    setCatPending(false);
    setCategories(prev => prev.filter(c => c.id !== id));
    if (categoryFilter && categories.find(c => c.id === id)?.key === categoryFilter) {
      setCategoryFilter('');
    }
    router.refresh();
  }

  const totalStock = initialProducts.reduce((s, p) => s + p.stock, 0);

  return (
    <div className="max-w-full mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">สินค้า / สต๊อก</h1>
          <p className="text-xs text-slate-400 mt-0.5">จัดการสินค้าทุกหมวดหมู่</p>
        </div>
        <div className="flex items-center gap-2">
          {isTire && (
            <button onClick={() => { setCatModalOpen(true); setCatError(''); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm">
              <Tag size={13} /> หมวดหมู่
            </button>
          )}
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition-colors shadow-sm">
            <Plus size={13} /> เพิ่ม{tabInfo.label}
          </button>
        </div>
      </div>

      {/* Product Type Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {productTypes.map(tab => {
            const Icon = ICON_MAP[tab.icon] ?? Package;
            const isActive = tab.key === activeType;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setSizeTab('all'); setBrandFilter(''); setCategoryFilter(''); setSearch(''); setPage(1);
                  router.push(`/admin/products?type=${tab.key}`);
                }}
                className={`shrink-0 flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-green-500 text-green-600 bg-green-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
          <button
            onClick={() => { setPtModalOpen(true); setPtError(''); }}
            className="shrink-0 ml-auto mr-2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="จัดการประเภทสินค้า"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="bg-slate-100 p-2 rounded-lg"><Package size={16} className="text-slate-600" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">รายการทั้งหมด</p>
            <p className="text-lg font-bold text-slate-900 leading-none mt-0.5">{initialProducts.length} <span className="text-xs font-normal text-slate-400">รายการ</span></p>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="bg-slate-100 p-2 rounded-lg"><Layers size={16} className="text-slate-600" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">สต๊อกรวม</p>
            <p className="text-lg font-bold text-slate-900 leading-none mt-0.5">{totalStock} <span className="text-xs font-normal text-slate-400">{tabInfo.unit}</span></p>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="bg-amber-50 p-2 rounded-lg"><Tag size={16} className="text-amber-600" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">ใกล้หมด (≤5)</p>
            <p className="text-lg font-bold text-slate-900 leading-none mt-0.5">{initialProducts.filter(p => p.stock > 0 && p.stock <= 5).length} <span className="text-xs font-normal text-slate-400">รายการ</span></p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Size tabs — tire only */}
        {isTire && allSizes.length > 0 && (
          <div className="flex items-center gap-0 overflow-x-auto border-b border-slate-100" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => { setSizeTab('all'); setBrandFilter(''); setPage(1); }}
              className={`shrink-0 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${sizeTab === 'all' ? 'border-slate-900 text-slate-900 bg-slate-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              ทั้งหมด <span className="ml-1 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{initialProducts.length}</span>
            </button>
            {allSizes.map(size => (
              <button key={size} onClick={() => { setSizeTab(size); setBrandFilter(''); setPage(1); }}
                className={`shrink-0 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${sizeTab === size ? 'border-green-500 text-green-600 bg-green-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {size} <span className="ml-1 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{initialProducts.filter(p => p.size === size).length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Category filter pills — tire only */}
        {isTire && categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-b border-slate-100 bg-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">หมวดหมู่:</span>
            <button onClick={() => { setCategoryFilter(''); setPage(1); }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${!categoryFilter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              ทั้งหมด
            </button>
            {categories.map(cat => (
              <button key={cat.key} onClick={() => { setCategoryFilter(cat.key === categoryFilter ? '' : cat.key); setPage(1); }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${categoryFilter === cat.key ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {cat.label}
                <span className="ml-1 opacity-60">{initialProducts.filter(p => p.category === cat.key).length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search + Brand filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          {isTire && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">ยี่ห้อ:</span>
              <div className="relative">
                <select value={brandFilter} onChange={e => { setBrandFilter(e.target.value); setPage(1); }}
                  className="text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-slate-900/10 appearance-none w-44">
                  <option value="">ทั้งหมด ({availableBrands.length})</option>
                  {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
          <div className="relative ml-auto">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" placeholder={`ค้นหา${tabInfo.label}...`} value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-8 py-1.5 w-52 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X size={12} /></button>}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
                {isTire && (
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('size')}>
                    ขนาด <SortIcon col="size" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('brand')}>
                  ยี่ห้อ <SortIcon col="brand" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('model')}>
                  ชื่อ/รุ่น <SortIcon col="model" sortKey={sortKey} sortDir={sortDir} />
                </th>
                {!isTire && (
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">ขนาด/สเปค</th>
                )}
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">ประเภท</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-amber-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('costPrice')}>
                  ทุน <SortIcon col="costPrice" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('priceCash')}>
                  เงินสด <SortIcon col="priceCash" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('priceCredit')}>
                  รูดบัตร <SortIcon col="priceCredit" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('priceInstallment')}>
                  ผ่อน <SortIcon col="priceInstallment" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stock')}>
                  สต๊อก <SortIcon col="stock" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((p, idx) => {
                const logo = initialBrands.find(b => b.name === p.brand)?.logo;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-4 py-3 text-[11px] text-slate-300">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    {isTire && (
                      <td className="px-4 py-3">
                        <span className="font-mono text-[13px] font-semibold text-slate-900 bg-slate-100/80 border border-slate-200/50 px-2 py-1 rounded-md">{p.size}</span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {logo ? (
                        <img src={logo} alt={p.brand} className="h-5 w-14 object-contain mix-blend-multiply" />
                      ) : (
                        <span className="text-[11px] font-bold text-slate-700">{p.brand}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.image && p.image !== '/yang.png' && (
                          <img src={p.image} alt={p.model} className="w-7 h-7 object-contain rounded" />
                        )}
                        <span className="font-semibold text-slate-800 text-[13px]">{p.model}</span>
                        {p.badge && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">{p.badge}</span>}
                      </div>
                    </td>
                    {!isTire && (
                      <td className="px-4 py-3 text-[12px] text-slate-500">{p.size || '—'}</td>
                    )}
                    <td className="px-4 py-3 text-center">
                      {p.type ? <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{p.type}</span> : <span className="text-slate-200">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-semibold text-amber-600">{p.costPrice ? fmt(p.costPrice) : '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-black text-slate-900">{fmt(p.priceCash)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 text-xs">{fmt(p.priceCredit)}</td>
                    <td className="px-4 py-3 text-right text-slate-500 text-xs font-semibold">{fmt(p.priceInstallment)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${p.stock === 0 ? 'bg-red-50 text-red-600 border border-red-100' : p.stock <= 5 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'text-emerald-700 bg-emerald-50 border border-emerald-100'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Edit2 size={12} /></button>
                        <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="py-20 text-center text-sm text-slate-400">ยังไม่มีสินค้าในหมวดนี้</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            แสดง <span className="font-semibold text-slate-600">{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> จาก <span className="font-semibold text-slate-600">{filtered.length}</span> รายการ
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
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
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${page === n ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    {n}
                  </button>
              )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
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
              <h2 className="font-bold text-slate-900 text-sm">
                {modal === 'add' ? `เพิ่ม${tabInfo.label}ใหม่` : `แก้ไข${tabInfo.label}`}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[72vh]">
              {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div className="grid grid-cols-2 gap-4">
                {/* Brand */}
                <Field label="ยี่ห้อ *">
                  <div className="relative">
                    <button type="button" onClick={() => setBrandOpen(o => !o)}
                      className={`${inputCls} flex items-center gap-2 text-left`}>
                      {form.brand ? (
                        <>
                          {initialBrands.find(b => b.name === form.brand)?.logo && (
                            <img src={initialBrands.find(b => b.name === form.brand)!.logo} alt={form.brand} className="h-4 w-8 object-contain shrink-0" />
                          )}
                          <span className="font-bold text-slate-800">{form.brand}</span>
                        </>
                      ) : <span className="text-slate-400">เลือกแบรนด์</span>}
                      <ChevronDown size={12} className="ml-auto text-slate-400 shrink-0" />
                    </button>
                    {brandOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                        {/* พิมพ์ชื่อ brand เองก็ได้ */}
                        <div className="p-2 border-b border-slate-100">
                          <input
                            autoFocus
                            placeholder="พิมพ์ชื่อแบรนด์..."
                            className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value.trim().toUpperCase();
                                if (val) { setForm(f => ({ ...f, brand: val })); setBrandOpen(false); }
                              }
                            }}
                          />
                        </div>
                        {initialBrands.map(b => (
                          <button key={b.id} type="button"
                            onClick={() => { setForm(f => ({ ...f, brand: b.name })); setBrandOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${form.brand === b.name ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-700'}`}>
                            {b.logo && <img src={b.logo} alt={b.name} className="h-5 w-10 object-contain shrink-0" />}
                            {b.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>

                {/* Model */}
                <Field label={isTire ? 'รุ่น / ลาย *' : 'ชื่อ/รุ่นสินค้า *'}>
                  <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value.toUpperCase() }))}
                    className={inputCls} placeholder={isTire ? 'XM2+' : 'ชื่อสินค้า'} />
                </Field>

                {/* Size */}
                <Field label={isTire ? 'ขนาดยาง *' : 'ขนาด / สเปค'}>
                  <input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                    className={inputCls}
                    placeholder={isTire ? '195/65R15' : activeType === 'wheels' ? '18 นิ้ว' : activeType === 'oil' ? '5W-30 1L' : ''} />
                </Field>

                {/* Category (tire only) */}
                {isTire ? (
                  <Field label="หมวดหมู่ยาง">
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                      {categories.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                    </select>
                  </Field>
                ) : (
                  <Field label="ประเภท">
                    <input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}
                      placeholder={activeType === 'wheels' ? 'Sport, Classic...' : activeType === 'oil' ? 'Synthetic, Semi...' : ''} />
                  </Field>
                )}

                {isTire && (
                  <Field label="ประเภทยาง">
                    <input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls} placeholder="EV, Non EV..." />
                  </Field>
                )}

                <Field label="ปีผลิต (2 หลัก)">
                  <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className={inputCls} placeholder="26" maxLength={2} />
                </Field>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-4 gap-3">
                <Field label="กำไร">
                  <input type="number"
                    value={(form.priceCash - form.costPrice) || ''}
                    onChange={e => {
                      const profit = +e.target.value;
                      const cash = form.costPrice + profit;
                      setForm(f => ({ ...f, priceCash: cash, ...calcDerivedPrices(cash) }));
                    }}
                    className={inputCls} />
                  {form.costPrice > 0 && (
                    <p className={`text-[10px] mt-0.5 font-semibold ${form.priceCash - form.costPrice >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {(((form.priceCash - form.costPrice) / form.costPrice) * 100).toFixed(1)}%
                    </p>
                  )}
                </Field>
                <Field label="ราคาเงินสด *">
                  <input type="number" value={form.priceCash || ''}
                    onChange={e => { const cash = +e.target.value; setForm(f => ({ ...f, priceCash: cash, ...calcDerivedPrices(cash) })); }}
                    className={inputCls} />
                </Field>
                <Field label="รูดบัตร">
                  <input type="number" value={form.priceCredit || ''} onChange={e => setForm(f => ({ ...f, priceCredit: +e.target.value }))} className={inputCls} />
                </Field>
                <Field label="ผ่อน 0%">
                  <input type="number" value={form.priceInstallment || ''} onChange={e => setForm(f => ({ ...f, priceInstallment: +e.target.value }))} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="ราคาต้นทุน">
                  <input type="number" value={form.costPrice || ''} onChange={e => setForm(f => ({ ...f, costPrice: +e.target.value }))} className={inputCls} />
                </Field>
                <Field label="ราคาเดิม (ถ้ามี)">
                  <input type="number" value={form.oldPrice || ''} onChange={e => setForm(f => ({ ...f, oldPrice: +e.target.value || undefined }))} className={inputCls} />
                </Field>
                <Field label={`จำนวนสต๊อก (${tabInfo.unit})`}>
                  <input type="number" value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: +e.target.value }))} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Badge (เช่น ขายดี)">
                  <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} className={inputCls} placeholder="ขายดี, ลด 15%..." />
                </Field>
                <Field label="หมายเหตุ">
                  <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className={inputCls} placeholder="โปรโมชั่น, รายละเอียดเพิ่มเติม..." />
                </Field>
              </div>

              {/* Image */}
              <Field label="รูปสินค้า">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                    {form.image && form.image !== '/yang.png' ? (
                      <img src={form.image} alt="preview" className="w-full h-full object-contain" />
                    ) : <ImageIcon size={20} className="text-slate-300" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50">
                      <Upload size={12} />
                      {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป'}
                    </button>
                    <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className={inputCls} placeholder="หรือวาง URL รูปภาพ" />
                  </div>
                </div>
              </Field>

              {/* Gallery images */}
              <Field label={`รูปเพิ่มเติม (แกลเลอรี) — ${form.images.length} รูป`}>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden group/img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`รูปที่ ${idx + 2}`} className="w-full h-full object-contain" />
                      <button type="button" onClick={() => removeGalleryImage(idx)}
                        title="ลบรูปนี้"
                        className="absolute top-0.5 right-0.5 w-4.5 h-4.5 rounded-full bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleGalleryUpload} />
                  <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={isUploading}
                    className="w-16 h-16 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-green-400 hover:text-green-600 flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold disabled:opacity-50 transition-colors">
                    <Upload size={14} />
                    {isUploading ? 'กำลังอัป...' : 'เพิ่มรูป'}
                  </button>
                </div>
              </Field>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">ยกเลิก</button>
              <button onClick={handleSave} disabled={!form.brand || !form.model || (isTire && !form.size) || isPending}
                className="px-5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">
                {isPending ? 'กำลังบันทึก...' : modal === 'add' ? `เพิ่ม${tabInfo.label}` : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Type Management Modal */}
      {ptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPtModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings size={15} className="text-slate-600" />
                <h2 className="font-bold text-slate-900 text-sm">จัดการประเภทสินค้า</h2>
              </div>
              <button onClick={() => setPtModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
            </div>

            <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
              {/* Existing product types */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ประเภทสินค้าปัจจุบัน</p>
                <div className="space-y-1.5">
                  {productTypes.map(pt => {
                    const Icon = ICON_MAP[pt.icon] ?? Package;
                    return (
                      <div key={pt.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 group">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">
                            <Icon size={14} className="text-slate-600" />
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{pt.label}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">{pt.key}</span>
                          <span className="text-[10px] text-slate-400">{pt.unit}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteProductType(pt.id)}
                          disabled={ptPending}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add new product type */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เพิ่มประเภทสินค้าใหม่</p>
                {ptError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{ptError}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Key (ภาษาอังกฤษ) *</label>
                    <input value={newPtKey} onChange={e => setNewPtKey(e.target.value)} placeholder="filter_oil" className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">ชื่อที่แสดง *</label>
                    <input value={newPtLabel} onChange={e => setNewPtLabel(e.target.value)} placeholder="กรองน้ำมัน" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">หน่วยนับ</label>
                    <input value={newPtUnit} onChange={e => setNewPtUnit(e.target.value)} placeholder="ชิ้น" className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">ไอคอน</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ICON_OPTIONS.map(opt => {
                        const Ic = ICON_MAP[opt.name] ?? Package;
                        return (
                          <button key={opt.name} type="button"
                            onClick={() => setNewPtIcon(opt.name)}
                            title={opt.label}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${newPtIcon === opt.name ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                            <Ic size={14} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleAddProductType}
                  disabled={ptPending || !newPtKey.trim() || !newPtLabel.trim()}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Plus size={13} />
                  {ptPending ? 'กำลังเพิ่ม...' : 'เพิ่มประเภทสินค้า'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCatModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag size={15} className="text-slate-600" />
                <h2 className="font-bold text-slate-900 text-sm">จัดการหมวดหมู่ยาง</h2>
              </div>
              <button onClick={() => setCatModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Existing categories */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">หมวดหมู่ปัจจุบัน</p>
                {categories.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีหมวดหมู่</p>
                )}
                <div className="space-y-1.5">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 group">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">{cat.key}</span>
                        <span className="text-sm font-semibold text-slate-800">{cat.label}</span>
                        <span className="text-[10px] text-slate-400">{initialProducts.filter(p => p.category === cat.key).length} รายการ</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        disabled={catPending}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add new category */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เพิ่มหมวดหมู่ใหม่</p>
                {catError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{catError}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Key (ภาษาอังกฤษ)</label>
                    <input
                      value={newCatKey}
                      onChange={e => setNewCatKey(e.target.value)}
                      placeholder="ev_tire"
                      className={inputCls}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">ชื่อที่แสดง</label>
                    <input
                      value={newCatLabel}
                      onChange={e => setNewCatLabel(e.target.value)}
                      placeholder="ยาง EV"
                      className={inputCls}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddCategory}
                  disabled={catPending || !newCatKey.trim() || !newCatLabel.trim()}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Plus size={13} />
                  {catPending ? 'กำลังเพิ่ม...' : 'เพิ่มหมวดหมู่'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">ลบสินค้า</h3>
            <p className="text-xs text-slate-500 mb-5">
              ยืนยันการลบ <span className="font-semibold text-slate-700">{deleteTarget.brand} {deleteTarget.model}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">ยกเลิก</button>
              <button onClick={handleDelete} disabled={isPending} className="flex-1 px-4 py-2.5 text-xs font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-40">
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
