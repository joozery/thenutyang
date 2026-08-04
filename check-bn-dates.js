const { FinancialDocument } = require('./src/models/FinancialDocument');
const connectDB = require('./src/lib/mongodb').default;

connectDB().then(async () => {
  const monthStart = new Date(2026, 6, 1);
  const nextMonthStart = new Date(2026, 7, 1);
  const bns = await FinancialDocument.find({ type: 'billing_note', status: 'paid', issuedAt: { $gte: monthStart, $lt: nextMonthStart } }).lean();
  console.log('Paid BNs in July:', bns.map(b => ({ doc: b.docNumber, total: b.grandTotal, issued: b.issuedAt, paid: b.paidAt })));
  process.exit(0);
});
