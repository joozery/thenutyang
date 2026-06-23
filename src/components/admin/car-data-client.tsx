'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, Car, Tag } from 'lucide-react';
import { createCarBrand, deleteCarBrand, createCarModel, deleteCarModel } from '@/app/actions/car-data';
import type { CarBrandRow, CarModelRow } from '@/app/actions/car-data';

export function CarDataClient({
  initialBrands,
  initialModels,
}: {
  initialBrands: CarBrandRow[];
  initialModels: CarModelRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [addBrandOpen, setAddBrandOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [deleteBrandTarget, setDeleteBrandTarget] = useState<CarBrandRow | null>(null);

  const [selectedBrandId, setSelectedBrandId] = useState(initialBrands[0]?.id ?? '');
  const [newModelName, setNewModelName] = useState('');
  const [deleteModelTarget, setDeleteModelTarget] = useState<CarModelRow | null>(null);

  const modelsForSelectedBrand = initialModels.filter((m) => m.brandId === selectedBrandId);

  function handleAddBrand() {
    if (!newBrandName.trim()) { setError('กรุณากรอกชื่อยี่ห้อรถ'); return; }
    startTransition(async () => {
      const fd = new FormData();
      fd.set('name', newBrandName);
      const res = await createCarBrand(null, fd);
      if (res.error) { setError(res.error); return; }
      setAddBrandOpen(false);
      setNewBrandName('');
      setError('');
      router.refresh();
    });
  }

  function handleDeleteBrand() {
    if (!deleteBrandTarget) return;
    startTransition(async () => {
      await deleteCarBrand(deleteBrandTarget.id);
      if (selectedBrandId === deleteBrandTarget.id) setSelectedBrandId('');
      setDeleteBrandTarget(null);
      router.refresh();
    });
  }

  function handleAddModel() {
    if (!selectedBrandId) { setError('กรุณาเลือกยี่ห้อรถก่อน'); return; }
    if (!newModelName.trim()) { setError('กรุณากรอกชื่อรุ่นรถ'); return; }
    startTransition(async () => {
      const res = await createCarModel(selectedBrandId, newModelName);
      if (res.error) { setError(res.error); return; }
      setNewModelName('');
      setError('');
      router.refresh();
    });
  }

  function handleDeleteModel() {
    if (!deleteModelTarget) return;
    startTransition(async () => {
      await deleteCarModel(deleteModelTarget.id);
      setDeleteModelTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">ยี่ห้อ/รุ่นรถ</h1>
        <p className="text-slate-500 mt-2">จัดการรายการยี่ห้อและรุ่นรถ สำหรับให้ลูกค้าค้นหาและเลือกตอนกรอกฟอร์มจอง</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ยี่ห้อรถ */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Tag size={16} className="text-green-600" /> ยี่ห้อรถ
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{initialBrands.length}</span>
            </h2>
            <button onClick={() => { setAddBrandOpen(true); setError(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors">
              <Plus size={14} /> เพิ่มยี่ห้อ
            </button>
          </div>

          {initialBrands.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">ยังไม่มียี่ห้อรถ</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[28rem] overflow-y-auto">
              {initialBrands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBrandId(b.id)}
                  className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors group ${selectedBrandId === b.id ? 'bg-green-50' : 'hover:bg-slate-50'}`}
                >
                  <span className={`text-sm font-bold ${selectedBrandId === b.id ? 'text-green-700' : 'text-slate-700'}`}>{b.name}</span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-400">{initialModels.filter((m) => m.brandId === b.id).length} รุ่น</span>
                    <Trash2
                      size={14}
                      onClick={(e) => { e.stopPropagation(); setDeleteBrandTarget(b); }}
                      className="text-slate-300 group-hover:text-red-500 transition-colors"
                    />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* รุ่นรถ */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Car size={16} className="text-green-600" /> รุ่นรถ
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{modelsForSelectedBrand.length}</span>
            </h2>
            <div className="flex gap-2">
              <select
                value={selectedBrandId}
                onChange={(e) => { setSelectedBrandId(e.target.value); setError(''); }}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-green-400"
              >
                <option value="">— เลือกยี่ห้อ —</option>
                {initialBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="ชื่อรุ่น เช่น Vios"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-400"
              />
              <button onClick={handleAddModel} disabled={isPending}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-40 transition-colors shrink-0">
                <Plus size={14} />
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>

          {!selectedBrandId ? (
            <div className="py-16 text-center text-sm text-slate-400">เลือกยี่ห้อรถทางซ้ายเพื่อดู/เพิ่มรุ่น</div>
          ) : modelsForSelectedBrand.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">ยังไม่มีรุ่นรถในยี่ห้อนี้</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[24rem] overflow-y-auto">
              {modelsForSelectedBrand.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3 group hover:bg-slate-50">
                  <span className="text-sm font-bold text-slate-700">{m.name}</span>
                  <button onClick={() => setDeleteModelTarget(m)} className="text-slate-300 group-hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add brand modal */}
      {addBrandOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setAddBrandOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">เพิ่มยี่ห้อรถ</h2>
              <button onClick={() => setAddBrandOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
            <input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="เช่น Toyota"
              autoFocus
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setAddBrandOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">ยกเลิก</button>
              <button onClick={handleAddBrand} disabled={isPending} className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-40">
                {isPending ? 'กำลังบันทึก...' : 'เพิ่ม'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete brand confirm */}
      {deleteBrandTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteBrandTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-black text-slate-900 mb-2">ลบยี่ห้อ &quot;{deleteBrandTarget.name}&quot;?</h3>
            <p className="text-sm text-slate-500 mb-6">รุ่นรถทั้งหมดในยี่ห้อนี้จะถูกลบไปด้วย การกระทำนี้ย้อนกลับไม่ได้</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteBrandTarget(null)} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200">ยกเลิก</button>
              <button onClick={handleDeleteBrand} disabled={isPending} className="flex-1 px-4 py-2.5 text-sm font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-40">
                {isPending ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete model confirm */}
      {deleteModelTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteModelTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-black text-slate-900 mb-2">ลบรุ่น &quot;{deleteModelTarget.name}&quot;?</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteModelTarget(null)} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200">ยกเลิก</button>
              <button onClick={handleDeleteModel} disabled={isPending} className="flex-1 px-4 py-2.5 text-sm font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-40">
                {isPending ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
