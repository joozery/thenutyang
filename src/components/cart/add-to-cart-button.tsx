'use client';

import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart, type CartItem } from './cart-context';

type Props = {
  tire: Omit<CartItem, 'quantity'>;
  quantity?: number;
  className?: string;
  children?: React.ReactNode;
};

export function AddToCartButton({ tire, quantity = 4, className, children }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem(tire, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children ?? (added ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />)}
    </button>
  );
}
