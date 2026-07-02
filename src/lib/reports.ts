import connectDB from './mongodb';
import { Expense } from '@/models/Expense';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { Payslip } from '@/models/Payslip';
import { FinancialDocument } from '@/models/FinancialDocument';
import { ServiceItem } from '@/models/ServiceItem';
import { Customer } from '@/models/Customer';

export type MonthlyBar = {
  year:    number;
  month:   number;
  label:   string;
  income:  number;
  expense: number;
  net:     number;
};

export type TopProduct = { name: string; qty: number; revenue: number };

export type ReportSummary = {
  totalIncome:  number;
  totalExpense: number;
  netProfit:    number;
  monthly:      MonthlyBar[];
  incomeByCategory:  { label: string; amount: number; pct: number }[];
  expenseByCategory: { label: string; amount: number; pct: number }[];
  billCount:        number;
  newCustomerCount: number;
  topProducts:      TopProduct[];
  ytdIncome:        number;
};

type AggRow = { _id: { y: number; m: number }; total: number };

function findMonth(agg: AggRow[], y: number, m: number) {
  return agg.find((a) => a._id.y === y && a._id.m === m)?.total ?? 0;
}

function pct(amount: number, total: number) {
  return total > 0 ? Math.round((amount / total) * 100) : 0;
}

export async function getReportSummary(start: Date, end: Date): Promise<ReportSummary> {
  await connectDB();

  const yearStart = new Date(start.getFullYear(), 0, 1);
  const yearEnd   = new Date(start.getFullYear(), 11, 31, 23, 59, 59, 999);

  const invoiceMatch = { type: 'invoice', status: 'paid', issuedAt: { $gte: start, $lte: end } };

  // ดึงชื่อบริการทั้งหมดเพื่อคำนวณต้นทุนบริการ
  const serviceItems = await ServiceItem.find({}).lean();
  const serviceNames = new Set(serviceItems.map((s) => s.name));

  const [invoiceAgg, expenseMiscAgg, poAgg, payslipAgg, expenseCatAgg,
    billCount, newCustomerCount, topProductsAgg, ytdInvoiceAgg,
    invoicesForServiceCost] = await Promise.all([
    // รายรับจากใบเสร็จที่จ่ายแล้ว กรองตาม issuedAt
    FinancialDocument.aggregate<AggRow>([
      { $match: invoiceMatch },
      { $group: { _id: { y: { $year: '$issuedAt' }, m: { $month: '$issuedAt' } }, total: { $sum: '$grandTotal' } } },
    ]),
    Expense.aggregate<AggRow>([
      { $match: { expenseDate: { $gte: start, $lte: end } } },
      { $group: { _id: { y: { $year: '$expenseDate' }, m: { $month: '$expenseDate' } }, total: { $sum: '$amount' } } },
    ]),
    PurchaseOrder.aggregate<AggRow>([
      { $match: { status: 'received', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, total: { $sum: '$grandTotal' } } },
    ]),
    Payslip.aggregate<AggRow>([
      { $match: { status: 'paid', paidAt: { $gte: start, $lte: end } } },
      { $group: { _id: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } }, total: { $sum: '$netPay' } } },
    ]),
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { expenseDate: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
    FinancialDocument.countDocuments(invoiceMatch),
    Customer.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    FinancialDocument.aggregate<{ _id: string; qty: number; revenue: number }>([
      { $match: invoiceMatch },
      { $unwind: '$items' },
      { $group: { _id: '$items.description', qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]),
    FinancialDocument.aggregate<{ total: number }>([
      { $match: { type: 'invoice', status: 'paid', issuedAt: { $gte: yearStart, $lte: yearEnd } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    // ดึงรายการ items จากเอกสารในช่วง เพื่อคำนวณต้นทุนบริการ
    FinancialDocument.find(invoiceMatch, { items: 1, issuedAt: 1 }).lean() as Promise<{
      issuedAt: Date;
      items: { description: string; qty: number; unitPrice: number }[];
    }[]>,
  ]);

  // คำนวณต้นทุนบริการ 50% แยกตามเดือน
  const serviceCostByMonth: Record<string, number> = {};
  for (const doc of invoicesForServiceCost) {
    const d = new Date(doc.issuedAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const serviceCost = doc.items.reduce((sum, item) => {
      if (serviceNames.has(item.description)) {
        return sum + item.unitPrice * item.qty * 0.5;
      }
      return sum;
    }, 0);
    serviceCostByMonth[key] = (serviceCostByMonth[key] ?? 0) + serviceCost;
  }

  // สร้าง array เดือนในช่วงที่เลือก
  const monthly: MonthlyBar[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= endMonth) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth() + 1;
    const income  = findMonth(invoiceAgg, y, m);
    const serviceCost = serviceCostByMonth[`${y}-${m}`] ?? 0;
    const expense = findMonth(expenseMiscAgg, y, m) + findMonth(poAgg, y, m) + findMonth(payslipAgg, y, m) + serviceCost;
    monthly.push({
      year: y, month: m,
      label: cursor.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
      income, expense, net: income - expense,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const totalIncome         = invoiceAgg.reduce((s, r) => s + r.total, 0);
  const totalExpenseMisc    = expenseMiscAgg.reduce((s, r) => s + r.total, 0);
  const totalExpensePO      = poAgg.reduce((s, r) => s + r.total, 0);
  const totalExpensePayroll = payslipAgg.reduce((s, r) => s + r.total, 0);
  const totalServiceCost    = Object.values(serviceCostByMonth).reduce((s, v) => s + v, 0);
  const totalExpense = totalExpenseMisc + totalExpensePO + totalExpensePayroll + totalServiceCost;
  const netProfit    = totalIncome - totalExpense;

  const incomeByCategory = [
    { label: 'ยอดขาย (ใบเสร็จที่ชำระแล้ว)', amount: totalIncome, pct: 100 },
  ].filter((c) => c.amount > 0);

  const expenseByCategory = [
    { label: 'ต้นทุนสินค้า (จัดซื้อ)',   amount: totalExpensePO,      pct: pct(totalExpensePO, totalExpense) },
    { label: 'ต้นทุนบริการ (50%)',         amount: totalServiceCost,    pct: pct(totalServiceCost, totalExpense) },
    { label: 'เงินเดือน/ค่าแรง',           amount: totalExpensePayroll, pct: pct(totalExpensePayroll, totalExpense) },
    ...expenseCatAgg.map((r) => ({ label: r._id || 'อื่นๆ', amount: r.total, pct: pct(r.total, totalExpense) })),
  ].filter((c) => c.amount > 0);

  const topProducts: TopProduct[] = topProductsAgg.map((r) => ({
    name:    r._id || 'ไม่ระบุ',
    qty:     r.qty,
    revenue: r.revenue,
  }));

  const ytdIncome = ytdInvoiceAgg[0]?.total ?? 0;

  return {
    totalIncome, totalExpense, netProfit, monthly, incomeByCategory, expenseByCategory,
    billCount, newCustomerCount, topProducts, ytdIncome,
  };
}
