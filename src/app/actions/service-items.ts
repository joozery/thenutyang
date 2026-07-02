'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { ServiceItem } from '@/models/ServiceItem';

type ActionResult = { error?: string; ok?: boolean; item?: { id: string; name: string; price: number; cost: number; unit: string; note: string } };

export type ServiceItemInput = {
  name: string;
  price: number;
  cost: number;
  unit: string;
  note: string;
};

function validate(input: ServiceItemInput): string | null {
  if (!input.name.trim()) return 'กรุณากรอกชื่อบริการ';
  if (!Number.isFinite(input.price) || input.price < 0) return 'ราคาไม่ถูกต้อง';
  return null;
}

export async function createServiceItem(input: ServiceItemInput): Promise<ActionResult> {
  try {
    const error = validate(input);
    if (error) return { error };

    await connectDB();
    const doc = await ServiceItem.create(input);
    revalidatePath('/admin/documents/settings/services');
    return { ok: true, item: { id: String(doc._id), name: doc.name, price: doc.price, cost: doc.cost, unit: doc.unit, note: doc.note } };
  } catch (err) {
    console.error('[createServiceItem]', err);
    return { error: 'บันทึกไม่สำเร็จ' };
  }
}

export async function updateServiceItem(id: string, input: ServiceItemInput): Promise<ActionResult> {
  try {
    const error = validate(input);
    if (error) return { error };

    await connectDB();
    await ServiceItem.findByIdAndUpdate(id, input);
    revalidatePath('/admin/documents/settings/services');
    return { ok: true };
  } catch (err) {
    console.error('[updateServiceItem]', err);
    return { error: 'บันทึกไม่สำเร็จ' };
  }
}

export async function deleteServiceItem(id: string): Promise<ActionResult> {
  try {
    await connectDB();
    await ServiceItem.findByIdAndDelete(id);
    revalidatePath('/admin/documents/settings/services');
    return { ok: true };
  } catch (err) {
    console.error('[deleteServiceItem]', err);
    return { error: 'ลบไม่สำเร็จ' };
  }
}
