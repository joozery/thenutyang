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
    if (stockBefore < qty) return { error: `สต๊อกไม่พอ (มีอยู่ ${stockBefore} ชิ้น)` };
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
