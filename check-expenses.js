const { Expense } = require('./src/models/Expense');
const { PurchaseOrder } = require('./src/models/PurchaseOrder');
const { Payslip } = require('./src/models/Payslip');
const connectDB = require('./src/lib/mongodb').default;

connectDB().then(async () => {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  
  const monthExpenses = await Expense.aggregate([{ $match: { expenseDate: { $gte: monthStart, $lt: nextMonthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  const noPOExpenses = await Expense.aggregate([{ $match: { category: { $ne: 'PurchaseOrder' }, expenseDate: { $gte: monthStart, $lt: nextMonthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  
  const monthPO = await PurchaseOrder.aggregate([{ $match: { status: 'received', paymentStatus: { $in: ['partial', 'paid'] }, paymentDate: { $gte: monthStart, $lt: nextMonthStart } } }, { $group: { _id: null, total: { $sum: '$amountPaid' } } }]);
  
  const monthPayslip = await Payslip.aggregate([{ $match: { status: 'paid', paidAt: { $gte: monthStart, $lt: nextMonthStart } } }, { $group: { _id: null, total: { $sum: '$netPay' } } }]);
  
  console.log({
    totalExpenseInExpenseTable: monthExpenses[0]?.total,
    noPOExpense: noPOExpenses[0]?.total,
    POAmountPaid: monthPO[0]?.total,
    PayslipNetPay: monthPayslip[0]?.total,
    dashboardTotal: (noPOExpenses[0]?.total || 0) + (monthPO[0]?.total || 0) + (monthPayslip[0]?.total || 0)
  });
  process.exit(0);
});
