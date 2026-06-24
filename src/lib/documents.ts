import connectDB from './mongodb';
import { FinancialDocument } from '@/models/FinancialDocument';

export type DocType      = 'invoice' | 'quote' | 'credit_note' | 'billing_note' | 'payment_note';
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
  relatedDocId:     string;
  relatedDocNumber: string;
  customerName:    string;
  customerPhone:   string;
  customerCar:     string;
  customerAddress: string;
  customerTaxId:   string;
  items:         DocItem[];
  subtotal:      number;
  discountTotal: number;
  vatRate:       number;
  vatAmount:     number;
  grandTotal:    number;
  paymentMethod: PaymentMethod;
  technicianName: string;
  status:        string;
  note:          string;
  showPaymentInfo: boolean;
  issuedAt:      string;
  dueDate:       string;
};

export type DocStats = {
  invoiceCountMonth: number;
  invoiceTotalMonth: number;
  unpaidCount:       number;
  pendingQuoteCount: number;
  billingOutstandingCount: number;
  billingOutstandingTotal: number;
  totalIncomeMonth: number;
  totalExpenseMonth: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(d: any): DocRow {
  return {
    id:            String(d._id),
    docNumber:     d.docNumber     ?? '',
    type:          d.type          ?? 'invoice',
    source:        d.source        ?? 'manual',
    bookingRef:    d.bookingRef    ?? '',
    relatedDocId:     d.relatedDocId ? String(d.relatedDocId) : '',
    relatedDocNumber: d.relatedDocNumber ?? '',
    customerName:    d.customerName    ?? '',
    customerPhone:   d.customerPhone   ?? '',
    customerCar:     d.customerCar     ?? '',
    customerAddress: d.customerAddress ?? '',
    customerTaxId:   d.customerTaxId   ?? '',
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
    technicianName: d.technicianName ?? '',
    status:        d.status        ?? '',
    note:          d.note          ?? '',
    showPaymentInfo: d.showPaymentInfo ?? false,
    issuedAt:      d.issuedAt instanceof Date ? d.issuedAt.toISOString() : String(d.issuedAt ?? ''),
    dueDate:       d.dueDate  instanceof Date ? d.dueDate.toISOString()  : String(d.dueDate  ?? ''),
  };
}

export async function getDocuments(): Promise<DocRow[]> {
  await connectDB();
  const docs = await FinancialDocument.find({}).sort({ createdAt: -1 }).lean();
  return docs.map(normalize);
}

export async function getDocumentById(id: string): Promise<DocRow | null> {
  await connectDB();
  try {
    const doc = await FinancialDocument.findById(id).lean();
    return doc ? normalize(doc) : null;
  } catch {
    return null;
  }
}

// ใช้หาใบเสนอราคาจากเลขที่การจอง (orderRef) — สำหรับหน้าพิมพ์/PDF ที่ลูกค้าเข้าถึงได้เอง ไม่ต้องผ่านแอดมิน
export async function getDocumentByBookingRef(orderRef: string): Promise<DocRow | null> {
  await connectDB();
  const doc = await FinancialDocument.findOne({ bookingRef: orderRef }).sort({ createdAt: -1 }).lean();
  return doc ? normalize(doc) : null;
}

export async function getDocStats(): Promise<DocStats> {
  await connectDB();
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const { Income } = await import('@/models/Income');
  const { Expense } = await import('@/models/Expense');

  const [monthInvoices, unpaidCount, pendingQuoteCount, outstandingBillingNotes, paymentSums, monthIncomes, monthExpenses] = await Promise.all([
    FinancialDocument.find({ type: 'invoice', issuedAt: { $gte: monthStart } }).lean(),
    FinancialDocument.countDocuments({ type: 'invoice', status: 'unpaid' }),
    FinancialDocument.countDocuments({ type: 'quote',   status: 'pending_approval' }),
    FinancialDocument.find({ type: 'billing_note', status: { $in: ['unpaid', 'partial'] } }, { grandTotal: 1 }).lean(),
    FinancialDocument.aggregate([
      { $match: { type: 'payment_note' } },
      { $group: { _id: '$relatedDocId', paid: { $sum: '$grandTotal' } } },
    ]),
    Income.aggregate([
      { $match: { incomeDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Expense.aggregate([
      { $match: { expenseDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const paidMap = new Map(paymentSums.map((p) => [String(p._id), p.paid as number]));
  const billingOutstandingTotal = outstandingBillingNotes.reduce(
    (sum, b) => sum + ((b.grandTotal as number) - (paidMap.get(String(b._id)) ?? 0)),
    0
  );

  return {
    invoiceCountMonth: monthInvoices.length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoiceTotalMonth: monthInvoices.reduce((s: number, d: any) => s + (d.grandTotal ?? 0), 0),
    unpaidCount,
    pendingQuoteCount,
    billingOutstandingCount: outstandingBillingNotes.length,
    billingOutstandingTotal,
    totalIncomeMonth: monthIncomes[0]?.total ?? 0,
    totalExpenseMonth: monthExpenses[0]?.total ?? 0,
  };
}

export async function generateDocNumber(type: DocType): Promise<string> {
  const PREFIX = { invoice: 'INV', quote: 'QT', credit_note: 'CR', billing_note: 'BN', payment_note: 'PN' }[type];
  const year    = new Date().getFullYear();
  const pattern = new RegExp(`^${PREFIX}-${year}-`);
  const last    = await FinancialDocument.findOne({ docNumber: pattern }).sort({ docNumber: -1 }).lean() as { docNumber: string } | null;
  const seq     = last ? parseInt(last.docNumber.split('-').pop() ?? '0', 10) + 1 : 1;
  return `${PREFIX}-${year}-${String(seq).padStart(4, '0')}`;
}
