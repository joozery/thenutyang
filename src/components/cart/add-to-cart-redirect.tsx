'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCart, type CartItem } from './cart-context';

// ใช้กับ deep link เก่า /booking?tireId=X (เช่นจาก LINE chatbot carousel) — เพิ่มลงตะกร้าแล้วพาไปหน้าตะกร้าทันที
// ให้เข้า flow เดียวกับปุ่ม "จองเลย" ทั่วเว็บ ไม่ต้องมีฟอร์มจองแยกอีกชุด
export function AddToCartRedirect({ tire }: { tire: Omit<CartItem, 'quantity'> | undefined }) {
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (tire) addItem(tire, 4);
    router.replace('/cart');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin" />
      <p className="text-sm">กำลังพาไปหน้าตะกร้า...</p>
    </div>
  );
}
