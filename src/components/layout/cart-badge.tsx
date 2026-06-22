'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/cart/cart-context';

export function CartBadge() {
  const { items } = useCart();
  const count = items.length;

  return (
    <Link href="/cart" className="text-slate-700 hover:text-green-600 transition relative">
      <ShoppingCart className="w-6 h-6 md:w-5 md:h-5" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
