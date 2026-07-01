'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { FinancialDocument } from '@/models/FinancialDocument';
import { Booking } from '@/models/Booking';
import { generateDocNumber } from '@/lib/documents';
import { isDocEditable } from '@/lib/doc-editable';
import type { DocType, PaymentMethod } from '@/lib/documents';

export type DocFormPayload = {
  type:          DocType;
  customerName:   string;
  customerPhone:  string;
  customerEmail:  string;
  customerLineId: string;
  customerCar:    string;
  bookingRef?:   string;
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
  technicianName: string;
  depositAmount:  number;
  costPrice:      number;
  note:          string;
  showPaymentInfo: boolean;
  dueDate:       string;
  issuedDate?:   string;
};

export async function createDocument(
  data: DocFormPayload,
): Promise<{ success: boolean; docNumber?: string; id?: string; error?: string }> {
  try {
    await connectDB();
    const docNumber = await generateDocNumber(data.type);

    const defaultStatus =
      data.type === 'invoice'
        ? data.paymentMethod !== 'pending' ? 'paid' : 'unpaid'
        : data.type === 'quote'
        ? 'pending_approval'
        : data.type === 'billing_note'
        ? 'unpaid'
        : data.type === 'booking_note'
        ? (data.depositAmount > 0 ? 'deposit_paid' : 'reserved')
        : 'issued';

    const doc = await FinancialDocument.create({
      ...data,
      docNumber,
      source:   'manual',
      status:   defaultStatus,
      paidAt:   defaultStatus === 'paid' ? new Date() : null,
      issuedAt: data.issuedDate ? new Date(data.issuedDate) : new Date(),
      dueDate:  data.dueDate ? new Date(data.dueDate) : null,
    });

    if (defaultStatus === 'paid') {
      const { Income } = await import('@/models/Income');
      await Income.create({
        category: 'Sales',
        description: `ชำระเงินบิล ${docNumber} (${data.customerName})`,
        amount: data.grandTotal,
        incomeDate: new Date(),
        note: `อ้างอิงเอกสาร ${docNumber}`,
      });
    }

    revalidatePath('/admin/documents');
    return { success: true, docNumber, id: String(doc._id) };
  } catch (err) {
    console.error('[createDocument]', err);
    return { success: false, error: 'ไม่สามารถสร้างเอกสารได้' };
  }
}

// แก้ไขเอกสารที่มีอยู่แล้ว (ไม่เปลี่ยนประเภท/เลขที่เอกสาร) — เช็คสถานะซ้ำฝั่ง server เผื่อสถานะเปลี่ยนไปแล้วระหว่างที่เปิดฟอร์มอยู่
export async function updateDocument(
  id: string,
  data: Omit<DocFormPayload, 'relatedDocId' | 'relatedDocNumber'>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await FinancialDocument.findById(id).lean() as any;
    if (!existing) return { success: false, error: 'ไม่พบเอกสารนี้' };
    if (!isDocEditable(existing.type, existing.status)) {
      return { success: false, error: 'เอกสารนี้แก้ไขไม่ได้แล้ว (สถานะเปลี่ยนไปแล้ว)' };
    }

    const update: Record<string, unknown> = {
      customerName:    data.customerName,
      customerPhone:   data.customerPhone,
      customerEmail:   data.customerEmail,
      customerLineId:  data.customerLineId,
      customerCar:     data.customerCar,
      customerAddress: data.customerAddress,
      customerTaxId:   data.customerTaxId,
      items:           data.items,
      subtotal:        data.subtotal,
      discountTotal:   data.discountTotal,
      vatRate:         data.vatRate,
      vatAmount:       data.vatAmount,
      grandTotal:      data.grandTotal,
      paymentMethod:   data.paymentMethod,
      technicianName:  data.technicianName,
      depositAmount:   data.depositAmount,
      costPrice:       data.costPrice,
      note:            data.note,
      showPaymentInfo: data.showPaymentInfo,
      dueDate:         data.dueDate ? new Date(data.dueDate) : null,
    };

    if (existing.type === 'booking_note') {
      update.status = data.depositAmount > 0 ? 'deposit_paid' : 'reserved';
    }

    // invoice ที่แอดมินแก้วิธีชำระจาก "รอชำระ" เป็นวิธีอื่น ระหว่างแก้ไข ถือว่าจ่ายแล้ว ณ ตอนนี้ — ทำให้สถานะ + ออก Income เหมือนตอนสร้างใหม่
    if (existing.type === 'invoice' && data.paymentMethod !== 'pending') {
      update.status = 'paid';
      update.paidAt = new Date();
      const { Income } = await import('@/models/Income');
      await Income.create({
        category: 'Sales',
        description: `ชำระเงินบิล ${existing.docNumber} (${data.customerName})`,
        amount: data.grandTotal,
        incomeDate: new Date(),
        note: `อ้างอิงเอกสาร ${existing.docNumber}`,
      });
    }

    await FinancialDocument.findByIdAndUpdate(id, update);
    revalidatePath('/admin/documents');
    return { success: true };
  } catch (err) {
    console.error('[updateDocument]', err);
    return { success: false, error: 'ไม่สามารถบันทึกการแก้ไขได้' };
  }
}

type BookingForDoc = {
  _id: unknown; ref: string; orderRef?: string; name: string; phone: string;
  customerType?: string; companyName?: string;
  carBrand?: string; carModel?: string; carYear?: string;
  licensePlate?: string; mileageBefore?: number | null; mileageAfter?: number | null;
  address?: string; taxId?: string;
  tireName: string; tirePrice: number; quantity: number;
  status?: string; createdAt?: Date; note?: string;
};

// รวมข้อมูลรถ (ยี่ห้อ/รุ่น/ปี/ทะเบียน/เลขไมล์) เป็นข้อความเดียว ใช้แสดงในช่อง customerCar ของเอกสาร
function formatCarInfo(b: BookingForDoc): string {
  const parts: string[] = [];
  if (b.carBrand) parts.push(`ยี่ห้อ ${b.carBrand}`);
  if (b.carModel) parts.push(`รุ่น ${b.carModel}`);
  if (b.carYear)  parts.push(`ปี ${b.carYear}`);
  if (b.licensePlate) parts.push(`ทะเบียน ${b.licensePlate}`);
  if (b.mileageBefore != null) {
    parts.push(
      b.mileageAfter != null
        ? `ไมล์ ${b.mileageBefore.toLocaleString()} → ${b.mileageAfter.toLocaleString()}`
        : `ไมล์ ${b.mileageBefore.toLocaleString()}`
    );
  }
  return parts.join(' • ');
}

function buildDocFromBooking(b: BookingForDoc, type: DocType, docNumber: string) {
  const qty        = b.quantity ?? 1;
  const unitPrice   = b.tirePrice ?? 0;
  const subtotal    = qty * unitPrice;
  const vatAmount   = subtotal * 0.07;
  const grandTotal  = subtotal + vatAmount;
  const isInvoice   = type === 'invoice';
  const customerName = b.customerType === 'corporate' && b.companyName ? b.companyName : (b.name ?? '');

  return {
    docNumber,
    type,
    source:          'booking' as const,
    bookingId:       b._id,
    bookingRef:      b.orderRef ?? b.ref ?? '',
    customerName,
    customerPhone:   b.phone ?? '',
    customerCar:     formatCarInfo(b),
    customerAddress: b.address ?? '',
    customerTaxId:   b.taxId ?? '',
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
    paymentMethod: isInvoice ? 'cash' : 'pending',
    status:        isInvoice ? 'paid' : 'pending_approval',
    paidAt:        isInvoice ? (b.createdAt ?? new Date()) : null,
    issuedAt:      b.createdAt ?? new Date(),
    note:          b.note ?? '',
  };
}

// เรียกทันทีหลังสร้าง Booking ใหม่ — ออกใบเสนอราคาให้อัตโนมัติโดยไม่บล็อกการจองถ้าล้มเหลว
export async function createQuoteFromBooking(booking: BookingForDoc): Promise<void> {
  try {
    await connectDB();
    const docNumber = await generateDocNumber('quote');
    await FinancialDocument.create(buildDocFromBooking(booking, 'quote', docNumber));
    revalidatePath('/admin/documents');
  } catch (err) {
    console.error('[createQuoteFromBooking]', err);
  }
}

function buildMultiDocFromBookings(bookings: BookingForDoc[], type: DocType, docNumber: string) {
  const items = bookings.map((b) => {
    const qty       = b.quantity ?? 1;
    const unitPrice = b.tirePrice ?? 0;
    return { description: b.tireName ?? '', qty, unitPrice, discount: 0, lineTotal: qty * unitPrice };
  });
  const subtotal   = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const vatAmount  = subtotal * 0.07;
  const grandTotal = subtotal + vatAmount;
  const primary    = bookings[0];
  const isInvoice  = type === 'invoice';
  const customerName = primary.customerType === 'corporate' && primary.companyName ? primary.companyName : (primary.name ?? '');

  return {
    docNumber,
    type,
    source:          'booking' as const,
    bookingId:       primary._id,
    bookingRef:      primary.orderRef ?? primary.ref ?? '',
    customerName,
    customerPhone:   primary.phone ?? '',
    customerCar:     formatCarInfo(primary),
    customerAddress: primary.address ?? '',
    customerTaxId:   primary.taxId ?? '',
    items,
    subtotal,
    discountTotal: 0,
    vatRate:       7,
    vatAmount,
    grandTotal,
    paymentMethod: isInvoice ? 'cash' : 'pending',
    status:        isInvoice ? 'paid' : 'pending_approval',
    paidAt:        isInvoice ? (primary.createdAt ?? new Date()) : null,
    issuedAt:      primary.createdAt ?? new Date(),
    note:          primary.note ?? '',
  };
}

// เหมือน createQuoteFromBooking แต่รวมหลาย Booking (จากตะกร้าเดียวกัน) เป็นใบเสนอราคาใบเดียว หลายรายการสินค้า
export async function createQuoteFromBookings(bookings: BookingForDoc[]): Promise<void> {
  try {
    if (bookings.length === 0) return;
    await connectDB();
    const docNumber = await generateDocNumber('quote');
    await FinancialDocument.create(buildMultiDocFromBookings(bookings, 'quote', docNumber));
    revalidatePath('/admin/documents');
  } catch (err) {
    console.error('[createQuoteFromBookings]', err);
  }
}

// บันทึกรับชำระบางส่วนของใบแจ้งหนี้ — สร้าง "ใบรับชำระ" แยกต่อครั้ง แล้วเช็คว่าชำระครบหรือยัง
// ถ้าครบ: ปิดใบแจ้งหนี้เป็นชำระแล้ว + ออกใบเสร็จ/ใบกำกับภาษีสุดท้ายให้อัตโนมัติ
export async function recordPartialPayment(
  billingNoteId: string,
  amount: number,
  method: PaymentMethod,
  note?: string,
): Promise<{ success: boolean; docNumber?: string; billingStatus?: string; invoiceDocNumber?: string; error?: string }> {
  try {
    if (!Number.isFinite(amount) || amount <= 0) return { success: false, error: 'จำนวนเงินไม่ถูกต้อง' };

    await connectDB();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const billingNote = await FinancialDocument.findById(billingNoteId).lean() as any;
    if (!billingNote || billingNote.type !== 'billing_note') return { success: false, error: 'ไม่พบใบแจ้งหนี้นี้' };
    if (billingNote.status === 'paid') return { success: false, error: 'ใบแจ้งหนี้นี้ชำระครบแล้ว' };
    if (billingNote.status === 'cancelled') return { success: false, error: 'ใบแจ้งหนี้นี้ถูกยกเลิกแล้ว' };

    const paidSoFarAgg = await FinancialDocument.aggregate([
      { $match: { type: 'payment_note', relatedDocId: billingNote._id } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]);
    const alreadyPaid = paidSoFarAgg[0]?.total ?? 0;
    const remaining   = billingNote.grandTotal - alreadyPaid;

    if (amount > remaining + 0.01) {
      return { success: false, error: `ยอดชำระเกินยอดคงเหลือ (คงเหลือ ฿${remaining.toLocaleString()})` };
    }

    const docNumber = await generateDocNumber('payment_note');
    await FinancialDocument.create({
      docNumber,
      type:             'payment_note',
      source:           'manual',
      relatedDocId:     billingNote._id,
      relatedDocNumber: billingNote.docNumber,
      customerName:     billingNote.customerName,
      customerPhone:    billingNote.customerPhone,
      customerCar:      billingNote.customerCar,
      bookingRef:       billingNote.bookingRef ?? '',
      customerAddress:  billingNote.customerAddress,
      customerTaxId:    billingNote.customerTaxId,
      items: [{ description: `รับชำระสำหรับใบแจ้งหนี้ ${billingNote.docNumber}`, qty: 1, unitPrice: amount, discount: 0, lineTotal: amount }],
      subtotal:      amount,
      discountTotal: 0,
      vatRate:       0,
      vatAmount:     0,
      grandTotal:    amount,
      paymentMethod: method,
      status:        'paid',
      paidAt:        new Date(),
      issuedAt:      new Date(),
      note:          note ?? '',
    });

    const { Income } = await import('@/models/Income');
    await Income.create({
      category: 'Sales',
      description: `รับชำระสำหรับใบแจ้งหนี้ ${billingNote.docNumber}`,
      amount: amount,
      incomeDate: new Date(),
      note: `อ้างอิงใบรับชำระ ${docNumber}`,
    });

    const fullyPaid = alreadyPaid + amount >= billingNote.grandTotal - 0.01;
    let invoiceDocNumber: string | undefined;

    if (fullyPaid) {
      invoiceDocNumber = await generateDocNumber('invoice');
      await FinancialDocument.create({
        docNumber:        invoiceDocNumber,
        type:             'invoice',
        source:           'manual',
        relatedDocId:     billingNote._id,
        relatedDocNumber: billingNote.docNumber,
        customerName:     billingNote.customerName,
        customerPhone:    billingNote.customerPhone,
        customerCar:      billingNote.customerCar,
        bookingRef:       billingNote.bookingRef ?? '',
        customerAddress:  billingNote.customerAddress,
        customerTaxId:    billingNote.customerTaxId,
        items:            billingNote.items,
        subtotal:         billingNote.subtotal,
        discountTotal:    billingNote.discountTotal,
        vatRate:          billingNote.vatRate,
        vatAmount:        billingNote.vatAmount,
        grandTotal:       billingNote.grandTotal,
        paymentMethod:    method,
        status:           'paid',
        paidAt:           new Date(),
        issuedAt:         new Date(),
        note:             `ออกอัตโนมัติเมื่อชำระใบแจ้งหนี้ ${billingNote.docNumber} ครบ`,
      });
      await FinancialDocument.findByIdAndUpdate(billingNoteId, { status: 'paid' });
    } else {
      await FinancialDocument.findByIdAndUpdate(billingNoteId, { status: 'partial' });
    }

    revalidatePath('/admin/documents');
    return { success: true, docNumber, billingStatus: fullyPaid ? 'paid' : 'partial', invoiceDocNumber };
  } catch (err) {
    console.error('[recordPartialPayment]', err);
    return { success: false, error: 'บันทึกการชำระเงินไม่สำเร็จ' };
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
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = await FinancialDocument.findByIdAndUpdate(id, update) as any;
    
    if (status === 'paid' && doc) {
      const { Income } = await import('@/models/Income');
      await Income.create({
        category: 'Sales',
        description: `ชำระเงินบิล ${doc.docNumber}`,
        amount: doc.grandTotal,
        incomeDate: new Date(),
        note: `อ้างอิงเอกสาร ${doc.docNumber}`,
      });
    }

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
    }).lean() as unknown as BookingForDoc[];

    if (bookings.length === 0) return { success: true, imported: 0, skipped: 0 };

    const existing   = await FinancialDocument.distinct('bookingId', { bookingId: { $in: bookings.map(b => b._id) } });
    const existingSet = new Set(existing.map(id => String(id)));

    const toImport = bookings.filter(b => !existingSet.has(String(b._id)));
    const skipped  = bookings.length - toImport.length;

    if (toImport.length === 0) return { success: true, imported: 0, skipped };

    const docs = [];
    for (const b of toImport) {
      const type: DocType = b.status === 'completed' ? 'invoice' : 'quote';
      const docNumber     = await generateDocNumber(type);
      docs.push(buildDocFromBooking(b, type, docNumber));
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
    const doc = await FinancialDocument.findById(id).lean() as { docNumber?: string } | null;
    await FinancialDocument.findByIdAndDelete(id);
    if (doc?.docNumber) {
      const { Income } = await import('@/models/Income');
      await Income.deleteMany({ note: { $regex: doc.docNumber } });
    }
    revalidatePath('/admin/documents');
    return { success: true };
  } catch (err) {
    console.error('[deleteDocument]', err);
    return { success: false, error: 'ไม่สามารถลบเอกสารได้' };
  }
}
