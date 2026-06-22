'use client';

import { useSyncExternalStore } from 'react';

export type CartItem = {
  id: string;
  brand: string;
  model: string;
  size: string;
  image: string;
  price: number;
  quantity: number;
};

const STORAGE_KEY = 'thenutyang_cart';
const listeners = new Set<() => void>();

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

let items: CartItem[] = typeof window !== 'undefined' ? loadFromStorage() : [];

function setItems(next: CartItem[]) {
  items = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota/serialization errors
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return items;
}

const EMPTY_ARRAY: CartItem[] = [];

function getServerSnapshot(): CartItem[] {
  return EMPTY_ARRAY;
}

function addItem(item: Omit<CartItem, 'quantity'>, quantity = 4) {
  const existing = items.find((i) => i.id === item.id);
  if (existing) {
    setItems(items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i)));
  } else {
    setItems([...items, { ...item, quantity }]);
  }
}

function removeItem(id: string) {
  setItems(items.filter((i) => i.id !== id));
}

function setQuantity(id: string, quantity: number) {
  setItems(items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)));
}

function clear() {
  setItems([]);
}

export function useCart() {
  const cartItems = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const totalPrice = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { items: cartItems, addItem, removeItem, setQuantity, clear, totalPrice };
}
