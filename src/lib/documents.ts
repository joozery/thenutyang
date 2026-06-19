import connectDB from './mongodb';
import { FinancialDocument } from '@/models/FinancialDocument';

export type DocType      = 'invoice' | 'quote' | 'credit_note';
export type PaymentMethod = 'cash' | 'transfer' | 'credit_card' | 'pending';

export type DocItem = {
  description: string;
  qty:         number;
  unitPrice:   number;
  discount:    number;
  lineTotal:   number;
};

export type DocRow = {
  id:            string;
  docNumber:     string;
  type:          DocType;
  source:        'booking' | 'manual';
  bookingRef:    string;
  customerName:  string;
  customerPhone: string;
  customerCar:   string;
  items:         DocItem[];
  subtotal:      number;
  discountTotal: number;
  vatRate:       number;
  vatAmount:     number;
  grandTotal:    number;
  paymentMethod: PaymentMethod;
  status:        string;
  note:          string;
  issuedAt:      string;
  dueDate:       string;
};

export type DocStats = {
  invoiceCountMonth: number;
  invoiceTotalMonth: number;
  unpaidCount:       number;
  pendingQuoteCount: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(d: any): DocRow {
  return {
    id:            String(d._id),
    docNumber:     d.docNumber     ?? '',
    type:          d.type          ?? 'invoice',
    source:        d.source        ?? 'manual',
    bookingRef:    d.bookingRef    ?? '',
    customerName:  d.customerName  ?? '',
    customerPhone: d.customerPhone ?? '',
    customerCar:   d.customerCar   ?? '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (d.items ?? []).map((item: any) => ({
      description: item.description ?? '',
      qty:         item.qty         ?? 0,
      unitPrice:   item.unitPrice   ?? 0,
      discount:    item.discount    ?? 0,
      lineTotal:   item.lineTotal   ?? 0,
    })),
    subtotal:      d.subtotal      ?? 0,
    discountTotal: d.discountTotal ?? 0,
    vatRate:       d.vatRate       ?? 7,
    vatAmount:     d.vatAmount     ?? 0,
    grandTotal:    d.grandTotal    ?? 0,
    paymentMethod: d.paymentMethod ?? 'pending',
    status:        d.status        ?? '',
    note:          d.note          ?? '',
    issuedAt:      d.issuedAt instanceof Date ? d.issuedAt.toISOString() : String(d.issuedAt ?? ''),
    dueDate:       d.dueDate  instanceof Date ? d.dueDate.toISOString()  : String(d.dueDate  ?? ''),
  };
}

export async function getDocuments(): Promise<DocRow[]> {
  await connectDB();
  const docs = await FinancialDocument.find({}).sort({ createdAt: -1 }).lean();
  return docs.map(normalize);
}

export async function getDocStats(): Promise<DocStats> {
  await connectDB();
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthInvoices, unpaidCount, pendingQuoteCount] = await Promise.all([
    FinancialDocument.find({ type: 'invoice', issuedAt: { $gte: monthStart } }).lean(),
    FinancialDocument.countDocuments({ type: 'invoice', status: 'unpaid' }),
    FinancialDocument.countDocuments({ type: 'quote',   status: 'pending_approval' }),
  ]);

  return {
    invoiceCountMonth: monthInvoices.length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoiceTotalMonth: monthInvoices.reduce((s: number, d: any) => s + (d.grandTotal ?? 0), 0),
    unpaidCount,
    pendingQuoteCount,
  };
}

export async function generateDocNumber(type: DocType): Promise<string> {
  const PREFIX = { invoice: 'INV', quote: 'QT', credit_note: 'CR' }[type];
  const year    = new Date().getFullYear();
  const pattern = new RegExp(`^${PREFIX}-${year}-`);
  const last    = await FinancialDocument.findOne({ docNumber: pattern }).sort({ docNumber: -1 }).lean() as { docNumber: string } | null;
  const seq     = last ? parseInt(last.docNumber.split('-').pop() ?? '0', 10) + 1 : 1;
  return `${PREFIX}-${year}-${String(seq).padStart(4, '0')}`;
}
