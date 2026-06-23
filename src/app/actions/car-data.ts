'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { CarBrand } from '@/models/CarBrand';
import { CarModel } from '@/models/CarModel';

export type CarBrandRow = { id: string; name: string };
export type CarModelRow = { id: string; name: string; brandId: string };

export async function getCarBrands(): Promise<CarBrandRow[]> {
  await connectDB();
  const docs = await CarBrand.find({}).sort({ name: 1 }).lean();
  return docs.map((d) => ({ id: String(d._id), name: d.name as string }));
}

export async function getCarModels(): Promise<CarModelRow[]> {
  await connectDB();
  const docs = await CarModel.find({}).sort({ name: 1 }).lean();
  return docs.map((d) => ({ id: String(d._id), name: d.name as string, brandId: String(d.brandId) }));
}

export async function createCarBrand(_: unknown, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const name = (formData.get('name') as string ?? '').trim();
  if (!name) return { error: 'กรุณากรอกชื่อยี่ห้อรถ' };
  try {
    await connectDB();
    const exists = await CarBrand.findOne({ name });
    if (exists) return { error: `ยี่ห้อ "${name}" มีอยู่แล้ว` };
    await CarBrand.create({ name });
    revalidatePath('/admin/car-data');
    return { ok: true };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function deleteCarBrand(id: string): Promise<{ error?: string; ok?: boolean }> {
  try {
    await connectDB();
    await CarModel.deleteMany({ brandId: id });
    await CarBrand.findByIdAndDelete(id);
    revalidatePath('/admin/car-data');
    return { ok: true };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function createCarModel(brandId: string, name: string): Promise<{ error?: string; ok?: boolean }> {
  name = name.trim();
  if (!brandId) return { error: 'กรุณาเลือกยี่ห้อรถ' };
  if (!name) return { error: 'กรุณากรอกชื่อรุ่นรถ' };
  try {
    await connectDB();
    const exists = await CarModel.findOne({ brandId, name });
    if (exists) return { error: `รุ่น "${name}" มีอยู่แล้วในยี่ห้อนี้` };
    await CarModel.create({ brandId, name });
    revalidatePath('/admin/car-data');
    return { ok: true };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function deleteCarModel(id: string): Promise<{ error?: string; ok?: boolean }> {
  try {
    await connectDB();
    await CarModel.findByIdAndDelete(id);
    revalidatePath('/admin/car-data');
    return { ok: true };
  } catch (e) {
    return { error: String(e) };
  }
}
