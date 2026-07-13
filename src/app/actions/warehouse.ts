'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { StockMovement } from '@/models/StockMovement';

type MoveResult = { error?: string };

async function createMovement(
  productId: string,
  type: 'in' | 'out' | 'adjust',
  qty: number,
  refNo: string,
  note: string,
): Promise<MoveResult> {
  await connectDB();

  const product = await Product.findById(productId).lean() as { stock?: number; brand?: string; model?: string; size?: string } | null;
  if (!product) return { error: 'ไม่พบสินค้า' };

  const stockBefore = product.stock ?? 0;
  let stockAfter: number;
  let stockDelta: number;

  if (type === 'in') {
    stockDelta = qty;
    stockAfter = stockBefore + qty;
  } else if (type === 'out') {
    // เบิกเกินสต๊อกได้ — ติดลบไว้ก่อน (เคสขายก่อนของเข้า) สต๊อกจะกลับมาบวกเมื่อรับของจาก PO
    stockDelta = -qty;
    stockAfter = stockBefore - qty;
  } else {
    // adjust: qty is the new absolute stock value
    stockDelta = qty - stockBefore;
    stockAfter = qty;
  }

  const productName = `${product.brand ?? ''} ${product.model ?? ''} ${product.size ?? ''}`.trim();

  await Product.findByIdAndUpdate(productId, { $inc: { stock: stockDelta } });
  await StockMovement.create({
    productId,
    productName,
    type,
    qty: Math.abs(type === 'adjust' ? stockDelta : qty),
    stockBefore,
    stockAfter,
    refNo,
    note,
  });

  revalidatePath('/admin/warehouse');
  revalidatePath('/admin/products');
  return {};
}

export async function receiveStock(
  productId: string,
  qty: number,
  refNo: string,
  note: string,
): Promise<MoveResult> {
  try {
    return await createMovement(productId, 'in', qty, refNo, note);
  } catch (err) {
    console.error('[receiveStock]', err);
    return { error: 'ไม่สามารถรับสินค้าเข้าได้' };
  }
}

export async function disburseStock(
  productId: string,
  qty: number,
  refNo: string,
  note: string,
): Promise<MoveResult> {
  try {
    return await createMovement(productId, 'out', qty, refNo, note);
  } catch (err) {
    console.error('[disburseStock]', err);
    return { error: 'ไม่สามารถเบิกสินค้าออกได้' };
  }
}

// ดึงรายการสินค้าจากใบ PO ตามเลขที่พิมพ์ในช่องอ้างอิง — เฉพาะบรรทัดที่ผูก ID สินค้าไว้
export async function lookupPOItems(refNo: string): Promise<{
  error?: string;
  poNumber?: string;
  items?: { productId: string; productName: string; qty: number }[];
  skipped?: string[]; // บรรทัดที่ไม่ได้ผูก ID สินค้า
}> {
  try {
    await connectDB();
    const { PurchaseOrder } = await import('@/models/PurchaseOrder');
    const po = await PurchaseOrder.findOne({ poNumber: new RegExp(`^${refNo.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
      .select('poNumber status items').lean() as {
        poNumber: string; status: string;
        items: { productId?: unknown; productName: string; qty: number }[];
      } | null;
    if (!po) return { error: 'ไม่พบใบสั่งซื้อเลขนี้' };
    if (po.status === 'cancelled') return { error: `ใบสั่งซื้อ ${po.poNumber} ถูกยกเลิกแล้ว` };

    const items = po.items
      .filter(i => i.productId)
      .map(i => ({ productId: String(i.productId), productName: i.productName ?? '', qty: i.qty ?? 0 }));
    const skipped = po.items.filter(i => !i.productId).map(i => i.productName);
    if (items.length === 0) return { error: 'ใบนี้ไม่มีรายการที่ผูก ID สินค้าไว้ — ต้องเลือกสินค้าเอง' };

    return { poNumber: po.poNumber, items, skipped: skipped.length ? skipped : undefined };
  } catch (err) {
    console.error('[lookupPOItems]', err);
    return { error: 'ค้นหาใบสั่งซื้อไม่สำเร็จ' };
  }
}

// รับเข้า/เบิกออกหลายรายการในครั้งเดียว (ใช้กับรายการที่ดึงมาจาก PO)
export async function moveStockBulk(
  type: 'in' | 'out',
  items: { productId: string; productName?: string; qty: number }[],
  refNo: string,
  note: string,
): Promise<{ error?: string; warnings?: string[] }> {
  try {
    if (items.length === 0) return { error: 'ไม่มีรายการ' };
    const warnings: string[] = [];
    for (const item of items) {
      if (item.qty <= 0) continue;
      const res = await createMovement(item.productId, type, item.qty, refNo, note);
      if (res.error) warnings.push(item.productName ? `${item.productName}: ${res.error}` : res.error);
    }
    return warnings.length ? { warnings } : {};
  } catch (err) {
    console.error('[moveStockBulk]', err);
    return { error: 'บันทึกรายการไม่สำเร็จ' };
  }
}

export async function adjustStock(
  productId: string,
  newQty: number,
  note: string,
): Promise<MoveResult> {
  try {
    if (newQty < 0) return { error: 'จำนวนสต๊อกต้องไม่ติดลบ' };
    return await createMovement(productId, 'adjust', newQty, '', note);
  } catch (err) {
    console.error('[adjustStock]', err);
    return { error: 'ไม่สามารถปรับสต๊อกได้' };
  }
}
