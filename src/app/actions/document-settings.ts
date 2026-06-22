'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { DocumentSettings } from '@/models/DocumentSettings';

type ActionResult = { error?: string; ok?: boolean };

export async function updateDocumentInfo(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await connectDB();
    await DocumentSettings.findOneAndUpdate(
      {},
      {
        companyName: (formData.get('companyName') as string) ?? '',
        address:     (formData.get('address') as string) ?? '',
        phone:       (formData.get('phone') as string) ?? '',
        email:       (formData.get('email') as string) ?? '',
        website:     (formData.get('website') as string) ?? '',
        taxId:       (formData.get('taxId') as string) ?? '',
        issuerName:  (formData.get('issuerName') as string) ?? '',
        approverName: (formData.get('approverName') as string) ?? '',
        updatedAt: new Date(),
      },
      { upsert: true }
    );
    revalidatePath('/admin/documents/settings');
    revalidatePath('/admin/documents');
    revalidatePath('/admin/purchasing');
    return { ok: true };
  } catch (err) {
    console.error('[updateDocumentInfo]', err);
    return { error: 'บันทึกไม่สำเร็จ' };
  }
}

async function setImageField(field: 'logoUrl' | 'issuerSignatureUrl' | 'approverSignatureUrl' | 'stampUrl', url: string): Promise<ActionResult> {
  try {
    await connectDB();
    await DocumentSettings.findOneAndUpdate({}, { [field]: url, updatedAt: new Date() }, { upsert: true });
    revalidatePath('/admin/documents/settings');
    revalidatePath('/admin/documents');
    revalidatePath('/admin/purchasing');
    return { ok: true };
  } catch (err) {
    console.error('[setImageField]', field, err);
    return { error: 'บันทึกไม่สำเร็จ' };
  }
}

export async function setDocumentLogo(url: string) { return setImageField('logoUrl', url); }
export async function setIssuerSignature(url: string) { return setImageField('issuerSignatureUrl', url); }
export async function setApproverSignature(url: string) { return setImageField('approverSignatureUrl', url); }
export async function setCompanyStamp(url: string) { return setImageField('stampUrl', url); }
