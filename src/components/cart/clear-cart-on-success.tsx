'use client';

import { useEffect } from 'react';
import { useCart } from './cart-context';

export function ClearCartOnSuccess({ shouldClear }: { shouldClear: boolean }) {
  const { clear } = useCart();

  useEffect(() => {
    if (shouldClear) clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldClear]);

  return null;
}
