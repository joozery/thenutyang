'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { StockReturn } from '@/models/StockReturn';
import { generateReturnNumber } from '@/lib/stock-return';

export type ReturnPayload = {
  poId: string;
  returnDate: string;
  reason: string;
  refundAmount: number;
  note: string;
};

export async function createStockReturn(
  payload: ReturnPayload,
): Promise<{ ok: boolean; returnNumber?: string; error?: string; warnings?: string[] }> {
  try {
    await connectDB();

    const po = await PurchaseOrder.findById(payload.poId).lean() as {
      poNumber: string;
      status: string;
      supplierSnapshot: { name: string };
      items: { productId?: string; productName: string; unit: string; qty: number; unitPrice: number; lineTotal: number }[];
      grandTotal: number;
    } | null;

    if (!po) return { ok: false, error: 'ไม่พบใบสั่งซื้อ' };
    if (po.status !== 'received') return { ok: false, error: 'สามารถคืนสินค้าได้เฉพาะ PO ที่รับสินค้าแล้วเท่านั้น' };

    const returnNumber = await generateReturnNumber();
    const warnings: string[] = [];

    // คืน stock แต่ละรายการ
    const { Product } = await import('@/models/Product');
    const { StockMovement } = await import('@/models/StockMovement');

    for (const item of po.items) {
      if (!item.productId) {
        warnings.push(`"${item.productName}" ไม่ได้ผูก ID — กรุณาปรับสต๊อกเองใน Warehouse`);
        continue;
      }
      const product = await Product.findById(item.productId).lean() as { stock?: number; brand?: string; model?: string; size?: string } | null;
      if (!product) { warnings.push(`ไม่พบสินค้า "${item.productName}"`); continue; }

      const stockBefore = product.stock ?? 0;
      const returnQty   = Math.min(item.qty, stockBefore);
      const productName = `${product.brand ?? ''} ${product.model ?? ''} ${product.size ?? ''}`.trim();

      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -returnQty } });
      await StockMovement.create({
        productId: item.productId, productName, type: 'out',
        qty: returnQty, stockBefore, stockAfter: stockBefore - returnQty,
        refNo: returnNumber, note: `คืนสินค้า ${returnNumber} (อ้างอิง ${po.poNumber})`,
      });
    }

    // สร้างใบคืนสินค้า
    await StockReturn.create({
      returnNumber,
      poId:         payload.poId,
      poNumber:     po.poNumber,
      supplier:     po.supplierSnapshot?.name ?? '',
      returnDate:   new Date(payload.returnDate),
      reason:       payload.reason,
      items:        po.items.map(i => ({
        productId:   i.productId ?? null,
        productName: i.productName,
        unit:        i.unit,
        qty:         i.qty,
        unitPrice:   i.unitPrice,
        lineTotal:   i.lineTotal,
      })),
      subtotal:     po.grandTotal,
      refundAmount: payload.refundAmount,
      refundStatus: 'pending',
      note:         payload.note,
    });

    // อัปเดต PO เป็น cancelled
    await PurchaseOrder.findByIdAndUpdate(payload.poId, { status: 'cancelled' });

    revalidatePath('/admin/purchasing');
    revalidatePath('/admin/warehouse');
    return { ok: true, returnNumber, warnings: warnings.length ? warnings : undefined };
  } catch (err) {
    console.error('[createStockReturn]', err);
    return { ok: false, error: 'ไม่สามารถสร้างใบคืนสินค้าได้' };
  }
}

export async function markRefundReceived(
  returnId: string,
  receivedDate: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await connectDB();

    const ret = await StockReturn.findById(returnId).lean() as {
      returnNumber: string;
      supplier: string;
      refundAmount: number;
      poNumber: string;
    } | null;
    if (!ret) return { ok: false, error: 'ไม่พบใบคืนสินค้า' };
    if (!ret.refundAmount) return { ok: false, error: 'ยอดเงินคืนเป็น 0' };

    // บันทึก Income
    const { Income } = await import('@/models/Income');
    const income = await Income.create({
      category:   'คืนเงินจากซัพพลายเออร์',
      amount:     ret.refundAmount,
      incomeDate: new Date(receivedDate),
      note:       `รับเงินคืนจาก ${ret.supplier} (${ret.returnNumber} อ้างอิง ${ret.poNumber})`,
    });

    await StockReturn.findByIdAndUpdate(returnId, {
      refundStatus:     'received',
      refundReceivedAt: new Date(receivedDate),
      incomeId:         income._id,
    });

    revalidatePath('/admin/purchasing');
    revalidatePath('/admin/finance');
    return { ok: true };
  } catch (err) {
    console.error('[markRefundReceived]', err);
    return { ok: false, error: 'บันทึกไม่สำเร็จ' };
  }
}
