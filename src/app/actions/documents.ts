'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { FinancialDocument } from '@/models/FinancialDocument';
import { Booking } from '@/models/Booking';
import { generateDocNumber } from '@/lib/documents';
import type { DocType, PaymentMethod } from '@/lib/documents';

export type DocFormPayload = {
  type:          DocType;
  customerName:  string;
  customerPhone: string;
  customerCar:   string;
  customerAddress: string;
  customerTaxId:   string;
  relatedDocId?:     string;
  relatedDocNumber?: string;
  items: {
    description: string;
    qty:         number;
    unitPrice:   number;
    discount:    number;
    lineTotal:   number;
  }[];
  subtotal:      number;
  discountTotal: number;
  vatRate:       number;
  vatAmount:     number;
  grandTotal:    number;
  paymentMethod: PaymentMethod;
  note:          string;
  dueDate:       string;
};

export async function createDocument(
  data: DocFormPayload,
): Promise<{ success: boolean; docNumber?: string; error?: string }> {
  try {
    await connectDB();
    const docNumber = await generateDocNumber(data.type);

    const defaultStatus =
      data.type === 'invoice'
        ? data.paymentMethod !== 'pending' ? 'paid' : 'unpaid'
        : data.type === 'quote'
        ? 'pending_approval'
        : 'issued';

    await FinancialDocument.create({
      ...data,
      docNumber,
      source:   'manual',
      status:   defaultStatus,
      paidAt:   defaultStatus === 'paid' ? new Date() : null,
      issuedAt: new Date(),
      dueDate:  data.dueDate ? new Date(data.dueDate) : null,
    });

    revalidatePath('/admin/documents');
    return { success: true, docNumber };
  } catch (err) {
    console.error('[createDocument]', err);
    return { success: false, error: 'ไม่สามารถสร้างเอกสารได้' };
  }
}

export async function updateDocStatus(
  id: string,
  status: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    const update: Record<string, unknown> = { status };
    if (status === 'paid') update.paidAt = new Date();
    await FinancialDocument.findByIdAndUpdate(id, update);
    revalidatePath('/admin/documents');
    return { success: true };
  } catch (err) {
    console.error('[updateDocStatus]', err);
    return { success: false, error: 'ไม่สามารถอัปเดตสถานะได้' };
  }
}

export async function importFromBookings(): Promise<{
  success: boolean;
  imported: number;
  skipped:  number;
  error?:   string;
}> {
  try {
    await connectDB();

    const bookings = await Booking.find({
      status: { $in: ['completed', 'pending', 'confirmed'] },
    }).lean() as {
      _id: unknown; ref: string; name: string; phone: string;
      carModel: string; carYear: string; tireName: string;
      tirePrice: number; quantity: number; status: string;
      createdAt: Date; note: string;
    }[];

    if (bookings.length === 0) return { success: true, imported: 0, skipped: 0 };

    const existing   = await FinancialDocument.distinct('bookingId', { bookingId: { $in: bookings.map(b => b._id) } });
    const existingSet = new Set(existing.map(id => String(id)));

    const toImport = bookings.filter(b => !existingSet.has(String(b._id)));
    const skipped  = bookings.length - toImport.length;

    if (toImport.length === 0) return { success: true, imported: 0, skipped };

    const docs = [];
    for (const b of toImport) {
      const isCompleted = b.status === 'completed';
      const type: DocType = isCompleted ? 'invoice' : 'quote';
      const docNumber     = await generateDocNumber(type);
      const qty           = b.quantity ?? 1;
      const unitPrice     = b.tirePrice ?? 0;
      const subtotal      = qty * unitPrice;
      const vatAmount     = subtotal * 0.07;
      const grandTotal    = subtotal + vatAmount;

      docs.push({
        docNumber,
        type,
        source:        'booking',
        bookingId:     b._id,
        bookingRef:    b.ref ?? '',
        customerName:  b.name  ?? '',
        customerPhone: b.phone ?? '',
        customerCar:   `${b.carModel ?? ''} ${b.carYear ?? ''}`.trim(),
        items: [{
          description: b.tireName ?? '',
          qty,
          unitPrice,
          discount:  0,
          lineTotal: subtotal,
        }],
        subtotal,
        discountTotal: 0,
        vatRate:       7,
        vatAmount,
        grandTotal,
        paymentMethod: isCompleted ? 'cash' : 'pending',
        status:        isCompleted ? 'paid'  : 'pending_approval',
        paidAt:        isCompleted ? (b.createdAt ?? new Date()) : null,
        issuedAt:      b.createdAt ?? new Date(),
        note:          b.note ?? '',
      });
    }

    await FinancialDocument.insertMany(docs);
    revalidatePath('/admin/documents');
    return { success: true, imported: docs.length, skipped };
  } catch (err) {
    console.error('[importFromBookings]', err);
    return { success: false, imported: 0, skipped: 0, error: 'นำเข้าไม่สำเร็จ' };
  }
}

export async function deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    await FinancialDocument.findByIdAndDelete(id);
    revalidatePath('/admin/documents');
    return { success: true };
  } catch (err) {
    console.error('[deleteDocument]', err);
    return { success: false, error: 'ไม่สามารถลบเอกสารได้' };
  }
}
