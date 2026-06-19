'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, Upload, Edit2, Tag } from 'lucide-react';
import { createBrand, updateBrand, deleteBrand } from '@/app/actions/brands';
import { uploadImage } from '@/app/actions/upload';
import type { BrandRow } from '@/app/actions/brands';

export function BrandsClient({ initialBrands }: { initialBrands: BrandRow[] }) {
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
        ? await createBrand(null, (() => { const fd = new FormData(); fd.set('name', name); fd.set('logo', logo); return fd; })())
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
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">จัดการแบรนด์</h1>
          <p className="text-xs text-slate-400 mt-0.5">โลโก้แบรนด์จะใช้ในหน้าเลือกสินค้าและฟิลเพิ่มสินค้า</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition-colors shadow-sm">
          <Plus size={13} /> เพิ่มแบรนด์
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3 w-fit">
        <div className="bg-slate-100 p-2 rounded-lg"><Tag size={16} className="text-slate-600" /></div>
        <div>
          <p className="text-[10px] text-slate-400 font-medium">แบรนด์ทั้งหมด</p>
          <p className="text-lg font-bold text-slate-900 leading-none mt-0.5">
            {initialBrands.length} <span className="text-xs font-normal text-slate-400">แบรนด์</span>
          </p>
        </div>
      </div>

      {/* Brand Grid */}
      {initialBrands.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-20 text-center">
          <p className="text-slate-400 text-sm">ยังไม่มีแบรนด์ — กด "เพิ่มแบรนด์" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {initialBrands.map(brand => (
            <div key={brand.id}
              className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-3 hover:shadow-md transition-shadow group relative">
              {/* Logo */}
              <div className="w-full h-16 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain p-2" />
                ) : (
                  <span className="text-lg font-black text-slate-300">{brand.name.slice(0, 2)}</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-700 text-center">{brand.name}</p>

              {/* Actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(brand)}
                  className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-colors">
                  <Edit2 size={11} />
                </button>
                <button onClick={() => setDeleteTarget(brand)}
                  className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 transition-colors">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">{modal === 'add' ? 'เพิ่มแบรนด์ใหม่' : 'แก้ไขแบรนด์'}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
            </div>

            <div className="p-6 space-y-5">
              {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              {/* ชื่อแบรนด์ */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">ชื่อแบรนด์ *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-colors font-bold tracking-wider"
                  placeholder="MICHELIN"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">โลโก้แบรนด์</label>
                <div className="flex items-center gap-3">
                  {/* Preview */}
                  <div className="w-20 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                    {logo ? (
                      <img src={logo} alt="preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-slate-300 text-xs font-bold">{name.slice(0, 2) || 'LOGO'}</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleUpload} />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={isUploading}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 transition-colors">
                      <Upload size={12} />
                      {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลด Logo'}
                    </button>
                    <input
                      value={logo}
                      onChange={e => setLogo(e.target.value)}
                      className="w-full px-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-500 placeholder:text-slate-300"
                      placeholder="หรือวาง URL รูปภาพ"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">ยกเลิก</button>
              <button onClick={handleSave} disabled={!name.trim() || isPending || isUploading}
                className="px-5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {isPending ? 'กำลังบันทึก...' : modal === 'add' ? 'เพิ่มแบรนด์' : 'บันทึก'}
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
            <h3 className="font-bold text-slate-900 mb-1">ลบแบรนด์</h3>
            <p className="text-xs text-slate-500 mb-5">
              ยืนยันการลบ <span className="font-bold text-slate-800">{deleteTarget.name}</span>?
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
