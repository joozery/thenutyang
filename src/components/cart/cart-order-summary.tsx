'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CustomerSession } from '@/lib/customer-session';
import { useCart } from './cart-context';

export function CartOrderSummary({
  formId,
  customer,
  error,
  isPending,
}: {
  formId: string;
  customer?: CustomerSession | null;
  error?: string;
  isPending: boolean;
}) {
  const { items, removeItem, setQuantity, totalPrice } = useCart();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
      <h2 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-100">สรุปคำสั่งจอง</h2>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1 -mr-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <img src={item.image} alt={item.model} className="w-12 h-12 object-contain shrink-0 bg-slate-50 rounded-lg" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-xs truncate">{item.brand} {item.model}</p>
              <p className="text-[11px] text-slate-400">{item.size}</p>
              <p className="text-xs font-black text-green-600 mt-0.5">฿{item.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg shrink-0">
              <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)}
                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-green-600 transition">
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-slate-800 w-5 text-center">{item.quantity}</span>
              <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)}
                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-green-600 transition">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <button type="button" onClick={() => removeItem(item.id)}
              className="text-slate-300 hover:text-red-500 transition p-1 shrink-0" aria-label="ลบ">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-sm font-bold text-slate-700">ราคารวม</span>
        <span className="text-xl font-black text-green-600">฿{totalPrice.toLocaleString()}</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        form={formId}
        disabled={isPending || items.length === 0}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-green-200 text-base"
      >
        {isPending
          ? 'กำลังส่งข้อมูล...'
          : customer
            ? `ยืนยันการจองทั้งหมด (${items.length} รายการ) — รับใบเสนอราคาทาง LINE ทันที`
            : `ยืนยันการจองทั้งหมด (${items.length} รายการ)`}
      </button>
    </div>
  );
}
