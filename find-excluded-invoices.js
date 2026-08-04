const { FinancialDocument } = require('./src/models/FinancialDocument');
const { Booking } = require('./src/models/Booking');
const { Income } = require('./src/models/Income');
const connectDB = require('./src/lib/mongodb').default;

connectDB().then(async () => {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

  const incomes = await Income.find({ incomeDate: { $gte: monthStart, $lte: monthEnd } }).lean();
  const invoicesRaw = await FinancialDocument.find({ type: 'invoice', status: 'paid', bookingRef: '', paidAt: { $gte: monthStart, $lte: monthEnd } }).lean();
  
  const relatedIds = invoicesRaw.map(i => i.relatedDocId).filter(Boolean);
  const relatedDocs = relatedIds.length ? await FinancialDocument.find({ _id: { $in: relatedIds } }, { type: 1 }).lean() : [];
  const relatedTypeMap = new Map(relatedDocs.map(d => [String(d._id), d.type]));
  
  const excludedInvoices = invoicesRaw.filter(i => i.relatedDocId && relatedTypeMap.get(String(i.relatedDocId)) === 'billing_note');

  console.log('Excluded Invoices (Because they come from BN):');
  excludedInvoices.forEach(i => console.log(` - ${i.docNumber}: ${i.grandTotal} THB (related to ${i.relatedDocId})`));

  process.exit(0);
});
