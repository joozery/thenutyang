'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart, type CartItem } from './cart-context';

type Props = {
  tire: Omit<CartItem, 'quantity'>;
  quantity?: number;
  className?: string;
  children?: React.ReactNode;
  // เพิ่มลงตะกร้าแล้วพาไปหน้าตะกร้าทันที — ใช้กับปุ่ม "จองเลย" ที่อยากให้เข้า flow ตะกร้าเดียวกัน ไม่ต้องมีฟอร์มแยก
  goToCart?: boolean;
};

export function AddToCartButton({ tire, quantity = 4, className, children, goToCart = false }: Props) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem(tire, quantity);
    if (goToCart) {
      router.push('/cart');
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children ?? (added ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />)}
    </button>
  );
}
