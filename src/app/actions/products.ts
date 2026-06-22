'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { rimFromSize } from '@/lib/products';

type ProductInput = {
  brand: string;
  model: string;
  size: string;
  type: string;
  note: string;
  priceCash: number;
  priceCredit: number;
  priceInstallment: number;
  costPrice: number;
  oldPrice?: number;
  badge?: string;
  image?: string;
  category: 'touring' | 'sport' | 'eco' | 'suv' | 'allseason';
  stock: number;
  year: string;
  published?: boolean;
};

type Result = { ok: true } | { ok: false; error: string };

export async function createProduct(data: ProductInput): Promise<Result> {
  try {
    await connectDB();
    await Product.create({ ...data, rimSize: rimFromSize(data.size) });
    revalidatePath('/admin/products');
    revalidatePath('/tires');
    return { ok: true };
  } catch (e) {
    console.error('[createProduct]', e);
    return { ok: false, error: String(e) };
  }
}

export async function updateProduct(id: string, data: ProductInput): Promise<Result> {
  try {
    await connectDB();
    await Product.findByIdAndUpdate(id, { ...data, rimSize: rimFromSize(data.size) });
    revalidatePath('/admin/products');
    revalidatePath('/tires');
    revalidatePath(`/tires/${id}`);
    return { ok: true };
  } catch (e) {
    console.error('[updateProduct]', e);
    return { ok: false, error: String(e) };
  }
}

export async function deleteProduct(id: string): Promise<Result> {
  try {
    await connectDB();
    await Product.findByIdAndDelete(id);
    revalidatePath('/admin/products');
    revalidatePath('/tires');
    return { ok: true };
  } catch (e) {
    console.error('[deleteProduct]', e);
    return { ok: false, error: String(e) };
  }
}
