'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { createWarrantyClaim } from '@/app/actions/warranty-claims';
import type { ClaimItem } from '@/lib/warranty-claims';

const EMPTY_ITEM: ClaimItem = { productName: '', brand: '', size: '', quantity: 1, reason: '' };

export function NewWarrantyClaimClient() {
  const [items, setItems] = useState<ClaimItem[]>([{ ...EMPTY_ITEM }]);
  const [pending, startTransition] = useTransition();

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof ClaimItem, value: string | number) {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('items', JSON.stringify(items));
    startTransition(() => createWarrantyClaim(fd));
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/warranty-claims" className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={18} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">เปิดเคสเครมใหม่</h1>
          <p className="text-sm text-slate-500">บันทึกข้อมูลลูกค้าที่ต้องการเครมสินค้า</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        {/* Customer info */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">ข้อมูลลูกค้า</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อลูกค้า</label>
              <input
                name="customerName" placeholder="สมชาย ใจดี"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">เบอร์โทร</label>
              <input
                name="customerPhone" type="tel" placeholder="081-234-5678"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ทะเบียนรถ</label>
              <input
                name="licensePlate" placeholder="กข 1234 กรุงเทพมหานคร"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                วันที่เข้าเครม <span className="text-red-500">*</span>
              </label>
              <input
                name="claimDate" type="date" required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">รายการสินค้าที่เครม</h2>
          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-500">รายการที่ {i + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ชื่อสินค้า <span className="text-red-500">*</span>
                    </label>
                    <input
                      required value={it.productName}
                      onChange={(e) => updateItem(i, 'productName', e.target.value)}
                      placeholder="เช่น ยางรถยนต์ Bridgestone"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">แบรนด์</label>
                    <input
                      value={it.brand}
                      onChange={(e) => updateItem(i, 'brand', e.target.value)}
                      placeholder="Bridgestone"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ขนาด</label>
                    <input
                      value={it.size}
                      onChange={(e) => updateItem(i, 'size', e.target.value)}
                      placeholder="205/55R16"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">จำนวน</label>
                    <input
                      type="number" min={1} value={it.quantity}
                      onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">อาการ/เหตุผลที่เครม</label>
                    <input
                      value={it.reason}
                      onChange={(e) => updateItem(i, 'reason', e.target.value)}
                      placeholder="เช่น ยางแตก/บวม"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-sm text-green-700 font-bold px-3 py-2 border border-dashed border-green-300 rounded-xl hover:bg-green-50 transition-colors w-full justify-center"
            >
              <Plus size={14} /> เพิ่มรายการสินค้า
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
          <textarea
            name="customerNotes" rows={3} placeholder="รายละเอียดอื่นๆ จากลูกค้า..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : null}
            บันทึก — เปิดเคสเครม
          </button>
          <Link
            href="/admin/warranty-claims"
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
