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

export type StockListOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: 'all' | 'low' | 'ok';
  sort?: 'none' | 'desc' | 'asc';
};

export type StockListResult = {
  items: StockItem[];
  totalItems: number;
  page: number;
  pageSize: number;
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
    Product.find({}, { brand: 1, model: 1, size: 1, stock: 1, priceCash: 1, image: 1 }).sort({ brand: 1, model: 1, size: 1 }).lean(),
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

export async function getStockItemsPage(options: StockListOptions = {}): Promise<StockListResult> {
  await connectDB();
  const pageSize = Math.max(1, Math.min(options.pageSize ?? 10, 100));
  const requestedPage = Math.max(1, options.page ?? 1);
  const query: Record<string, unknown> = {};
  const and: Record<string, unknown>[] = [];
  const search = options.search?.trim();
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    and.push({ $or: [{ brand: rx }, { model: rx }, { size: rx }] });
  }
  if (options.filter === 'low') query.stock = { $lt: MIN_STOCK };
  if (options.filter === 'ok') query.stock = { $gte: MIN_STOCK };
  if (and.length) query.$and = and;
  const sort: Record<string, 1 | -1> = options.sort === 'desc' ? { stock: -1, brand: 1, model: 1 } : options.sort === 'asc' ? { stock: 1, brand: 1, model: 1 } : { brand: 1, model: 1, size: 1 };
  const projection = { brand: 1, model: 1, size: 1, stock: 1, priceCash: 1, image: 1 };
  const [totalItems, docs] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query, projection).sort(sort).skip((requestedPage - 1) * pageSize).limit(pageSize).lean(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const pageDocs = page === requestedPage ? docs : await Product.find(query, projection).sort(sort).skip((page - 1) * pageSize).limit(pageSize).lean();
  const brands = await Brand.find({}).select('name logo').lean();
  const brandMap = new Map(brands.map((b) => [String(b.name).toUpperCase(), b.logo as string]));
  const items = pageDocs.map((d) => {
    const item = normalizeStock(d);
    const logo = brandMap.get(item.brand.toUpperCase());
    return logo ? { ...item, brandLogo: logo } : item;
  });
  return { items, totalItems, page, pageSize };
}

export async function getLowStockItems(limit = 100): Promise<StockItem[]> {
  await connectDB();
  const docs = await Product.find({ stock: { $lt: MIN_STOCK } }, { brand: 1, model: 1, size: 1, stock: 1, priceCash: 1, image: 1 }).sort({ stock: 1, brand: 1 }).limit(limit).lean();
  return docs.map(normalizeStock);
}

export async function getStockMovements(limit = 50): Promise<MovementRow[]> {
  await connectDB();
  const docs = await StockMovement.find({}, { createdAt: 1, type: 1, productId: 1, productName: 1, qty: 1, stockAfter: 1, refNo: 1, note: 1 }).sort({ createdAt: -1 }).limit(limit).lean();

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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [productStats, movementStats] = await Promise.all([
    Product.aggregate([
      { $group: {
        _id: null,
        totalValue: { $sum: { $multiply: [{ $ifNull: ['$stock', 0] }, { $ifNull: ['$priceCash', 0] }] } },
        totalItems: { $sum: { $ifNull: ['$stock', 0] } },
        lowStockCount: { $sum: { $cond: [{ $lt: [{ $ifNull: ['$stock', 0] }, MIN_STOCK] }, 1, 0] } },
      } },
    ]),
    StockMovement.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: '$type', total: { $sum: { $ifNull: ['$qty', 0] } } } },
    ]),
  ]);
  const movementMap = new Map(movementStats.map((row) => [row._id, row.total]));
  const totals = productStats[0] ?? {};

  return {
    totalValue: totals.totalValue ?? 0,
    totalItems: totals.totalItems ?? 0,
    lowStockCount: totals.lowStockCount ?? 0,
    todayIn: movementMap.get('in') ?? 0,
    todayOut: movementMap.get('out') ?? 0,
  };
}
