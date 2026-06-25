import connectDB from './mongodb';
import { StockReturn } from '@/models/StockReturn';

export type StockReturnRow = {
  id: string;
  returnNumber: string;
  poId: string;
  poNumber: string;
  supplier: string;
  returnDate: string;
  reason: string;
  items: { productName: string; unit: string; qty: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  refundAmount: number;
  refundStatus: 'pending' | 'received';
  refundReceivedAt: string;
  note: string;
  createdAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(d: any): StockReturnRow {
  return {
    id:           String(d._id),
    returnNumber: d.returnNumber ?? '',
    poId:         String(d.poId),
    poNumber:     d.poNumber ?? '',
    supplier:     d.supplier ?? '',
    returnDate:   d.returnDate instanceof Date ? d.returnDate.toISOString().slice(0, 10) : String(d.returnDate ?? '').slice(0, 10),
    reason:       d.reason ?? '',
    items:        (d.items ?? []).map((i: any) => ({
      productName: i.productName ?? '',
      unit:        i.unit ?? 'เส้น',
      qty:         i.qty ?? 0,
      unitPrice:   i.unitPrice ?? 0,
      lineTotal:   i.lineTotal ?? 0,
    })),
    subtotal:     d.subtotal ?? 0,
    refundAmount: d.refundAmount ?? 0,
    refundStatus: d.refundStatus ?? 'pending',
    refundReceivedAt: d.refundReceivedAt ? new Date(d.refundReceivedAt).toISOString().slice(0, 10) : '',
    note:         d.note ?? '',
    createdAt:    d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt ?? ''),
  };
}

export async function getStockReturns(): Promise<StockReturnRow[]> {
  await connectDB();
  const docs = await StockReturn.find().sort({ createdAt: -1 }).lean();
  return docs.map(normalize);
}

export async function getStockReturnByPO(poId: string): Promise<StockReturnRow | null> {
  await connectDB();
  const doc = await StockReturn.findOne({ poId }).lean();
  return doc ? normalize(doc) : null;
}

async function generateReturnNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GRN-${year}-`;
  const latest = await StockReturn.findOne(
    { returnNumber: { $regex: `^${prefix}` } },
    { returnNumber: 1 },
  ).sort({ returnNumber: -1 }).lean() as { returnNumber?: string } | null;
  if (!latest) return `${prefix}001`;
  const seq = parseInt(latest.returnNumber?.split('-')[2] ?? '0', 10);
  return `${prefix}${String(seq + 1).padStart(3, '0')}`;
}

export { generateReturnNumber };
