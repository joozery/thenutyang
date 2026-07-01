'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import { WarrantyClaim } from '@/models/WarrantyClaim';
import { generateClaimNumber } from '@/lib/warranty-claims';
import type { ClaimItem } from '@/lib/warranty-claims';

// ─── Step 1: สร้างเคสใหม่ ───────────────────────────────────────────────────

export async function createWarrantyClaim(formData: FormData): Promise<void> {
  await connectDB();
  const claimNumber = await generateClaimNumber();

  const itemsRaw = formData.get('items') as string;
  const items: ClaimItem[] = itemsRaw ? JSON.parse(itemsRaw) : [];

  await WarrantyClaim.create({
    claimNumber,
    customerName: (formData.get('customerName') as string ?? '').trim(),
    customerPhone: (formData.get('customerPhone') as string ?? '').trim(),
    licensePlate: (formData.get('licensePlate') as string ?? '').trim(),
    claimDate: new Date(formData.get('claimDate') as string),
    items,
    customerNotes: (formData.get('customerNotes') as string ?? '').trim(),
    status: 'customer_filed',
  });

  revalidatePath('/admin/warranty-claims');
  redirect('/admin/warranty-claims');
}

// ─── Step 2: ส่งเครมไปบริษัท ──────────────────────────────────────────────

export async function updateSupplierStep(id: string, formData: FormData): Promise<void> {
  await connectDB();
  await WarrantyClaim.findByIdAndUpdate(id, {
    supplierName: (formData.get('supplierName') as string ?? '').trim(),
    supplierSentDate: new Date(formData.get('supplierSentDate') as string),
    supplierRef: (formData.get('supplierRef') as string ?? '').trim(),
    supplierNotes: (formData.get('supplierNotes') as string ?? '').trim(),
    status: 'sent_to_supplier',
  });
  revalidatePath(`/admin/warranty-claims/${id}`);
}

// ─── Step 3: สำรองจ่ายก่อน ───────────────────────────────────────────────

export async function updateAdvanceStep(id: string, formData: FormData): Promise<void> {
  await connectDB();
  const isAdvanced = formData.get('isAdvanced') === 'true';
  await WarrantyClaim.findByIdAndUpdate(id, {
    isAdvanced,
    advanceAmount: isAdvanced ? parseFloat(formData.get('advanceAmount') as string) || 0 : 0,
    advanceDate: isAdvanced ? new Date(formData.get('advanceDate') as string) : null,
    advanceNotes: (formData.get('advanceNotes') as string ?? '').trim(),
    status: 'waiting_result',
  });
  revalidatePath(`/admin/warranty-claims/${id}`);
}

// ─── Step 4: ผลออก ────────────────────────────────────────────────────────

export async function updateResultStep(id: string, formData: FormData): Promise<void> {
  await connectDB();
  const resultType = formData.get('resultType') as 'replacement' | 'money';
  await WarrantyClaim.findByIdAndUpdate(id, {
    resultDate: new Date(formData.get('resultDate') as string),
    resultType,
    replacementDescription: resultType === 'replacement'
      ? (formData.get('replacementDescription') as string ?? '').trim()
      : '',
    compensationAmount: resultType === 'money'
      ? parseFloat(formData.get('compensationAmount') as string) || 0
      : 0,
    customerResolutionDate: formData.get('customerResolutionDate')
      ? new Date(formData.get('customerResolutionDate') as string)
      : null,
    customerResolutionNotes: (formData.get('customerResolutionNotes') as string ?? '').trim(),
    status: 'resolved',
  });
  revalidatePath(`/admin/warranty-claims/${id}`);
}

// ─── ลบเคส ────────────────────────────────────────────────────────────────

export async function deleteWarrantyClaim(id: string): Promise<void> {
  await connectDB();
  await WarrantyClaim.findByIdAndDelete(id);
  revalidatePath('/admin/warranty-claims');
  redirect('/admin/warranty-claims');
}
