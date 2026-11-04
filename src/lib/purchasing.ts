import connectDB from './mongodb';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { Supplier } from '@/models/Supplier';
import { FinancialDocument } from '@/models/FinancialDocument';

export type POStatusThai = 'ร่าง' | 'รอรับสินค้า' | 'รับสินค้าแล้ว' | 'ยกเลิก';

const STATUS_MAP: Record<string, POStatusThai> = {
  draft:     'ร่าง',
  pending:   'รอรับสินค้า',
  received:  'รับสินค้าแล้ว',
  cancelled: 'ยกเลิก',
};

export type POItem = {
  productId?:  string;
  productName: string;
  unit:        string;
  qty:         number;
  unitPrice:   number;
  discount:    number;
  discountType: 'pct' | 'amt';
  year:        string;
  lineTotal:   number;
};

export type PORow = {
  id:        string;
  poNumber:  string;
  poType:    'standard' | 'urgent';
  supplier:  string;
  supplierSnapshot: {
    name: string; address: string; contact: string;
    phone: string; email: string; taxId: string;
  };
  orderDate:    string;
  dueDate:      string;
  items:        POItem[];
    subtotal:     number;
  totalDiscount:number;
  vat:          number;
  grandTotal:   number;
  vatType:      'included' | 'excluded' | 'none';
  paymentTerm:  string;
  paymentMethod:string;
  notes:        string;
  status:       POStatusThai;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  amountPaid:   number;
  paymentDate?: string;
  reference:    string;
  // ถ้าเลขอ้างอิงตรงกับเอกสารการเงิน (เช่นใบ INV ที่ขายไปก่อนแล้วค่อยสั่งของ) จะแนบข้อมูลใบนั้นมาด้วย
  refDoc?:      { id: string; docNumber: string; customerName: string };
};

export type SupplierRow = {
  id:      string;
  name:    string;
  address: string;
  contact: string;
  phone:   string;
  email:   string;
  taxId:   string;
};

export type PurchaseListOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type PurchaseListResult = {
  orders: PORow[];
  totalItems: number;
  page: number;
  pageSize: number;
  summary: { pending: number; received: number; totalValue: number; suppliers: number };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDoc(d: any): PORow {
  const snap = d.supplierSnapshot ?? {};
  return {
    id:       String(d._id),
    poNumber: d.poNumber ?? '',
    poType:   d.poType ?? 'standard',
    supplier: snap.name ?? '',
    supplierSnapshot: {
      name:    snap.name    ?? '',
      address: snap.address ?? '',
      contact: snap.contact ?? '',
      phone:   snap.phone   ?? '',
      email:   snap.email   ?? '',
      taxId:   snap.taxId   ?? '',
    },
    orderDate:     d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt ?? ''),
    dueDate:       d.dueDate instanceof Date   ? d.dueDate.toISOString()   : String(d.dueDate   ?? ''),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (d.items ?? []).map((i: any) => ({
      productId:   i.productId ? String(i.productId) : undefined,
      productName: i.productName ?? '',
      unit:        i.unit        ?? 'เส้น',
      qty:         i.qty         ?? 0,
      unitPrice:   i.unitPrice   ?? 0,
      discount:    i.discount    ?? 0,
      discountType: (i.discountType as 'pct' | 'amt') ?? 'pct',
      year:        i.year        ?? '',
      lineTotal:   i.lineTotal   ?? 0,
    })),
    subtotal:      d.subtotal      ?? 0,
    totalDiscount: d.totalDiscount ?? 0,
    vat:           d.vat           ?? 0,
    grandTotal:    d.grandTotal    ?? 0,
    vatType:       d.vatType       ?? 'none',
    paymentTerm:   d.paymentTerm   ?? '30',
    paymentMethod: d.paymentMethod ?? 'transfer',
    notes:         d.notes         ?? '',
    status: STATUS_MAP[d.status ?? 'pending'] ?? 'รอรับสินค้า',
    paymentStatus: d.paymentStatus ?? 'unpaid',
    amountPaid:    d.amountPaid    ?? 0,
    paymentDate:   d.paymentDate instanceof Date ? d.paymentDate.toISOString() : (d.paymentDate ? String(d.paymentDate) : undefined),
    reference:     d.reference ?? '',
  };
}

// จับคู่เลขอ้างอิงของ PO กับเอกสารการเงิน (INV/BN ฯลฯ) เพื่อให้กดเปิดใบและเห็นชื่อลูกค้าได้
async function attachRefDocs(rows: PORow[]): Promise<PORow[]> {
  const refs = [...new Set(rows.map(r => r.reference).filter(Boolean))];
  if (refs.length === 0) return rows;
  const docs = await FinancialDocument.find({ docNumber: { $in: refs } })
    .select('docNumber customerName').lean() as { _id: unknown; docNumber: string; customerName: string }[];
  const byNumber = new Map(docs.map(d => [d.docNumber, { id: String(d._id), docNumber: d.docNumber, customerName: d.customerName ?? '' }]));
  for (const r of rows) {
    const refDoc = r.reference ? byNumber.get(r.reference) : undefined;
    if (refDoc) r.refDoc = refDoc;
  }
  return rows;
}

export async function getPurchaseOrders(): Promise<PORow[]> {
  await connectDB();
  const docs = await PurchaseOrder.find().sort({ createdAt: -1 }).lean();
  return attachRefDocs(docs.map(normalizeDoc));
}

export async function getPurchaseOrdersPage(options: PurchaseListOptions = {}): Promise<PurchaseListResult> {
  await connectDB();
  const pageSize = Math.max(1, Math.min(options.pageSize ?? 10, 50));
  const requestedPage = Math.max(1, options.page ?? 1);
  const query: Record<string, unknown> = {};
  const conditions: Record<string, unknown>[] = [];
  const search = options.search?.trim();

  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const amount = Number(search.replace(/[,฿\s]/g, ''));
    const searchFields: Record<string, unknown>[] = [
      { poNumber: rx },
      { 'supplierSnapshot.name': rx },
      { reference: rx },
    ];
    if (Number.isFinite(amount)) searchFields.push({ grandTotal: amount });
    conditions.push({ $or: searchFields });
  }
  const date: Record<string, Date> = {};
  if (options.dateFrom) date.$gte = new Date(`${options.dateFrom}T00:00:00`);
  if (options.dateTo) date.$lte = new Date(`${options.dateTo}T23:59:59.999`);
  if (Object.keys(date).length) query.createdAt = date;
  if (options.status && options.status !== 'ทั้งหมด') {
    const rawStatus = Object.entries(STATUS_MAP).find(([, label]) => label === options.status)?.[0];
    if (rawStatus) query.status = rawStatus;
  }
  if (conditions.length) query.$and = conditions;

  const projection = 'poNumber poType supplierSnapshot reference dueDate items paymentTerm paymentMethod notes subtotal totalDiscount vat grandTotal vatType paymentStatus amountPaid paymentDate status createdAt';
  const [totalItems, docs, aggregate] = await Promise.all([
    PurchaseOrder.countDocuments(query),
    PurchaseOrder.find(query).select(projection).sort({ createdAt: -1 }).skip((requestedPage - 1) * pageSize).limit(pageSize).lean(),
    PurchaseOrder.aggregate([
      { $match: query },
      { $group: {
        _id: null,
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        received: { $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] } },
        totalValue: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, { $ifNull: ['$grandTotal', 0] }, 0] } },
        suppliers: { $addToSet: '$supplierSnapshot.name' },
      } },
    ]),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const pageDocs = page === requestedPage
    ? docs
    : await PurchaseOrder.find(query).select(projection).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean();
  const rows = await attachRefDocs(pageDocs.map(normalizeDoc));
  const summary = aggregate[0] ?? {};
  return {
    orders: rows,
    totalItems,
    page,
    pageSize,
    summary: {
      pending: summary.pending ?? 0,
      received: summary.received ?? 0,
      totalValue: summary.totalValue ?? 0,
      suppliers: Array.isArray(summary.suppliers) ? summary.suppliers.filter(Boolean).length : 0,
    },
  };
}

export async function getPurchaseOrderById(id: string): Promise<PORow | null> {
  await connectDB();
  try {
    const doc = await PurchaseOrder.findById(id).lean();
    if (!doc) return null;
    const [row] = await attachRefDocs([normalizeDoc(doc)]);
    return row;
  } catch {
    return null;
  }
}

export async function getSuppliers(): Promise<SupplierRow[]> {
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs = await Supplier.find().sort({ name: 1 }).lean() as any[];
  return docs.map(d => ({
    id:      String(d._id),
    name:    d.name    ?? '',
    address: d.address ?? '',
    contact: d.contact ?? '',
    phone:   d.phone   ?? '',
    email:   d.email   ?? '',
    taxId:   d.taxId   ?? '',
  }));
}

export async function generatePONumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;
  const latest = await PurchaseOrder.findOne(
    { poNumber: { $regex: `^${prefix}` } },
    { poNumber: 1 },
  ).sort({ poNumber: -1 }).lean() as { poNumber?: string } | null;

  if (!latest) return `${prefix}001`;
  const seq = parseInt(latest.poNumber?.split('-')[2] ?? '0', 10);
  return `${prefix}${String(seq + 1).padStart(3, '0')}`;
}
