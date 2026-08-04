const { Income } = require('./src/models/Income');
const { FinancialDocument } = require('./src/models/FinancialDocument');
const connectDB = require('./src/lib/mongodb').default;

connectDB().then(async () => {
  const monthStart = new Date(2026, 6, 1);
  const nextMonthStart = new Date(2026, 7, 1);
  
  const incomes = await Income.aggregate([
    { $match: { incomeDate: { $gte: monthStart, $lt: nextMonthStart } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const docs = await FinancialDocument.aggregate([
    { $match: { type: { $in: ['invoice', 'billing_note'] }, status: 'paid', issuedAt: { $gte: monthStart, $lt: nextMonthStart } } },
    { $group: { _id: null, total: { $sum: '$grandTotal' } } }
  ]);
  
  const invOnly = await FinancialDocument.aggregate([
    { $match: { type: 'invoice', status: 'paid', issuedAt: { $gte: monthStart, $lt: nextMonthStart } } },
    { $group: { _id: null, total: { $sum: '$grandTotal' } } }
  ]);
  
  console.log('Income Total:', incomes[0]?.total);
  console.log('Docs (Inv + BN) Total:', docs[0]?.total);
  console.log('Inv Only Total:', invOnly[0]?.total);
  
  process.exit(0);
});
