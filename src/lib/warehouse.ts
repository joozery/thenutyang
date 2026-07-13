import connectDB from './mongodb';
import { Product } from '@/models/Product';
import { StockMovement } from '@/models/StockMovement';
import { Brand } from '@/models/Brand';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { FinancialDocument } from '@/models/FinancialDocument';
import { StockReturn } from '@/models/StockReturn';

export const MIN_STOCK = 8;

export type StockItem = {
  id:         string;
  label:      string;
  brand:      string;
  model:      string;
  size:       string;
  stock:      number;
  priceCash:  number;
  stockValue: number;
  image:      string;
  isLow:      boolean;
  brandLogo?: string;
};

export type MovementRow = {
  id:          string;
  date:        string;
  type:        'in' | 'out' | 'adjust';
  productId:   string;
  productName: string;
  qty:         number;
  stockAfter:  number;
  refNo:       string;
  refHref?:    string;
  refParty?:   string; // ชื่อลูกค้า (จาก INV) หรือผู้ขาย (จาก PO)
  note:        string;
};

export type WarehouseStats = {
  totalValue:    number;
  totalItems:    number;
  lowStockCount: number;
  todayIn:       number;
  todayOut:      number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeStock(d: any): StockItem {
  const stock = d.stock ?? 0;
  const price = d.priceCash ?? 0;
  return {
    id:         String(d._id),
    label:      `${d.brand} ${d.model} ${d.size}`.trim(),
    brand:      d.brand      ?? '',
    model:      d.model      ?? '',
    size:       d.size       ?? '',
    stock,
    priceCash:  price,
    stockValue: stock * price,
    image:      d.image      ?? '/yang.png',
    isLow:      stock < MIN_STOCK,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMovement(d: any): MovementRow {
  return {
    id:          String(d._id),
    date:        d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt ?? ''),
    type:        d.type        ?? 'in',
    productId:   String(d.productId ?? ''),
    productName: d.productName ?? '',
    qty:         d.qty         ?? 0,
    stockAfter:  d.stockAfter  ?? 0,
    refNo:       d.refNo       ?? '',
    note:        d.note        ?? '',
  };
}

export async function getStockItems(): Promise<StockItem[]> {
  await connectDB();
  const [docs, brands] = await Promise.all([
    Product.find({}).sort({ brand: 1, model: 1, size: 1 }).lean(),
    Brand.find({}).lean(),
  ]);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brandMap = new Map<string, string>(brands.map((b: any) => [String(b.name).toUpperCase(), b.logo]));

  return docs.map(d => {
    const item = normalizeStock(d);
    const logo = brandMap.get(item.brand.toUpperCase());
    if (logo) {
      item.brandLogo = logo;
    }
    return item;
  });
}

export async function getStockMovements(limit = 50): Promise<MovementRow[]> {
  await connectDB();
  const docs = await StockMovement.find({}).sort({ createdAt: -1 }).limit(limit).lean();

  // resolve refNo → link ไปยังเอกสารต้นทาง (PO / เอกสารการเงิน / ใบคืนสินค้า)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refNos = [...new Set(docs.map((d: any) => d.refNo).filter(Boolean))] as string[];
  const refHref = new Map<string, string>();
  const refParty = new Map<string, string>();
  if (refNos.length > 0) {
    const [pos, finDocs, returns] = await Promise.all([
      PurchaseOrder.find({ poNumber: { $in: refNos } }).select('poNumber supplierSnapshot.name').lean(),
      FinancialDocument.find({ docNumber: { $in: refNos } }).select('docNumber customerName').lean(),
      StockReturn.find({ returnNumber: { $in: refNos } }).select('returnNumber poId supplier').lean(),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of pos as any[]) {
      refHref.set(p.poNumber, `/admin/purchasing/${p._id}/edit`);
      if (p.supplierSnapshot?.name) refParty.set(p.poNumber, p.supplierSnapshot.name);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const f of finDocs as any[]) {
      refHref.set(f.docNumber, `/admin/documents/${f._id}/edit`);
      if (f.customerName) refParty.set(f.docNumber, f.customerName);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const r of returns as any[]) {
      if (r.poId && !refHref.has(r.returnNumber)) refHref.set(r.returnNumber, `/admin/purchasing/${r.poId}/edit`);
      if (r.supplier && !refParty.has(r.returnNumber)) refParty.set(r.returnNumber, r.supplier);
    }
  }

  return docs.map(d => {
    const row = normalizeMovement(d);
    const href = refHref.get(row.refNo);
    if (href) row.refHref = href;
    const party = refParty.get(row.refNo);
    if (party) row.refParty = party;
    return row;
  });
}

export async function getWarehouseStats(): Promise<WarehouseStats> {
  await connectDB();

  const products = await Product.find({}).lean();
  const totalValue    = products.reduce((s: number, p: any) => s + (p.stock ?? 0) * (p.priceCash ?? 0), 0);
  const totalItems    = products.reduce((s: number, p: any) => s + (p.stock ?? 0), 0);
  const lowStockCount = products.filter((p: any) => (p.stock ?? 0) < MIN_STOCK).length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayMoves = await StockMovement.find({ createdAt: { $gte: todayStart } }).lean();
  const todayIn  = todayMoves.filter((m: any) => m.type === 'in').reduce((s: number, m: any) => s + (m.qty ?? 0), 0);
  const todayOut = todayMoves.filter((m: any) => m.type === 'out').reduce((s: number, m: any) => s + (m.qty ?? 0), 0);

  return { totalValue, totalItems, lowStockCount, todayIn, todayOut };
}
