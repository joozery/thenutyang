'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Wrench,
  Banknote, Tag, StickyNote, ChevronRight,
} from 'lucide-react';
import { createServiceItem, updateServiceItem, deleteServiceItem, type ServiceItemInput } from '@/app/actions/service-items';
import type { ServiceItemRow } from '@/lib/service-items';

const EMPTY_FORM: ServiceItemInput = { name: '', price: 0, cost: 0, unit: 'ครั้ง', note: '' };

const UNIT_PRESETS = ['ครั้ง', 'คัน', 'เส้น', 'ชั่วโมง', 'ชุด', 'งาน'];

const CARD_COLORS = [
  { gradient: 'from-green-50 to-emerald-50/80',   icon: 'bg-green-100 text-green-600',   price: 'text-green-700', border: 'border-green-100' },
  { gradient: 'from-blue-50 to-sky-50/80',        icon: 'bg-blue-100 text-blue-600',     price: 'text-blue-700',  border: 'border-blue-100'  },
  { gradient: 'from-violet-50 to-purple-50/80',   icon: 'bg-violet-100 text-violet-600', price: 'text-violet-700', border: 'border-violet-100' },
  { gradient: 'from-orange-50 to-amber-50/80',    icon: 'bg-orange-100 text-orange-600', price: 'text-orange-700', border: 'border-orange-100' },
  { gradient: 'from-rose-50 to-pink-50/80',       icon: 'bg-rose-100 text-rose-600',     price: 'text-rose-700',  border: 'border-rose-100'  },
  { gradient: 'from-teal-50 to-cyan-50/80',       icon: 'bg-teal-100 text-teal-600',     price: 'text-teal-700',  border: 'border-teal-100'  },
] as const;

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10 bg-white";

/* ── Side Panel (แทน modal) ──────────────────────────────────── */
function ServicePanel({
  initial, onClose, onSaved,
}: {
  initial: ServiceItemRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ServiceItemInput>(
    initial ? { name: initial.name, price: initial.price, cost: initial.cost, unit: initial.unit, note: initial.note } : EMPTY_FORM
  );
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof ServiceItemInput>(key: K, value: ServiceItemInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    setError('');
    startTransition(async () => {
      const result = initial ? await updateServiceItem(initial.id, form) : await createServiceItem(form);
      if (result.error) setError(result.error);
      else onSaved();
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-black text-slate-900">{initial ? 'แก้ไขบริการ' : 'เพิ่มบริการใหม่'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">บริการ/ค่าแรงที่เลือกใส่ในเอกสารได้</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* ชื่อบริการ */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
              <Wrench size={11} /> ชื่อบริการ <span className="text-green-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="เช่น ค่าแรงช่าง, ค่าตั้งศูนย์, ค่าถ่วงล้อ"
              className={inputCls}
              autoFocus
            />
          </div>

          {/* ราคา + ต้นทุน */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                <Banknote size={11} /> ราคาขาย (฿) <span className="text-green-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.price || ''}
                onChange={(e) => set('price', Number(e.target.value))}
                placeholder="0"
                className={inputCls + ' tabular-nums'}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                <Banknote size={11} /> ต้นทุน (฿)
              </label>
              <input
                type="number"
                min={0}
                value={form.cost || ''}
                onChange={(e) => set('cost', Number(e.target.value))}
                placeholder="0"
                className={inputCls + ' tabular-nums'}
              />
            </div>
          </div>

          {/* หน่วย */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
              <Tag size={11} /> หน่วย
            </label>
            <input
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
              placeholder="ครั้ง / เส้น / คัน"
              className={inputCls}
            />
            {/* Unit presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {UNIT_PRESETS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => set('unit', u)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors ${
                    form.unit === u
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-green-300 hover:text-green-700'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {form.name && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ตัวอย่าง</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">{form.name}</p>
                <p className="text-base font-black text-green-700">
                  ฿{(form.price || 0).toLocaleString()} <span className="text-xs font-medium text-slate-400">/ {form.unit || 'ครั้ง'}</span>
                </p>
              </div>
              {(form.cost > 0 || form.price > 0) && (
                <div className="flex items-center gap-3 pt-1 border-t border-slate-200 text-xs">
                  <span className="text-slate-500">ต้นทุน ฿{(form.cost || 0).toLocaleString()}</span>
                  <span className="text-slate-300">·</span>
                  <span className={`font-bold ${(form.price - form.cost) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    กำไร ฿{(form.price - (form.cost || 0)).toLocaleString()}
                  </span>
                  {form.price > 0 && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className={`font-bold ${(form.price - form.cost) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {(((form.price - (form.cost || 0)) / form.price) * 100).toFixed(1)}%
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* หมายเหตุ */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
              <StickyNote size={11} /> หมายเหตุ
            </label>
            <textarea
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              rows={3}
              placeholder="รายละเอียดเพิ่มเติม..."
              className={inputCls + ' resize-none'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'กำลังบันทึก...' : initial ? 'บันทึกการแก้ไข' : 'เพิ่มบริการ'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export function ServiceItemsClient({ items: initialItems }: { items: ServiceItemRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [panel, setPanel] = useState<'add' | ServiceItemRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceItemRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    setPanel(null);
    startTransition(() => { window.location.reload(); });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteServiceItem(deleteTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/documents/settings"
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">รายการบริการ / ค่าแรง</h1>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {items.length} รายการ
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              เช่น ค่าแรงช่าง · ค่าตั้งศูนย์ · ค่าถ่วงล้อ — เลือกใส่ในบิลจากหน้าสร้างเอกสาร
            </p>
          </div>
        </div>
        <button
          onClick={() => setPanel('add')}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm shadow-green-200"
        >
          <Plus size={15} /> เพิ่มบริการ
        </button>
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/admin/documents" className="hover:text-slate-600">เอกสาร</Link>
        <ChevronRight size={12} />
        <Link href="/admin/documents/settings" className="hover:text-slate-600">ตั้งค่า</Link>
        <ChevronRight size={12} />
        <span className="text-slate-600 font-medium">รายการบริการ</span>
      </nav>

      {/* Card Grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Wrench size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-600 font-bold text-lg">ยังไม่มีรายการบริการ</p>
          <p className="text-slate-400 text-sm mt-1.5 mb-6">เพิ่มรายการบริการ เช่น ค่าแรงช่าง ค่าตั้งศูนย์</p>
          <button
            onClick={() => setPanel('add')}
            className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
          >
            <Plus size={16} /> เพิ่มบริการแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item, idx) => {
            const color = CARD_COLORS[idx % CARD_COLORS.length];
            return (
              <div
                key={item.id}
                className={`group relative bg-gradient-to-br ${color.gradient} border ${color.border} rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
              >
                {/* Top row: icon + name */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${color.icon} flex items-center justify-center shrink-0`}>
                    <Wrench size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm leading-snug">{item.name}</p>
                    {item.note && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.note}</p>
                    )}
                  </div>
                </div>

                {/* Price + Profit */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black ${color.price}`}>
                      ฿{item.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ {item.unit}</span>
                  </div>
                  {item.cost > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400">ต้นทุน ฿{item.cost.toLocaleString()}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-bold text-emerald-600">
                        กำไร ฿{(item.price - item.cost).toLocaleString()}
                        {item.price > 0 && ` (${(((item.price - item.cost) / item.price) * 100).toFixed(0)}%)`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions — always visible on mobile, hover on desktop */}
                <div className="flex items-center gap-2 pt-1 border-t border-black/5">
                  <button
                    onClick={() => setPanel(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white/70 transition-colors"
                  >
                    <Pencil size={12} /> แก้ไข
                  </button>
                  <div className="w-px h-4 bg-black/10" />
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} /> ลบ
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add card */}
          <button
            onClick={() => setPanel('add')}
            className="group border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 min-h-[140px] hover:border-green-300 hover:bg-green-50/30 transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
              <Plus size={18} className="text-slate-400 group-hover:text-green-600 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-slate-400 group-hover:text-green-700 transition-colors">
              เพิ่มบริการใหม่
            </p>
          </button>
        </div>
      )}

      {/* Side Panel */}
      {panel && (
        <ServicePanel
          initial={panel === 'add' ? null : panel}
          onClose={() => setPanel(null)}
          onSaved={refresh}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-black text-slate-900 text-center mb-1">ลบรายการบริการ?</h3>
            <p className="text-sm text-slate-500 text-center mb-1">
              <span className="font-semibold text-slate-700">{deleteTarget.name}</span>
            </p>
            <p className="text-xs text-slate-400 text-center mb-6">การลบไม่กระทบเอกสารที่เคยออกไปแล้ว</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'กำลังลบ...' : 'ลบออก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
