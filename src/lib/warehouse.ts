import connectDB from './mongodb';
import { Product } from '@/models/Product';
import { StockMovement } from '@/models/StockMovement';

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
};

export type MovementRow = {
  id:          string;
  date:        string;
  type:        'in' | 'out' | 'adjust';
  productName: string;
  qty:         number;
  stockAfter:  number;
  refNo:       string;
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
    productName: d.productName ?? '',
    qty:         d.qty         ?? 0,
    stockAfter:  d.stockAfter  ?? 0,
    refNo:       d.refNo       ?? '',
    note:        d.note        ?? '',
  };
}

export async function getStockItems(): Promise<StockItem[]> {
  await connectDB();
  const docs = await Product.find({}).sort({ brand: 1, model: 1, size: 1 }).lean();
  return docs.map(normalizeStock);
}

export async function getStockMovements(limit = 50): Promise<MovementRow[]> {
  await connectDB();
  const docs = await StockMovement.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  return docs.map(normalizeMovement);
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
