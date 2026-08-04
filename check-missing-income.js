const { Income } = require('./src/models/Income');
const { FinancialDocument } = require('./src/models/FinancialDocument');
const connectDB = require('./src/lib/mongodb').default;

connectDB().then(async () => {
  const monthStart = new Date(2026, 6, 1);
  const nextMonthStart = new Date(2026, 7, 1);
  
  const incomes = await Income.find({ incomeDate: { $gte: monthStart, $lt: nextMonthStart } }).lean();
  const docs = await FinancialDocument.find({ type: 'invoice', status: 'paid', issuedAt: { $gte: monthStart, $lt: nextMonthStart } }).lean();
  
  let docsTotal = 0;
  let incomeMatchedTotal = 0;
  
  for (const doc of docs) {
    const inc = incomes.find(i => (i.documentId && i.documentId.toString() === doc._id.toString()) || i.description.includes(doc.docNumber));
    if (inc) {
      incomeMatchedTotal += inc.amount;
    } else {
      console.log('MISSING INCOME FOR:', doc.docNumber, doc.grandTotal);
    }
    docsTotal += doc.grandTotal;
  }
  
  console.log('Total Docs (Invoice) in July:', docsTotal);
  console.log('Total matched Income:', incomeMatchedTotal);
  
  process.exit(0);
});
