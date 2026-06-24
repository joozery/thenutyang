import connectDB from './mongodb';
import { Income } from '@/models/Income';
import { Expense } from '@/models/Expense';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { Payslip } from '@/models/Payslip';

export type MonthlyBar = {
  year:    number;
  month:   number;
  label:   string;
  income:  number;
  expense: number;
  net:     number;
};

export type ReportSummary = {
  totalIncome:  number;
  totalExpense: number;
  netProfit:    number;
  monthly:      MonthlyBar[];
  incomeByCategory:  { label: string; amount: number; pct: number }[];
  expenseByCategory: { label: string; amount: number; pct: number }[];
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

  const [incomeAgg, expenseMiscAgg, poAgg, payslipAgg, incomeCatAgg, expenseCatAgg] = await Promise.all([
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

  return { totalIncome, totalExpense, netProfit, monthly, incomeByCategory, expenseByCategory };
}
