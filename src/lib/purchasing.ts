import connectDB from './mongodb';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { Supplier } from '@/models/Supplier';

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
  paymentTerm:  string;
  paymentMethod:string;
  notes:        string;
  status:       POStatusThai;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  amountPaid:   number;
  paymentDate?: string;
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
      year:        i.year        ?? '',
      lineTotal:   i.lineTotal   ?? 0,
    })),
    subtotal:      d.subtotal      ?? 0,
    totalDiscount: d.totalDiscount ?? 0,
    vat:           d.vat           ?? 0,
    grandTotal:    d.grandTotal    ?? 0,
    paymentTerm:   d.paymentTerm   ?? '30',
    paymentMethod: d.paymentMethod ?? 'transfer',
    notes:         d.notes         ?? '',
    status: STATUS_MAP[d.status ?? 'pending'] ?? 'รอรับสินค้า',
    paymentStatus: d.paymentStatus ?? 'unpaid',
    amountPaid:    d.amountPaid    ?? 0,
    paymentDate:   d.paymentDate instanceof Date ? d.paymentDate.toISOString() : (d.paymentDate ? String(d.paymentDate) : undefined),
  };
}

export async function getPurchaseOrders(): Promise<PORow[]> {
  await connectDB();
  const docs = await PurchaseOrder.find().sort({ createdAt: -1 }).lean();
  return docs.map(normalizeDoc);
}

export async function getPurchaseOrderById(id: string): Promise<PORow | null> {
  await connectDB();
  try {
    const doc = await PurchaseOrder.findById(id).lean();
    return doc ? normalizeDoc(doc) : null;
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
