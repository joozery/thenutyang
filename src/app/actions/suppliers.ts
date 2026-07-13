'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Supplier } from '@/models/Supplier';

export type SupplierFormInput = {
  name:    string;
  address: string;
  contact: string;
  phone:   string;
  email:   string;
  taxId:   string;
};

function validate(input: SupplierFormInput): string | null {
  if (!input.name.trim()) return 'กรุณากรอกชื่อซัพพลายเออร์';
  return null;
}

export async function createSupplier(
  input: SupplierFormInput,
): Promise<{ id?: string; error?: string }> {
  const err = validate(input);
  if (err) return { error: err };
  try {
    await connectDB();
    const doc = await Supplier.create(input);
    revalidatePath('/admin/purchasing');
    return { id: String(doc._id) };
  } catch (e) {
    console.error('[createSupplier]', e);
    return { error: 'ไม่สามารถเพิ่มซัพพลายเออร์ได้' };
  }
}

export async function updateSupplier(
  id: string,
  input: SupplierFormInput,
): Promise<{ error?: string }> {
  const err = validate(input);
  if (err) return { error: err };
  try {
    await connectDB();
    await Supplier.findByIdAndUpdate(id, input);
    revalidatePath('/admin/purchasing');
    revalidatePath('/admin/customers');
    return {};
  } catch (e) {
    console.error('[updateSupplier]', e);
    return { error: 'ไม่สามารถแก้ไขซัพพลายเออร์ได้' };
  }
}

export async function deleteSupplier(id: string): Promise<{ error?: string }> {
  try {
    await connectDB();
    await Supplier.findByIdAndDelete(id);
    revalidatePath('/admin/purchasing');
    return {};
  } catch (e) {
    console.error('[deleteSupplier]', e);
    return { error: 'ไม่สามารถลบซัพพลายเออร์ได้' };
  }
}
