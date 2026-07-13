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
    productId?: string; productName: string; unit: string;
    qty: number; unitPrice: number; discount: number; discountType: 'pct' | 'amt';
    year: string; lineTotal: number;
  }[];
  reference?:      string;
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
  vatType:         'included' | 'excluded' | 'none';
  isReceived?:     boolean;
  orderDate?:      string;
};

async function savePO(data: POFormPayload, status: 'pending' | 'draft') {
  await connectDB();
  const poNumber = await generatePONumber();

  const po = await PurchaseOrder.create({
    poNumber,
    poType: data.poType,
    supplierId: data.supplierId || undefined,
    supplierSnapshot: data.supplierSnapshot,
    reference:  data.reference ?? '',
    createdAt: data.orderDate ? new Date(data.orderDate) : new Date(),
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
    vatType:         data.vatType,
    status,
  });

  revalidatePath('/admin/purchasing');
  return { poNumber, id: String(po._id) };
}

export async function createPO(
  data: POFormPayload,
): Promise<{ success: boolean; poNumber?: string; error?: string }> {
  try {
    const { poNumber, id } = await savePO(data, 'pending');
    if (data.isReceived) {
      await receivePO(id);
    }
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
    const { poNumber } = await savePO(data, 'draft');
    return { success: true, poNumber };
  } catch (err) {
    console.error('[saveDraftPO]', err);
    return { success: false, error: 'ไม่สามารถบันทึกร่างได้ กรุณาลองใหม่' };
  }
}

export async function updatePO(
  id: string,
  data: POFormPayload,
  status: 'pending' | 'draft',
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    // ใบที่รับสินค้าแล้ว/ยกเลิกแล้ว ต้องคงสถานะเดิมไว้ — ห้ามรีเซ็ตกลับเป็น "รอรับสินค้า"
    // (เดิมการกดแก้ไขใบที่รับแล้ว ทำให้ปุ่มรับสินค้าโผล่มาอีกและกดรับซ้ำ สต๊อกบวกสองรอบ)
    const existing = await PurchaseOrder.findById(id).select('status').lean() as { status?: string } | null;
    if (!existing) return { success: false, error: 'ไม่พบใบสั่งซื้อ' };
    if (existing.status === 'received' || existing.status === 'cancelled') {
      status = existing.status as typeof status;
    }

    await PurchaseOrder.findByIdAndUpdate(id, {
      poType: data.poType,
      supplierId: data.supplierId || undefined,
      supplierSnapshot: data.supplierSnapshot,
      reference:  data.reference ?? '',
      ...(data.orderDate && { createdAt: new Date(data.orderDate) }),
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
      vatType:         data.vatType,
      status,
    });
    revalidatePath('/admin/purchasing');
    return { success: true };
  } catch (err) {
    console.error('[updatePO]', err);
    return { success: false, error: 'ไม่สามารถบันทึกได้' };
  }
}

export async function receivePO(id: string): Promise<{
  error?: string;
  warnings?: string[];
  // ถ้า PO อ้างอิงใบ INV (ขายก่อน–สั่งของทีหลัง) ส่งข้อมูลกลับไปให้หน้าจอถามว่าเบิกออกให้บิลเลยไหม
  invoice?: { docNumber: string; customerName: string };
}> {
  try {
    await connectDB();
    const po = await PurchaseOrder.findById(id).lean() as { poNumber: string; status?: string; reference?: string; items: { productId?: string; productName: string; qty: number }[] } | null;
    if (!po) return { error: 'ไม่พบใบสั่งซื้อ' };
    // กันรับซ้ำ — รับได้ครั้งเดียว (กดรัว/แก้ไขแล้วกดรับใหม่ จะไม่บวกสต๊อกซ้ำ)
    if (po.status === 'received') return { error: `${po.poNumber} รับสินค้าไปแล้ว` };
    if (po.status === 'cancelled') return { error: `${po.poNumber} ถูกยกเลิกแล้ว` };

    await PurchaseOrder.findByIdAndUpdate(id, { status: 'received' });

    const { Product } = await import('@/models/Product');
    const { StockMovement } = await import('@/models/StockMovement');
    const warnings: string[] = [];

    for (const item of po.items) {
      if (!item.productId) {
        warnings.push(`"${item.productName}" ไม่ได้ผูก ID สินค้า — กรุณาบวกสต๊อกเองใน Warehouse`);
        continue;
      }
      const product = await Product.findById(item.productId).lean() as { stock?: number; brand?: string; model?: string; size?: string } | null;
      if (!product) {
        warnings.push(`ไม่พบสินค้า "${item.productName}" ใน DB`);
        continue;
      }
      const stockBefore = product.stock ?? 0;
      const stockAfter  = stockBefore + item.qty;
      const productName = `${product.brand ?? ''} ${product.model ?? ''} ${product.size ?? ''}`.trim();
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } });
      await StockMovement.create({
        productId: item.productId, productName, type: 'in',
        qty: item.qty, stockBefore, stockAfter,
        refNo: po.poNumber, note: `รับสินค้าจาก ${po.poNumber}`,
      });
    }

    revalidatePath('/admin/purchasing');
    revalidatePath('/admin/warehouse');

    // เช็คว่าเลขอ้างอิงของ PO เป็นใบ INV ในระบบไหม — ถ้าใช่ ให้หน้าจอถามต่อว่าเบิกออกให้บิลเลยไหม
    // (ยกเว้นมีการเบิกออกอ้างอิงบิลนั้นไปแล้ว เช่นใบ INV ที่ตัดสต๊อกอัตโนมัติตอนสร้าง — ไม่ถามซ้ำ)
    let invoice: { docNumber: string; customerName: string } | undefined;
    if (po.reference) {
      const { FinancialDocument } = await import('@/models/FinancialDocument');
      const refDoc = await FinancialDocument.findOne({ docNumber: po.reference })
        .select('docNumber customerName').lean() as { docNumber: string; customerName: string } | null;
      if (refDoc) {
        const priorOut = await StockMovement.findOne({ refNo: refDoc.docNumber, type: 'out' }).lean();
        if (!priorOut) invoice = { docNumber: refDoc.docNumber, customerName: refDoc.customerName ?? '' };
      }
    }

    return { ...(warnings.length ? { warnings } : {}), ...(invoice ? { invoice } : {}) };
  } catch (err) {
    console.error('[receivePO]', err);
    return { error: 'ไม่สามารถอัปเดตสถานะได้' };
  }
}

// ดึงรายการสินค้าจากใบ INV/เอกสารการเงิน มาเป็นบรรทัดใน PO (เคสขายก่อน–ของหมด–เปิด PO ตาม)
// ได้เฉพาะบรรทัดที่ผูก ID สินค้าไว้ตอนออกใบ — ราคาใช้ราคาทุนของสินค้า ไม่ใช่ราคาขายในใบ
export async function lookupInvoiceItems(refNo: string): Promise<{
  error?: string;
  docNumber?: string;
  customerName?: string;
  items?: { productId: string; productName: string; qty: number; unitPrice: number; year: string }[];
  skipped?: string[];
}> {
  try {
    await connectDB();
    const { FinancialDocument } = await import('@/models/FinancialDocument');
    const { Product } = await import('@/models/Product');
    const doc = await FinancialDocument.findOne({ docNumber: new RegExp(`^${refNo.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
      .select('docNumber customerName status items').lean() as {
        docNumber: string; customerName: string; status: string;
        items: { productId?: unknown; description: string; qty: number }[];
      } | null;
    if (!doc) return { error: 'ไม่พบเอกสารเลขนี้' };
    if (doc.status === 'cancelled') return { error: `เอกสาร ${doc.docNumber} ถูกยกเลิกแล้ว` };

    const linked = doc.items.filter(i => i.productId);
    const skipped = doc.items.filter(i => !i.productId).map(i => i.description);
    if (linked.length === 0) return { error: 'ใบนี้ไม่มีรายการที่ผูกสินค้าในคลังไว้ — ต้องเลือกสินค้าเอง' };

    const items: { productId: string; productName: string; qty: number; unitPrice: number; year: string }[] = [];
    for (const it of linked) {
      const p = await Product.findById(it.productId).lean() as { brand?: string; model?: string; size?: string; costPrice?: number; year?: string } | null;
      items.push({
        productId:   String(it.productId),
        productName: p ? `${p.brand ?? ''} ${p.model ?? ''} ${p.size ?? ''}`.trim() : it.description,
        qty:         it.qty ?? 1,
        unitPrice:   p?.costPrice ?? 0,
        year:        p?.year ?? '',
      });
    }

    return { docNumber: doc.docNumber, customerName: doc.customerName ?? '', items, skipped: skipped.length ? skipped : undefined };
  } catch (err) {
    console.error('[lookupInvoiceItems]', err);
    return { error: 'ค้นหาเอกสารไม่สำเร็จ' };
  }
}

// เบิกสินค้าออกให้บิลที่ PO อ้างอิงถึง (เคสขายก่อน–ของหมด–สั่ง PO ทีหลัง)
// เรียกหลังรับสินค้าแล้ว: ตัดสต๊อกตามรายการใน PO และลงประวัติอ้างอิงเลขใบ INV
export async function disbursePOToInvoice(id: string): Promise<{ error?: string; warnings?: string[] }> {
  try {
    await connectDB();
    const po = await PurchaseOrder.findById(id).lean() as {
      poNumber: string; reference?: string; status: string;
      items: { productId?: string; productName: string; qty: number }[];
    } | null;
    if (!po) return { error: 'ไม่พบใบสั่งซื้อ' };
    if (po.status !== 'received') return { error: 'ต้องรับสินค้าก่อนจึงจะเบิกออกได้' };
    if (!po.reference) return { error: 'ใบสั่งซื้อนี้ไม่มีเลขอ้างอิงบิล' };

    const { Product } = await import('@/models/Product');
    const { StockMovement } = await import('@/models/StockMovement');

    // กันเบิกซ้ำ — ถ้ามีการเบิกออกอ้างอิงบิลนี้แล้ว (จาก PO นี้ หรือระบบตัดอัตโนมัติตอนออกใบ) ไม่ทำซ้ำ
    const disburseNote = `เบิกออกให้ ${po.reference} (จาก ${po.poNumber})`;
    const already = await StockMovement.findOne({ refNo: po.reference, type: 'out' }).lean();
    if (already) return { error: `มีการเบิกออกอ้างอิง ${po.reference} ไปแล้ว` };

    const warnings: string[] = [];
    for (const item of po.items) {
      if (!item.productId) {
        warnings.push(`"${item.productName}" ไม่ได้ผูก ID สินค้า — กรุณาเบิกออกเองใน Warehouse`);
        continue;
      }
      const product = await Product.findById(item.productId).lean() as { stock?: number; brand?: string; model?: string; size?: string } | null;
      if (!product) {
        warnings.push(`ไม่พบสินค้า "${item.productName}" ใน DB`);
        continue;
      }
      const stockBefore = product.stock ?? 0;
      const outQty = Math.min(item.qty, stockBefore);
      if (outQty < item.qty) warnings.push(`"${item.productName}" สต๊อกไม่พอ เบิกได้ ${outQty}/${item.qty}`);
      if (outQty === 0) continue;
      const stockAfter  = stockBefore - outQty;
      const productName = `${product.brand ?? ''} ${product.model ?? ''} ${product.size ?? ''}`.trim();
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -outQty } });
      await StockMovement.create({
        productId: item.productId, productName, type: 'out',
        qty: outQty, stockBefore, stockAfter,
        refNo: po.reference, note: disburseNote,
      });
    }

    revalidatePath('/admin/purchasing');
    revalidatePath('/admin/warehouse');
    return warnings.length ? { warnings } : {};
  } catch (err) {
    console.error('[disbursePOToInvoice]', err);
    return { error: 'ไม่สามารถเบิกสินค้าออกได้' };
  }
}

export async function cancelPO(id: string): Promise<{ error?: string; warnings?: string[] }> {
  try {
    await connectDB();
    const po = await PurchaseOrder.findById(id).lean() as { poNumber: string; status: string; items: { productId?: string; productName: string; qty: number }[] } | null;
    if (!po) return { error: 'ไม่พบใบสั่งซื้อ' };

    const wasReceived = po.status === 'received';
    await PurchaseOrder.findByIdAndUpdate(id, { status: 'cancelled' });

    const warnings: string[] = [];
    if (wasReceived) {
      const { Product } = await import('@/models/Product');
      const { StockMovement } = await import('@/models/StockMovement');

      for (const item of po.items) {
        if (!item.productId) {
          warnings.push(`"${item.productName}" ไม่ได้ผูก ID — กรุณาลบสต๊อกเองใน Warehouse`);
          continue;
        }
        const product = await Product.findById(item.productId).lean() as { stock?: number; brand?: string; model?: string; size?: string } | null;
        if (!product) {
          warnings.push(`ไม่พบสินค้า "${item.productName}" ใน DB`);
          continue;
        }
        const stockBefore = product.stock ?? 0;
        const returnQty   = Math.min(item.qty, stockBefore);
        const stockAfter  = stockBefore - returnQty;
        const productName = `${product.brand ?? ''} ${product.model ?? ''} ${product.size ?? ''}`.trim();
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -returnQty } });
        await StockMovement.create({
          productId: item.productId, productName, type: 'out',
          qty: returnQty, stockBefore, stockAfter,
          refNo: po.poNumber, note: `คืนสินค้าจากยกเลิก ${po.poNumber}`,
        });
      }
    }

    revalidatePath('/admin/purchasing');
    revalidatePath('/admin/warehouse');
    return warnings.length ? { warnings } : {};
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
