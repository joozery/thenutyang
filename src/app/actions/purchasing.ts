'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { generatePONumber } from '@/lib/purchasing';

export type POFormPayload = {
  supplierId: string;
  supplierSnapshot: {
    name: string; address: string; contact: string;
    phone: string; email: string; taxId: string;
  };
  poType: 'standard' | 'urgent';
  dueDate: string;
  items: {
    productName: string; unit: string;
    qty: number; unitPrice: number; discount: number; lineTotal: number;
  }[];
  paymentTerm:     string;
  paymentMethod:   string;
  shippingAddress: string;
  notes:           string;
  specialTerms:    string;
  subtotal:        number;
  totalDiscount:   number;
  vat:             number;
  grandTotal:      number;
};

async function savePO(data: POFormPayload, status: 'pending' | 'draft') {
  await connectDB();
  const poNumber = await generatePONumber();

  await PurchaseOrder.create({
    poNumber,
    poType: data.poType,
    supplierId: data.supplierId || undefined,
    supplierSnapshot: data.supplierSnapshot,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    items: data.items,
    paymentTerm:     data.paymentTerm,
    paymentMethod:   data.paymentMethod,
    shippingAddress: data.shippingAddress,
    notes:           data.notes,
    specialTerms:    data.specialTerms,
    subtotal:        data.subtotal,
    totalDiscount:   data.totalDiscount,
    vat:             data.vat,
    grandTotal:      data.grandTotal,
    status,
  });

  revalidatePath('/admin/purchasing');
  return poNumber;
}

export async function createPO(
  data: POFormPayload,
): Promise<{ success: boolean; poNumber?: string; error?: string }> {
  try {
    const poNumber = await savePO(data, 'pending');
    return { success: true, poNumber };
  } catch (err) {
    console.error('[createPO]', err);
    return { success: false, error: 'ไม่สามารถสร้างใบสั่งซื้อได้ กรุณาลองใหม่' };
  }
}

export async function saveDraftPO(
  data: POFormPayload,
): Promise<{ success: boolean; poNumber?: string; error?: string }> {
  try {
    const poNumber = await savePO(data, 'draft');
    return { success: true, poNumber };
  } catch (err) {
    console.error('[saveDraftPO]', err);
    return { success: false, error: 'ไม่สามารถบันทึกร่างได้ กรุณาลองใหม่' };
  }
}

export async function receivePO(id: string): Promise<{ error?: string }> {
  try {
    await connectDB();
    await PurchaseOrder.findByIdAndUpdate(id, { status: 'received' });
    revalidatePath('/admin/purchasing');
    return {};
  } catch (err) {
    console.error('[receivePO]', err);
    return { error: 'ไม่สามารถอัปเดตสถานะได้' };
  }
}

export async function cancelPO(id: string): Promise<{ error?: string }> {
  try {
    await connectDB();
    await PurchaseOrder.findByIdAndUpdate(id, { status: 'cancelled' });
    revalidatePath('/admin/purchasing');
    return {};
  } catch (err) {
    console.error('[cancelPO]', err);
    return { error: 'ไม่สามารถยกเลิกได้' };
  }
}
