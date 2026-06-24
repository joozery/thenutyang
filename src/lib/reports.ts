import connectDB from './mongodb';
import { Income } from '@/models/Income';
import { Expense } from '@/models/Expense';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { Payslip } from '@/models/Payslip';
import { FinancialDocument } from '@/models/FinancialDocument';
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

  const [incomeAgg, expenseMiscAgg, poAgg, payslipAgg, incomeCatAgg, expenseCatAgg,
    billCount, newCustomerCount, topProductsAgg, ytdIncomeAgg] = await Promise.all([
    Income.aggregate<AggRow>([
      { $match: { incomeDate: { $gte: start, $lte: end } } },
      { $group: { _id: { y: { $year: '$incomeDate' }, m: { $month: '$incomeDate' } }, total: { $sum: '$amount' } } },
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
    // รายรับแยกหมวด
    Income.aggregate<{ _id: string; total: number }>([
      { $match: { incomeDate: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
    // รายจ่ายแยกหมวด (misc)
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { expenseDate: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
    // จำนวนบิล (invoice ที่จ่ายแล้วในช่วงเวลา)
    FinancialDocument.countDocuments({ type: 'invoice', status: 'paid', paidAt: { $gte: start, $lte: end } }),
    // ลูกค้าใหม่ในช่วงเวลา
    Customer.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    // สินค้าขายดี — unwind items จาก invoice ที่จ่ายแล้ว
    FinancialDocument.aggregate<{ _id: string; qty: number; revenue: number }>([
      { $match: { type: 'invoice', status: 'paid', paidAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.description', qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]),
    // รายได้ YTD (ตลอดปี)
    Income.aggregate<{ total: number }>([
      { $match: { incomeDate: { $gte: yearStart, $lte: yearEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  // สร้าง array เดือนในช่วงที่เลือก
  const monthly: MonthlyBar[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= endMonth) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth() + 1;
    const income  = findMonth(incomeAgg, y, m);
    const expense = findMonth(expenseMiscAgg, y, m) + findMonth(poAgg, y, m) + findMonth(payslipAgg, y, m);
    monthly.push({
      year: y, month: m,
      label: cursor.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
      income, expense, net: income - expense,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const totalIncome  = monthly.reduce((s, m) => s + m.income, 0);
  const totalExpenseMisc    = expenseMiscAgg.reduce((s, r) => s + r.total, 0);
  const totalExpensePO      = poAgg.reduce((s, r) => s + r.total, 0);
  const totalExpensePayroll = payslipAgg.reduce((s, r) => s + r.total, 0);
  const totalExpense = totalExpenseMisc + totalExpensePO + totalExpensePayroll;
  const netProfit    = totalIncome - totalExpense;

  const incomeByCategory = incomeCatAgg.map((r) => ({
    label: r._id || 'อื่นๆ',
    amount: r.total,
    pct: pct(r.total, totalIncome),
  }));

  const expenseByCategory = [
    { label: 'ต้นทุนสินค้า (จัดซื้อ)', amount: totalExpensePO,      pct: pct(totalExpensePO, totalExpense) },
    { label: 'เงินเดือน/ค่าแรง',        amount: totalExpensePayroll, pct: pct(totalExpensePayroll, totalExpense) },
    ...expenseCatAgg.map((r) => ({ label: r._id || 'อื่นๆ', amount: r.total, pct: pct(r.total, totalExpense) })),
  ].filter((c) => c.amount > 0);

  const topProducts: TopProduct[] = topProductsAgg.map((r) => ({
    name:    r._id || 'ไม่ระบุ',
    qty:     r.qty,
    revenue: r.revenue,
  }));

  const ytdIncome = ytdIncomeAgg[0]?.total ?? 0;

  return {
    totalIncome, totalExpense, netProfit, monthly, incomeByCategory, expenseByCategory,
    billCount, newCustomerCount, topProducts, ytdIncome,
  };
}
