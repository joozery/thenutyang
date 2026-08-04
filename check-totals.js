const { Income } = require('./src/models/Income');
const { FinancialDocument } = require('./src/models/FinancialDocument');
const connectDB = require('./src/lib/mongodb').default;

connectDB().then(async () => {
  const monthStart = new Date(2026, 6, 1);
  const nextMonthStart = new Date(2026, 7, 1);
  
  const i = await Income.aggregate([{ $match: { incomeDate: { $gte: monthStart, $lt: nextMonthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  const d = await FinancialDocument.aggregate([{ $match: { type: 'invoice', status: 'paid', issuedAt: { $gte: monthStart, $lt: nextMonthStart } } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]);
  
  console.log('Income Total:', i[0]?.total);
  console.log('Invoice Total:', d[0]?.total);
  
  // Find invoices from PREVIOUS months that were paid in JULY
  const prevMonthInvoicesPaidThisMonth = await FinancialDocument.find({
    type: 'invoice',
    status: 'paid',
    issuedAt: { $lt: monthStart },
    updatedAt: { $gte: monthStart, $lt: nextMonthStart }
  }).lean();
  
  console.log('Invoices issued before July but paid in July (maybe):');
  prevMonthInvoicesPaidThisMonth.forEach(doc => {
    console.log(`- ${doc.docNumber} : ${doc.grandTotal} (issued: ${doc.issuedAt}, updated: ${doc.updatedAt})`);
  });
  
  process.exit(0);
});
