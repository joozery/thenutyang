'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import type { CustomerSession } from '@/lib/customer-session';
import type { CustomerProfile } from '@/lib/customer-profile';
import { useCart } from './cart-context';
import { CartCheckoutForm } from './cart-checkout-form';

export function CartPageClient({
  customer,
  profile,
}: {
  customer?: CustomerSession | null;
  profile?: CustomerProfile | null;
}) {
  const { items, removeItem, setQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-20 text-center">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">ยังไม่มีสินค้าในตะกร้า</h1>
        <p className="text-slate-500 text-sm mb-6">เลือกยางที่ต้องการแล้วกด &quot;เพิ่มลงตะกร้า&quot; ได้เลยค่ะ</p>
        <Link href="/tires" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          ดูยางรถยนต์ทั้งหมด
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-3xl">
      <h1 className="text-2xl font-black text-slate-900 mb-6">ตะกร้าของคุณ ({items.length} รายการ)</h1>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4">
            <img src={item.image} alt={item.model} className="w-16 h-16 object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{item.brand} {item.model}</p>
              <p className="text-xs text-slate-400">{item.size}</p>
              <p className="text-sm font-black text-green-600 mt-1">฿{item.price.toLocaleString()}</p>
            </div>

            <div className="flex items-center gap-2 border border-slate-200 rounded-lg">
              <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)}
                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-green-600 transition">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-slate-800 w-6 text-center">{item.quantity}</span>
              <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)}
                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-green-600 transition">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button type="button" onClick={() => removeItem(item.id)}
              className="text-slate-300 hover:text-red-500 transition p-1 shrink-0" aria-label="ลบ">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <div className="flex items-center justify-between p-4 bg-slate-50">
          <span className="text-sm font-bold text-slate-700">ราคารวม</span>
          <span className="text-xl font-black text-green-600">฿{totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <CartCheckoutForm customer={customer} profile={profile} />
    </div>
  );
}
