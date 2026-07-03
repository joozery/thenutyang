'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { ProductTypeConfig } from '@/models/ProductTypeConfig';

export type ProductTypeRow = {
  id: string; key: string; label: string; icon: string; unit: string; order: number;
};

const DEFAULTS: Omit<ProductTypeRow, 'id'>[] = [
  { key: 'tires',       label: 'ยาง',           icon: 'CircleDot', unit: 'เส้น', order: 0 },
  { key: 'wheels',      label: 'ล้อแม็ก',        icon: 'Disc3',     unit: 'วง',   order: 1 },
  { key: 'accessories', label: 'ของแต่ง',        icon: 'Wrench',    unit: 'ชิ้น', order: 2 },
  { key: 'brakes',      label: 'เบรค',           icon: 'Disc',      unit: 'ชิ้น', order: 3 },
  { key: 'shock',       label: 'โช๊ค',           icon: 'Zap',       unit: 'ต้น',  order: 4 },
  { key: 'oil',         label: 'น้ำมันเครื่อง',  icon: 'Droplets',  unit: 'ขวด',  order: 5 },
];

export async function getProductTypes(): Promise<ProductTypeRow[]> {
  await connectDB();
  let docs = await ProductTypeConfig.find().sort({ order: 1, createdAt: 1 }).lean();
  if (docs.length === 0) {
    await ProductTypeConfig.insertMany(DEFAULTS);
    docs = await ProductTypeConfig.find().sort({ order: 1, createdAt: 1 }).lean();
  }
  return docs.map(d => ({
    id:    String(d._id),
    key:   d.key as string,
    label: d.label as string,
    icon:  (d.icon as string) || 'Package',
    unit:  (d.unit as string) || 'ชิ้น',
    order: (d.order as number) ?? 99,
  }));
}

export async function createProductType(data: {
  key: string; label: string; icon: string; unit: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const key   = data.key.trim().toLowerCase().replace(/\s+/g, '_');
  const label = data.label.trim();
  const unit  = data.unit.trim() || 'ชิ้น';
  if (!key || !label) return { error: 'กรุณากรอกข้อมูลให้ครบ' };
  try {
    await connectDB();
    const exists = await ProductTypeConfig.findOne({ key });
    if (exists) return { error: `ประเภทสินค้า "${key}" มีอยู่แล้ว` };
    const count = await ProductTypeConfig.countDocuments();
    await ProductTypeConfig.create({ key, label, icon: data.icon || 'Package', unit, order: count });
    revalidatePath('/admin/products');
    revalidatePath('/admin/brands');
    return { ok: true };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function deleteProductType(id: string): Promise<{ ok?: boolean; error?: string }> {
  try {
    await connectDB();
    await ProductTypeConfig.findByIdAndDelete(id);
    revalidatePath('/admin/products');
    revalidatePath('/admin/brands');
    return { ok: true };
  } catch (e) {
    return { error: String(e) };
  }
}
