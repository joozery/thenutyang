import connectDB from './mongodb';
import { FinancialDocument } from '@/models/FinancialDocument';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { Payslip } from '@/models/Payslip';
import { Expense } from '@/models/Expense';
import { Booking } from '@/models/Booking';

export type FinanceTransaction = {
  id:     string;
  date:   string;
  desc:   string;
  ref:    string;
  type:   'in' | 'out';
  amount: number;
  deletable: boolean;
  href?:  string; // ลิงก์ไปดูเอกสารต้นทาง (PO/อินวอย) ถ้ามี
};

export type CategoryBreakdown = { label: string; amount: number; pct: number };

export type FinanceSummary = {
  totalIncome:  number;
  totalExpense: number;
  netProfit:    number;
  incomeByCategory:  CategoryBreakdown[];
  expenseByCategory: CategoryBreakdown[];
  transactions: FinanceTransaction[];
};

function pct(amount: number, total: number) {
  return total > 0 ? Math.round((amount / total) * 100) : 0;
}

// รายรับจากการจอง (มัดจำ + ยอดคงเหลือ) นับตรงจาก Booking ตามวันที่จ่ายจริง — ไม่นับจากใบเสร็จ/ใบแจ้งหนี้ที่ออกจากการจองอีกรอบ
// (เอกสารที่มี bookingRef จะถูกตัดออกจากรายรับด้านล่าง เพื่อไม่ให้นับเงินก้อนเดียวซ้ำสองที่)
// ใบเสร็จ/ใบแจ้งหนี้แบบ manual ที่ไม่เกี่ยวกับการจอง (เช่น ขายหน้าร้าน/บิลเครดิตลูกค้าองค์กร) ยังนับเป็นรายรับตามปกติ
type DocLean = {
  _id: unknown; grandTotal: number; customerName: string; docNumber: string;
  paidAt?: Date | null; issuedAt: Date; relatedDocId?: unknown; type?: string; bookingRef?: string;
};
type POLean = { _id: unknown; grandTotal: number; amountPaid?: number; paymentDate?: Date | null; poNumber: string; supplierSnapshot?: { name?: string }; createdAt: Date };
type PayslipLean = { _id: unknown; netPay: number; employeeName: string; period: string; paidAt?: Date | null; createdAt: Date };
type ExpenseLean = { _id: unknown; amount: number; category: string; description: string; expenseDate: Date };
type BookingLean = {
  _id: unknown; ref: string; name: string; tirePrice: number; quantity: number;
  depositAmount: number; depositStatus: string; depositPaidAt?: Date | null;
  balanceStatus: string; balancePaidAt?: Date | null; balanceReceivedAmount?: number | null;
};

export async function getFinanceSummary(monthStart: Date, monthEnd: Date): Promise<FinanceSummary> {
  await connectDB();

  const [invoicesRaw, paymentNotes, creditNotes, purchaseOrders, payslips, expenses, depositBookings, balanceBookings] = await Promise.all([
    FinancialDocument.find({ type: 'invoice', status: 'paid', bookingRef: '', paidAt: { $gte: monthStart, $lte: monthEnd } }).lean() as Promise<DocLean[]>,
    FinancialDocument.find({ type: 'payment_note', bookingRef: '', paidAt: { $gte: monthStart, $lte: monthEnd } }).lean() as Promise<DocLean[]>,
    FinancialDocument.find({ type: 'credit_note', status: { $ne: 'cancelled' }, bookingRef: '', issuedAt: { $gte: monthStart, $lte: monthEnd } }).lean() as Promise<DocLean[]>,
    // นับเฉพาะ PO ที่กดชำระแล้ว (ยอดจ่ายจริง ตามวันชำระ) — ยังไม่ชำระไม่ถือเป็นค่าใช้จ่าย
    PurchaseOrder.find({ status: 'received', paymentStatus: { $in: ['partial', 'paid'] }, paymentDate: { $gte: monthStart, $lte: monthEnd } }).lean() as Promise<POLean[]>,
    Payslip.find({ status: 'paid', paidAt: { $gte: monthStart, $lte: monthEnd } }).lean() as Promise<PayslipLean[]>,
    // ตัดหมวด PurchaseOrder ออก — ยอดจ่ายค่าจัดซื้อนับจาก PO ด้านบนแล้ว ไม่ให้ซ้ำ
    Expense.find({ category: { $ne: 'PurchaseOrder' }, expenseDate: { $gte: monthStart, $lte: monthEnd } }).lean() as Promise<ExpenseLean[]>,
    Booking.find({ status: { $ne: 'cancelled' }, depositStatus: 'verified', depositRefunded: { $ne: true }, depositPaidAt: { $gte: monthStart, $lte: monthEnd } }).lean() as Promise<BookingLean[]>,
    Booking.find({ status: { $ne: 'cancelled' }, balanceStatus: 'paid', balancePaidAt: { $gte: monthStart, $lte: monthEnd } }).lean() as Promise<BookingLean[]>,
  ]);

  // ตัดใบเสร็จที่ออกอัตโนมัติจากใบแจ้งหนี้ทิ้ง (เงินก้อนนั้นถูกนับไปแล้วตอนรับชำระแต่ละงวด/payment_note)
  const relatedIds = invoicesRaw.map((i) => i.relatedDocId).filter(Boolean);
  const relatedDocs = (relatedIds.length
    ? await FinancialDocument.find({ _id: { $in: relatedIds } }, { type: 1 }).lean()
    : []) as { _id: unknown; type: string }[];
  const relatedTypeMap = new Map(relatedDocs.map((d) => [String(d._id), d.type]));
  const invoices = invoicesRaw.filter((i) => !i.relatedDocId || relatedTypeMap.get(String(i.relatedDocId)) !== 'billing_note');

  const incomeFromDeposits   = depositBookings.reduce((s, b) => s + (b.depositAmount ?? 0), 0);
  const incomeFromBalances   = balanceBookings.reduce((s, b) => {
    const totalAmount = b.tirePrice * b.quantity;
    const expectedRemaining = b.depositStatus === 'verified' ? totalAmount - b.depositAmount : totalAmount;
    return s + (b.balanceReceivedAmount ?? expectedRemaining);
  }, 0);
  const incomeFromInvoices    = invoices.reduce((s, d) => s + (d.grandTotal ?? 0), 0);
  const incomeFromPayments    = paymentNotes.reduce((s, d) => s + (d.grandTotal ?? 0), 0);
  const incomeFromCreditNotes = creditNotes.reduce((s, d) => s + Math.abs(d.grandTotal ?? 0), 0);
  const totalIncome = incomeFromDeposits + incomeFromBalances + incomeFromInvoices + incomeFromPayments - incomeFromCreditNotes;

  const expenseFromPO      = purchaseOrders.reduce((s, d) => s + (d.amountPaid ?? 0), 0);
  const expenseFromPayroll = payslips.reduce((s, d) => s + (d.netPay ?? 0), 0);
  const expenseFromMisc    = expenses.reduce((s, d) => s + (d.amount ?? 0), 0);
  const totalExpense = expenseFromPO + expenseFromPayroll + expenseFromMisc;

  const netProfit = totalIncome - totalExpense;
  const incomeGross = incomeFromDeposits + incomeFromBalances + incomeFromInvoices + incomeFromPayments + incomeFromCreditNotes;

  const incomeByCategory: CategoryBreakdown[] = [
    { label: 'มัดจำจากการจอง',              amount: incomeFromDeposits, pct: pct(incomeFromDeposits, incomeGross) },
    { label: 'ยอดคงเหลือจากการจอง',          amount: incomeFromBalances, pct: pct(incomeFromBalances, incomeGross) },
    { label: 'ใบเสร็จ/ใบกำกับภาษี (นอกระบบจอง)', amount: incomeFromInvoices, pct: pct(incomeFromInvoices, incomeGross) },
    { label: 'รับชำระใบแจ้งหนี้',             amount: incomeFromPayments, pct: pct(incomeFromPayments, incomeGross) },
    { label: 'หัก: ใบลดหนี้',                 amount: -incomeFromCreditNotes, pct: pct(incomeFromCreditNotes, incomeGross) },
  ].filter((c) => c.amount !== 0);

  const expenseByCategory: CategoryBreakdown[] = [
    { label: 'ต้นทุนสินค้า (จัดซื้อ)', amount: expenseFromPO, pct: pct(expenseFromPO, totalExpense) },
    { label: 'เงินเดือน/ค่าแรง',       amount: expenseFromPayroll, pct: pct(expenseFromPayroll, totalExpense) },
    { label: 'ค่าใช้จ่ายทั่วไป',       amount: expenseFromMisc, pct: pct(expenseFromMisc, totalExpense) },
  ].filter((c) => c.amount !== 0);

  const transactions: FinanceTransaction[] = [
    ...depositBookings.map((b) => ({
      id: `dep-${String(b._id)}`, date: new Date(b.depositPaidAt!).toISOString(),
      desc: `รับมัดจำจาก ${b.name}`, ref: b.ref, type: 'in' as const, amount: b.depositAmount, deletable: false,
    })),
    ...balanceBookings.map((b) => {
      const totalAmount = b.tirePrice * b.quantity;
      const expectedRemaining = b.depositStatus === 'verified' ? totalAmount - b.depositAmount : totalAmount;
      const received = b.balanceReceivedAmount ?? expectedRemaining;
      return {
        id: `bal-${String(b._id)}`, date: new Date(b.balancePaidAt!).toISOString(),
        desc: `รับยอดคงเหลือจาก ${b.name}`, ref: b.ref, type: 'in' as const, amount: received, deletable: false,
      };
    }),
    ...invoices.map((d) => ({
      id: String(d._id), date: new Date(d.paidAt ?? d.issuedAt).toISOString(),
      desc: `รับเงินจาก ${d.customerName}`, ref: d.docNumber, type: 'in' as const, amount: d.grandTotal, deletable: false,
      href: `/admin/documents/${String(d._id)}/print`,
    })),
    ...paymentNotes.map((d) => ({
      id: String(d._id), date: new Date(d.paidAt ?? d.issuedAt).toISOString(),
      desc: `รับชำระจาก ${d.customerName}`, ref: d.docNumber, type: 'in' as const, amount: d.grandTotal, deletable: false,
      href: `/admin/documents/${String(d._id)}/print`,
    })),
    ...creditNotes.map((d) => ({
      id: String(d._id), date: new Date(d.issuedAt).toISOString(),
      desc: `ใบลดหนี้ให้ ${d.customerName}`, ref: d.docNumber, type: 'out' as const, amount: Math.abs(d.grandTotal), deletable: false,
      href: `/admin/documents/${String(d._id)}/print`,
    })),
    ...purchaseOrders.map((d) => ({
      id: String(d._id), date: new Date(d.paymentDate ?? d.createdAt).toISOString(),
      desc: `จ่ายค่าสินค้า ${d.supplierSnapshot?.name ?? ''}`, ref: d.poNumber, type: 'out' as const, amount: d.amountPaid ?? 0, deletable: false,
      href: `/admin/purchasing/${String(d._id)}/print`,
    })),
    ...payslips.map((d) => ({
      id: String(d._id), date: new Date(d.paidAt ?? d.createdAt).toISOString(),
      desc: `จ่ายเงินเดือน ${d.employeeName}`, ref: `PS-${d.period}`, type: 'out' as const, amount: d.netPay, deletable: false,
    })),
    ...expenses.map((d) => ({
      id: String(d._id), date: new Date(d.expenseDate).toISOString(),
      desc: d.description || d.category, ref: d.category, type: 'out' as const, amount: d.amount, deletable: true,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { totalIncome, totalExpense, netProfit, incomeByCategory, expenseByCategory, transactions };
}
