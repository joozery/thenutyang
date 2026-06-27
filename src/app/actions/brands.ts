'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Brand } from '@/models/Brand';

export type BrandRow = { id: string; name: string; logo: string; productType: string };

function normalize(doc: Record<string, unknown>): BrandRow {
  return {
    id: String(doc._id),
    name: doc.name as string,
    logo: (doc.logo as string) ?? '',
    productType: (doc.productType as string) ?? 'tires',
  };
}

export async function getBrands(productType?: string): Promise<BrandRow[]> {
  await connectDB();
  const query = productType ? { productType } : {};
  const docs = await Brand.find(query).sort({ name: 1 }).lean();
  return docs.map(d => normalize(d as Record<string, unknown>));
}

export async function createBrand(_: unknown, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const name        = (formData.get('name') as string ?? '').trim().toUpperCase();
  const logo        = (formData.get('logo') as string ?? '').trim();
  const productType = (formData.get('productType') as string ?? 'tires').trim();
  if (!name) return { error: 'กรุณากรอกชื่อแบรนด์' };
  try {
    await connectDB();
    const exists = await Brand.findOne({ name, productType });
    if (exists) return { error: `แบรนด์ "${name}" มีอยู่แล้วในหมวดนี้` };
    await Brand.create({ name, logo, productType });
    revalidatePath('/admin/brands');
    return { ok: true };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function updateBrand(id: string, name: string, logo: string, productType?: string): Promise<{ error?: string; ok?: boolean }> {
  name = name.trim().toUpperCase();
  if (!name) return { error: 'กรุณากรอกชื่อแบรนด์' };
  try {
    await connectDB();
    await Brand.findByIdAndUpdate(id, { name, logo, ...(productType ? { productType } : {}) });
    revalidatePath('/admin/brands');
    return { ok: true };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function deleteBrand(id: string): Promise<{ error?: string; ok?: boolean }> {
  try {
    await connectDB();
    await Brand.findByIdAndDelete(id);
    revalidatePath('/admin/brands');
    return { ok: true };
  } catch (e) {
    return { error: String(e) };
  }
}
