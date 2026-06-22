'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Edit2, CheckCircle, Image as ImageIcon, ExternalLink, Eye, EyeOff, Layout, UploadCloud } from 'lucide-react';
import { updateBanner } from '@/app/actions/banners';
import { uploadImage } from '@/app/actions/upload';
import type { BannerRow } from '@/lib/banners';

const SLOT_LABELS: Record<string, { label: string; desc: string }> = {
  main:   { label: 'แบนเนอร์หลัก (ซ้ายใหญ่)', desc: 'ซื้อ 3 แถม 1 หรือแคมเปญหลัก' },
  promo1: { label: 'โปรโมชั่น 1 (ขวาบน)',      desc: 'โปรผ่อน 0% หรืออื่นๆ' },
  promo2: { label: 'โปรโมชั่น 2 (ขวาล่าง)',    desc: 'บริการตั้งศูนย์ หรืออื่นๆ' },
};

export function BannersClient({ banners }: { banners: BannerRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [editSlot, setEditSlot] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<BannerRow>>({});
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  function openEdit(b: BannerRow) {
    setEditSlot(b.slot);
    setForm({ ...b });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await uploadImage(fd, 'banners');
      setForm(f => ({ ...f, bgImage: res.url }));
      flash('อัปโหลดรูปภาพสำเร็จ');
    } catch (err: any) {
      alert(err.message || 'อัปโหลดล้มเหลว');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleSave() {
    if (!editSlot || !form.title) return;
    startTransition(async () => {
      const res = await updateBanner(editSlot as any, {
        title: form.title!,
        subtitle: form.subtitle ?? '',
        buttonText: form.buttonText ?? '',
        buttonLink: form.buttonLink ?? '/',
        bgImage: form.bgImage ?? '',
        published: form.published ?? true,
      });
      if (res.ok) { setEditSlot(null); flash('บันทึกแบนเนอร์แล้ว'); router.refresh(); }
    });
  }

  function fmtDate(iso: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
          <Layout size={13} /> จัดการหน้าแรก
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">แบนเนอร์โปรโมชั่น</h1>
        <p className="text-sm text-slate-500 mt-1">แก้ไขข้อความและรูปภาพแบนเนอร์ที่แสดงในหน้าแรกของเว็บไซต์</p>
      </div>

      {/* Preview hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3 text-sm text-blue-700">
        <ExternalLink size={15} className="shrink-0" />
        <span>การเปลี่ยนแปลงจะมีผลทันทีบนหน้าเว็บไซต์ — <a href="/" target="_blank" className="font-bold underline">ดูหน้าแรก →</a></span>
      </div>

      {/* Banner Cards */}
      <div className="space-y-4">
        {banners.map(b => {
          const meta = SLOT_LABELS[b.slot];
          const isEditing = editSlot === b.slot;

          return (
            <div key={b.slot} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${isEditing ? 'border-green-300 shadow-green-100' : 'border-slate-100'}`}>
              {/* Card Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${b.slot === 'main' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {b.slot === 'main' ? 'M' : b.slot === 'promo1' ? 'P1' : 'P2'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{meta.label}</p>
                    <p className="text-xs text-slate-400">{meta.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${b.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {b.published ? <Eye size={11} /> : <EyeOff size={11} />}
                    {b.published ? 'แสดงอยู่' : 'ซ่อน'}
                  </span>
                  {!isEditing ? (
                    <button onClick={() => openEdit(b)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <Edit2 size={13} /> แก้ไข
                    </button>
                  ) : (
                    <button onClick={() => setEditSlot(null)} className="text-xs font-semibold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      ยกเลิก
                    </button>
                  )}
                </div>
              </div>

              {/* View Mode */}
              {!isEditing && (
                <div className="px-5 py-4 flex items-center gap-6">
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    {b.bgImage ? (
                      <img src={b.bgImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={20} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 text-lg leading-tight">{b.title}</p>
                    <p className="text-slate-500 text-sm mt-0.5">{b.subtitle}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-slate-400">ปุ่ม: <span className="font-semibold text-slate-600">{b.buttonText || '—'}</span></span>
                      <span className="text-xs text-slate-400">ลิงก์: <span className="font-semibold text-slate-600">{b.buttonLink}</span></span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 shrink-0">
                    อัปเดต:<br />{fmtDate(b.updatedAt)}
                  </div>
                </div>
              )}

              {/* Edit Mode */}
              {isEditing && (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">หัวข้อหลัก *</label>
                      <input
                        value={form.title ?? ''}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className={inputCls}
                        placeholder="เช่น ซื้อ 3 แถม 1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">หัวข้อรอง</label>
                      <input
                        value={form.subtitle ?? ''}
                        onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                        className={inputCls}
                        placeholder="เช่น เฉพาะรุ่นที่ร่วมรายการ"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">ข้อความปุ่ม</label>
                      <input
                        value={form.buttonText ?? ''}
                        onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))}
                        className={inputCls}
                        placeholder="เช่น ช้อปเลย"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">ลิงก์ปุ่ม</label>
                      <input
                        value={form.buttonLink ?? ''}
                        onChange={e => setForm(f => ({ ...f, buttonLink: e.target.value }))}
                        className={inputCls}
                        placeholder="/tires"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-600">รูปภาพพื้นหลัง</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleUpload}
                          className="hidden"
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                          <UploadCloud size={16} />
                          {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปใหม่'}
                        </button>
                        <input
                          value={form.bgImage ?? ''}
                          onChange={e => setForm(f => ({ ...f, bgImage: e.target.value }))}
                          className={`${inputCls} flex-1`}
                          placeholder="หรือวาง URL รูปภาพ"
                        />
                        {form.bgImage && (
                          <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <img src={form.bgImage} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setForm(f => ({ ...f, published: !f.published }))}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.published ? 'bg-green-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.published ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{form.published ? 'แสดงบนหน้าเว็บ' : 'ซ่อนจากหน้าเว็บ'}</span>
                    </label>

                    <button
                      onClick={handleSave}
                      disabled={isPending}
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-all shadow-sm shadow-green-200"
                    >
                      <Save size={14} /> {isPending ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors';
