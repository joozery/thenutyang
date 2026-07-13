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
  customerBranch:  string;
  relatedDocId?:     string;
  relatedDocNumber?: string;
  items: {
    productId?:   string;
    description:  string;
    qty:          number;
    unitPrice:    number;
    discount:     number;
    discountType: 'pct' | 'amt';
    lineTotal:    number;
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

// เอกสารที่ถือว่า "ของออกจากคลัง" — ตัดสต๊อกอัตโนมัติสำหรับบรรทัดที่ผูกสินค้าไว้
const STOCK_DOC_TYPES = ['invoice', 'billing_note'];

// ตัดสต๊อกตามรายการที่ผูกสินค้า + ลงประวัติเบิกออกอ้างอิงเลขเอกสาร
// คืนค่า warnings สำหรับบรรทัดที่ตัดไม่ได้/ตัดไม่ครบ
async function deductStockForDoc(
  docNumber: string,
  relatedDocNumber: string | undefined,
  items: DocFormPayload['items'],
): Promise<string[]> {
  const linked = items.filter(i => i.productId);
  if (linked.length === 0) return [];

  const { Product } = await import('@/models/Product');
  const { StockMovement } = await import('@/models/StockMovement');

  // เอกสารต่อยอด (เช่นใบเสร็จที่ออกจากใบแจ้งหนี้) — ถ้าใบต้นทางตัดสต๊อกไปแล้ว ไม่ตัดซ้ำ
  if (relatedDocNumber) {
    const prior = await StockMovement.findOne({ refNo: relatedDocNumber, type: 'out' }).lean();
    if (prior) return [];
  }

  const warnings: string[] = [];
  for (const item of linked) {
    const product = await Product.findById(item.productId).lean() as { stock?: number; brand?: string; model?: string; size?: string } | null;
    if (!product) { warnings.push(`ไม่พบสินค้า "${item.description}" ในคลัง`); continue; }
    const stockBefore = product.stock ?? 0;
    const outQty = Math.min(item.qty, stockBefore);
    if (outQty < item.qty) warnings.push(`"${item.description}" สต๊อกไม่พอ ตัดได้ ${outQty}/${item.qty} เส้น — ส่วนที่เหลือให้เบิกเองหลังรับของเข้า`);
    if (outQty === 0) continue;
    const productName = `${product.brand ?? ''} ${product.model ?? ''} ${product.size ?? ''}`.trim();
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -outQty } });
    await StockMovement.create({
      productId: item.productId, productName, type: 'out',
      qty: outQty, stockBefore, stockAfter: stockBefore - outQty,
      refNo: docNumber, note: `ขายตามใบ ${docNumber}`,
    });
  }
  revalidatePath('/admin/warehouse');
  return warnings;
}

// คืนสต๊อก + ลบเฉพาะประวัติที่ระบบตัดให้อัตโนมัติของใบนี้ (ใช้ตอนแก้ไข/ยกเลิก/ลบเอกสาร)
// รายการที่พนักงานเบิกเองในหน้าคลังจะไม่ถูกแตะ
async function revertStockForDoc(docNumber: string): Promise<void> {
  const { Product } = await import('@/models/Product');
  const { StockMovement } = await import('@/models/StockMovement');
  const moves = await StockMovement.find({ refNo: docNumber, type: 'out', note: `ขายตามใบ ${docNumber}` })
    .lean() as { _id: unknown; productId?: unknown; qty: number }[];
  for (const m of moves) {
    if (m.productId) await Product.findByIdAndUpdate(m.productId, { $inc: { stock: m.qty } });
    await StockMovement.findByIdAndDelete(m._id);
  }
  if (moves.length) revalidatePath('/admin/warehouse');
}

export async function createDocument(
  data: DocFormPayload,
): Promise<{ success: boolean; docNumber?: string; id?: string; error?: string; warnings?: string[] }> {
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
        incomeDate: data.issuedDate ? new Date(data.issuedDate) : new Date(),
        note: `อ้างอิงเอกสาร ${docNumber}`,
      });
    }

    // ใบเสร็จ/ใบแจ้งหนี้ที่ผูกสินค้าไว้ → ตัดสต๊อก + ลงประวัติคลังอัตโนมัติ
    let warnings: string[] = [];
    if (STOCK_DOC_TYPES.includes(data.type)) {
      warnings = await deductStockForDoc(docNumber, data.relatedDocNumber, data.items);
    }

    revalidatePath('/admin/documents');
    return { success: true, docNumber, id: String(doc._id), ...(warnings.length ? { warnings } : {}) };
  } catch (err) {
    console.error('[createDocument]', err);
    return { success: false, error: 'ไม่สามารถสร้างเอกสารได้' };
  }
}

// แก้ไขเอกสารที่มีอยู่แล้ว (ไม่เปลี่ยนประเภท/เลขที่เอกสาร) — แก้ได้ทุกสถานะ
// เอกสารที่บันทึกรายรับ (Income) ไปแล้วจะถูก sync ยอดตามการแก้ไข ไม่สร้างซ้ำ
export async function updateDocument(
  id: string,
  data: Omit<DocFormPayload, 'relatedDocId' | 'relatedDocNumber'>,
): Promise<{ success: boolean; error?: string; warnings?: string[] }> {
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
      customerBranch:  data.customerBranch,
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

    // สถานะ booking_note ผูกกับมัดจำ — อัปเดตเฉพาะตอนยังอยู่ในขั้นจอง ไม่ย้อนสถานะที่เลยไปแล้ว
    if (existing.type === 'booking_note' && ['reserved', 'deposit_paid'].includes(existing.status)) {
      update.status = data.depositAmount > 0 ? 'deposit_paid' : 'reserved';
    }

    if (existing.type === 'invoice') {
      const wasPaid = existing.status === 'paid';
      const nowPaid = data.paymentMethod !== 'pending';
      const { Income } = await import('@/models/Income');

      if (!wasPaid && nowPaid) {
        // แก้วิธีชำระจาก "รอชำระ" เป็นวิธีอื่น = ถือว่าจ่ายแล้ว ณ ตอนนี้ — ออก Income เหมือนตอนสร้างใหม่
        update.status = 'paid';
        update.paidAt = new Date();
        await Income.create({
          category: 'Sales',
          description: `ชำระเงินบิล ${existing.docNumber} (${data.customerName})`,
          amount: data.grandTotal,
          incomeDate: existing.issuedAt ?? new Date(),
          note: `อ้างอิงเอกสาร ${existing.docNumber}`,
        });
      } else if (wasPaid && !nowPaid) {
        // ย้อนกลับเป็น "รอชำระ" — ถอนสถานะจ่ายแล้ว + ลบ Income ที่ออกไว้
        update.status = 'unpaid';
        update.paidAt = null;
        await Income.deleteMany({ note: `อ้างอิงเอกสาร ${existing.docNumber}` });
      } else if (wasPaid) {
        // แก้บิลที่จ่ายแล้ว — sync ยอด Income เดิมให้ตรงยอดใหม่ ไม่สร้างซ้ำ
        await Income.updateMany(
          { note: `อ้างอิงเอกสาร ${existing.docNumber}` },
          { $set: { amount: data.grandTotal, description: `ชำระเงินบิล ${existing.docNumber} (${data.customerName})` } },
        );
      }
    }

    // ใบแจ้งหนี้: ยอดรวมเปลี่ยน → คำนวณสถานะชำระครบ/บางส่วนใหม่จากใบรับชำระที่ผูกอยู่
    if (existing.type === 'billing_note' && existing.status !== 'cancelled') {
      const paidAgg = await FinancialDocument.aggregate([
        { $match: { type: 'payment_note', relatedDocId: existing._id } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]);
      const totalPaid = paidAgg[0]?.total ?? 0;
      update.status = totalPaid >= data.grandTotal - 0.01 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
    }

    // ใบรับชำระ: sync Income ที่ออกไว้ + คำนวณสถานะใบแจ้งหนี้ที่ผูกอยู่ใหม่ตามยอดที่แก้
    if (existing.type === 'payment_note') {
      const { Income } = await import('@/models/Income');
      await Income.updateMany(
        { note: `อ้างอิงใบรับชำระ ${existing.docNumber}` },
        { $set: { amount: data.grandTotal } },
      );
      if (existing.relatedDocId) {
        const billing = await FinancialDocument.findById(existing.relatedDocId).lean() as { _id: unknown; grandTotal: number; status: string } | null;
        if (billing && billing.status !== 'cancelled') {
          const otherPaidAgg = await FinancialDocument.aggregate([
            { $match: { type: 'payment_note', relatedDocId: billing._id, _id: { $ne: existing._id } } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } },
          ]);
          const totalPaid = (otherPaidAgg[0]?.total ?? 0) + data.grandTotal;
          const newStatus = totalPaid >= billing.grandTotal - 0.01 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
          await FinancialDocument.findByIdAndUpdate(billing._id, { status: newStatus });
        }
      }
    }

    await FinancialDocument.findByIdAndUpdate(id, update);

    // รายการสินค้าเปลี่ยน → คืนสต๊อกที่ตัดไว้เดิมทั้งหมด แล้วตัดใหม่ตามรายการล่าสุด
    let warnings: string[] = [];
    if (STOCK_DOC_TYPES.includes(existing.type)) {
      await revertStockForDoc(existing.docNumber);
      warnings = await deductStockForDoc(existing.docNumber, existing.relatedDocNumber || undefined, data.items);
    }

    revalidatePath('/admin/documents');
    return { success: true, ...(warnings.length ? { warnings } : {}) };
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

    // ยกเลิกเอกสาร → คืนสต๊อกที่ระบบตัดให้อัตโนมัติตอนสร้าง
    if (status === 'cancelled' && doc?.docNumber) {
      await revertStockForDoc(doc.docNumber);
    }

    if (status === 'paid' && doc) {
      const { Income } = await import('@/models/Income');
      await Income.create({
        category: 'Sales',
        description: `ชำระเงินบิล ${doc.docNumber}`,
        amount: doc.grandTotal,
        incomeDate: doc.issuedAt ?? new Date(),
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

export async function updateDocCost(
  id: string,
  costPrice: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!Number.isFinite(costPrice) || costPrice < 0) {
      return { success: false, error: 'ต้นทุนต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป' };
    }
    await connectDB();
    await FinancialDocument.findByIdAndUpdate(id, { costPrice });
    revalidatePath('/admin/documents');
    return { success: true };
  } catch (err) {
    console.error('[updateDocCost]', err);
    return { success: false, error: 'ไม่สามารถบันทึกต้นทุนได้' };
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
      // คืนสต๊อกที่ระบบตัดให้อัตโนมัติของใบนี้
      await revertStockForDoc(doc.docNumber);
    }
    revalidatePath('/admin/documents');
    return { success: true };
  } catch (err) {
    console.error('[deleteDocument]', err);
    return { success: false, error: 'ไม่สามารถลบเอกสารได้' };
  }
}
