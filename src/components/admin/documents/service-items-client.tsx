'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, X, Wrench } from 'lucide-react';
import { createServiceItem, updateServiceItem, deleteServiceItem, type ServiceItemInput } from '@/app/actions/service-items';
import type { ServiceItemRow } from '@/lib/service-items';

const EMPTY_FORM: ServiceItemInput = { name: '', price: 0, unit: 'ครั้ง', note: '' };
const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10";

function ServiceItemModal({
  initial, onClose, onSaved,
}: {
  initial: ServiceItemRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ServiceItemInput>(
    initial ? { name: initial.name, price: initial.price, unit: initial.unit, note: initial.note } : EMPTY_FORM
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{initial ? 'แก้ไขบริการ' : 'เพิ่มบริการใหม่'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">ชื่อบริการ <span className="text-green-500">*</span></label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="เช่น ค่าแรงช่าง, ค่าตั้งศูนย์" className={inputCls} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">ราคา (฿) <span className="text-green-500">*</span></label>
              <input type="number" min={0} value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">หน่วย</label>
              <input value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="ครั้ง / เส้น / ชม." className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">หมายเหตุ</label>
            <textarea value={form.note} onChange={(e) => set('note', e.target.value)} rows={2} placeholder="หมายเหตุเพิ่มเติม" className={inputCls + ' resize-none'} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">ยกเลิก</button>
          <button onClick={handleSubmit} disabled={isPending} className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50">
            {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ServiceItemsClient({ items: initialItems }: { items: ServiceItemRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [modal, setModal] = useState<'add' | ServiceItemRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceItemRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    setModal(null);
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
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/documents/settings" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">รายการบริการ / ค่าแรง</h1>
            <p className="text-xs text-slate-400 mt-0.5">เช่น ค่าแรงช่าง ค่าตั้งศูนย์ ค่าถ่วงล้อ — เลือกใส่ในบิลได้จากหน้าสร้างเอกสาร</p>
          </div>
        </div>
        <button onClick={() => setModal('add')} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700">
          <Plus size={15} /> เพิ่มบริการ
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <Wrench size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">ยังไม่มีรายการบริการ</p>
            <p className="text-slate-400 text-sm mt-1">กด &quot;เพิ่มบริการ&quot; เพื่อเริ่มสร้างรายการ</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-400 font-semibold border-b border-slate-100">
                <th className="text-left px-5 py-3">ชื่อบริการ</th>
                <th className="text-right px-3 py-3">ราคา</th>
                <th className="text-left px-3 py-3">หน่วย</th>
                <th className="text-center px-3 py-3 w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    {item.note && <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-slate-700 tabular-nums">฿{item.price.toLocaleString()}</td>
                  <td className="px-3 py-3 text-slate-500">{item.unit}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => setModal(item)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <ServiceItemModal
          initial={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-900 mb-1.5">ลบรายการบริการนี้?</h3>
            <p className="text-sm text-slate-500 mb-5">{deleteTarget.name} — การลบไม่กระทบเอกสารที่เคยออกไปแล้ว</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">ยกเลิก</button>
              <button onClick={handleDelete} disabled={isPending} className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50">ลบ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
