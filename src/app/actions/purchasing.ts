'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { Expense } from '@/models/Expense';
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
    qty: number; unitPrice: number; discount: number; year: string; lineTotal: number;
  }[];
  paymentTerm:     string;
  paymentDate?:    string;
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
    paymentDate:     data.paymentDate ? new Date(data.paymentDate) : undefined,
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

export async function updatePOPayment(
  id: string,
  amountPaid: number,
  paymentDateStr: string,
): Promise<{ error?: string }> {
  try {
    await connectDB();
    const po = await PurchaseOrder.findById(id);
    if (!po) return { error: 'ไม่พบใบสั่งซื้อ' };

    const paymentDate = new Date(paymentDateStr || Date.now());
    const totalPaid = po.amountPaid + amountPaid;
    const paymentStatus = totalPaid >= po.grandTotal ? 'paid' : 'partial';

    // Record expense
    const expense = await Expense.create({
      category: 'PurchaseOrder',
      description: `ชำระเงินใบสั่งซื้อ ${po.poNumber}`,
      amount: amountPaid,
      expenseDate: paymentDate,
      note: `อ้างอิงใบสั่งซื้อ ${po.poNumber}`,
    });

    await PurchaseOrder.findByIdAndUpdate(id, {
      paymentStatus,
      amountPaid: totalPaid,
      paymentDate,
      expenseId: expense._id,
    });

    revalidatePath('/admin/purchasing');
    return {};
  } catch (err) {
    console.error('[updatePOPayment]', err);
    return { error: 'ไม่สามารถบันทึกการชำระเงินได้' };
  }
}
