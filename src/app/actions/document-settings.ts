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
        $set: {
          companyName:  (formData.get('companyName') as string) ?? '',
          address:      (formData.get('address') as string) ?? '',
          phone:        (formData.get('phone') as string) ?? '',
          email:        (formData.get('email') as string) ?? '',
          website:      (formData.get('website') as string) ?? '',
          lineId:       (formData.get('lineId') as string) ?? '',
          taxId:        (formData.get('taxId') as string) ?? '',
          issuerName:   (formData.get('issuerName') as string) ?? '',
          approverName: (formData.get('approverName') as string) ?? '',
          updatedAt:    new Date(),
        },
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

async function setImageField(field: 'logoUrl' | 'issuerSignatureUrl' | 'approverSignatureUrl' | 'stampUrl' | 'paymentQrUrl', url: string): Promise<ActionResult> {
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
export async function setPaymentQr(url: string) { return setImageField('paymentQrUrl', url); }

// แยกจาก updateDocumentInfo เพราะเป็นหน้าตั้งค่าคนละหน้า (ข้อมูลรับชำระเงิน ไม่ใช่หัวกระดาษเอกสาร)
export async function updatePaymentInfo(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await connectDB();
    await DocumentSettings.findOneAndUpdate(
      {},
      {
        bankName:          (formData.get('bankName') as string) ?? '',
        bankAccountNumber: (formData.get('bankAccountNumber') as string) ?? '',
        bankAccountName:   (formData.get('bankAccountName') as string) ?? '',
        bankBranch:        (formData.get('bankBranch') as string) ?? '',
        promptPay:         (formData.get('promptPay') as string) ?? '',
        paymentNote:       (formData.get('paymentNote') as string) ?? '',
        updatedAt: new Date(),
      },
      { upsert: true }
    );
    revalidatePath('/admin/documents/settings/payment-info');
    revalidatePath('/admin/documents');
    return { ok: true };
  } catch (err) {
    console.error('[updatePaymentInfo]', err);
    return { error: 'บันทึกไม่สำเร็จ' };
  }
}
