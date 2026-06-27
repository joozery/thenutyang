'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, Upload, Edit2, Tag, Image as ImageIcon, CircleDot, Disc3, Wrench, Disc, Zap, Droplets } from 'lucide-react';
import { createBrand, updateBrand, deleteBrand } from '@/app/actions/brands';
import { uploadImage } from '@/app/actions/upload';
import type { BrandRow } from '@/app/actions/brands';
import type { LucideIcon } from 'lucide-react';

const PRODUCT_TABS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'tires',       label: 'ยาง',           icon: CircleDot },
  { value: 'wheels',      label: 'ล้อแม็ก',       icon: Disc3 },
  { value: 'accessories', label: 'ของแต่ง',       icon: Wrench },
  { value: 'brakes',      label: 'เบรค',           icon: Disc },
  { value: 'shock',       label: 'โช๊ค',           icon: Zap },
  { value: 'oil',         label: 'น้ำมันเครื่อง', icon: Droplets },
];

export function BrandsClient({
  initialBrands,
  activeType,
}: {
  initialBrands: BrandRow[];
  activeType: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<BrandRow | null>(null);
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BrandRow | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const activeTab = PRODUCT_TABS.find(t => t.value === activeType) ?? PRODUCT_TABS[0];

  function openAdd() { setName(''); setLogo(''); setError(''); setModal('add'); }
  function openEdit(b: BrandRow) { setEditTarget(b); setName(b.name); setLogo(b.logo); setError(''); setModal('edit'); }
  function closeModal() { setModal(null); setEditTarget(null); setError(''); }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { url } = await uploadImage(fd, 'brands');
      setLogo(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ');
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleSave() {
    if (!name.trim()) { setError('กรุณากรอกชื่อแบรนด์'); return; }
    startTransition(async () => {
      const res = modal === 'add'
        ? await createBrand(null, (() => {
            const fd = new FormData();
            fd.set('name', name);
            fd.set('logo', logo);
            fd.set('productType', activeType);
            return fd;
          })())
        : await updateBrand(editTarget!.id, name, logo);
      if (res.error) { setError(res.error); return; }
      closeModal();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteBrand(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">จัดการแบรนด์</h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            แบรนด์ในหมวด <span className="font-bold text-slate-700">{activeTab.label}</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
            {initialBrands.length} รายการ
          </p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
          <Plus size={16} /> เพิ่มแบรนด์ {activeTab.label}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {PRODUCT_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = tab.value === activeType;
            return (
              <button
                key={tab.value}
                onClick={() => router.push(`/admin/brands?type=${tab.value}`)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-green-500 text-green-700 bg-green-50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-3 shadow-sm">
        <ImageIcon size={16} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-sm text-slate-500 leading-relaxed">
          แนะนำให้ใช้ภาพโลโก้พื้นหลังโปร่งใส (PNG, SVG) ตัดขอบชิดตัวอักษร เพื่อความสวยงามเมื่อแสดงบนเว็บ
        </p>
      </div>

      {/* Brand Grid */}
      {initialBrands.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-24 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Tag size={24} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">ยังไม่มีแบรนด์ใน{activeTab.label}</h3>
          <p className="text-slate-500 mt-2 text-sm text-center max-w-sm">คลิกปุ่ม "เพิ่มแบรนด์" เพื่อเพิ่มแบรนด์ในหมวดนี้</p>
          <button onClick={openAdd} className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
            เพิ่มแบรนด์ {activeTab.label}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {initialBrands.map(brand => (
            <div key={brand.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-4 hover:shadow-xl hover:border-green-300 hover:-translate-y-1 transition-all group relative">
              <div className="w-full aspect-video flex items-center justify-center rounded-xl overflow-hidden relative">
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                    <span className="text-3xl font-black text-slate-300 tracking-tighter">{brand.name.slice(0, 2)}</span>
                  </div>
                )}
              </div>
              <div className="w-full text-center">
                <p className="text-sm font-black text-slate-800 truncate px-2">{brand.name}</p>
              </div>
              <div className="absolute -top-3 -right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                <button onClick={() => openEdit(brand)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 shadow-md text-white hover:bg-slate-700 transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => setDeleteTarget(brand)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  {modal === 'add' ? <Plus size={18} className="text-green-600" /> : <Edit2 size={18} className="text-slate-600" />}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{modal === 'add' ? 'เพิ่มแบรนด์ใหม่' : 'แก้ไขแบรนด์'}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">หมวด: <span className="font-bold text-slate-600">{activeTab.label}</span></p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-200/50 text-slate-400"><X size={18} /></button>
            </div>

            <div className="p-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3">
                  <X size={14} className="text-red-500 mt-0.5" />
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อแบรนด์ <span className="text-red-500">*</span></label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all font-bold tracking-wider placeholder:font-medium placeholder:text-slate-300 uppercase"
                  placeholder="เช่น MICHELIN, BRIDGESTONE"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ภาพโลโก้</label>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-16 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative group">
                      {logo ? (
                        <>
                          <img src={logo} alt="preview" className="w-full h-full object-contain p-2" />
                          <button onClick={() => setLogo('')} type="button" className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-300 text-sm font-black tracking-tighter">{name.slice(0, 2) || 'LOGO'}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleUpload} />
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={isUploading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold border border-slate-200 rounded-xl bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-50 shadow-sm active:scale-95">
                        <Upload size={16} className="text-slate-400" />
                        {isUploading ? 'กำลังอัปโหลด...' : 'เลือกไฟล์รูปภาพ'}
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center"><span className="bg-slate-50 px-2 text-xs text-slate-400 font-medium">หรือใส่ URL รูปภาพ</span></div>
                  </div>
                  <input
                    value={logo}
                    onChange={e => setLogo(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 text-slate-600 placeholder:text-slate-300"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm">ยกเลิก</button>
              <button onClick={handleSave} disabled={!name.trim() || isPending || isUploading}
                className="px-6 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
                {isPending ? 'กำลังบันทึก...' : modal === 'add' ? `เพิ่มแบรนด์${activeTab.label}` : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 border-4 border-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-5 -mt-12">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">ยืนยันการลบแบรนด์</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              คุณต้องการลบแบรนด์ <br/>
              <span className="inline-block mt-2 font-black text-lg text-slate-800 bg-slate-100 px-4 py-1.5 rounded-xl">{deleteTarget.name}</span> <br/>
              ออกจากหมวด <span className="font-bold text-slate-700">{activeTab.label}</span> ใช่หรือไม่?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200">ยกเลิก</button>
              <button onClick={handleDelete} disabled={isPending} className="flex-1 px-4 py-3 text-sm font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-md shadow-red-500/20 disabled:opacity-40">
                {isPending ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
