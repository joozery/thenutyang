'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Brand } from '@/models/Brand';

export type BrandRow = { id: string; name: string; logo: string };

function normalize(doc: Record<string, unknown>): BrandRow {
  return { id: String(doc._id), name: doc.name as string, logo: (doc.logo as string) ?? '' };
}

export async function getBrands(): Promise<BrandRow[]> {
  await connectDB();
  const docs = await Brand.find({}).sort({ name: 1 }).lean();
  return docs.map(d => normalize(d as Record<string, unknown>));
}

export async function createBrand(_: unknown, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const name = (formData.get('name') as string ?? '').trim().toUpperCase();
  const logo  = (formData.get('logo') as string ?? '').trim();
  if (!name) return { error: 'กรุณากรอกชื่อแบรนด์' };
  try {
    await connectDB();
    const exists = await Brand.findOne({ name });
    if (exists) return { error: `แบรนด์ "${name}" มีอยู่แล้ว` };
    await Brand.create({ name, logo });
    revalidatePath('/admin/brands');
    return { ok: true };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function updateBrand(id: string, name: string, logo: string): Promise<{ error?: string; ok?: boolean }> {
  name = name.trim().toUpperCase();
  if (!name) return { error: 'กรุณากรอกชื่อแบรนด์' };
  try {
    await connectDB();
    await Brand.findByIdAndUpdate(id, { name, logo });
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
