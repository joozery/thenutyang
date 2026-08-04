const { Income } = require('./src/models/Income');
const { FinancialDocument } = require('./src/models/FinancialDocument');
const connectDB = require('./src/lib/mongodb').default;

connectDB().then(async () => {
  const monthStart = new Date(2026, 6, 1);
  const nextMonthStart = new Date(2026, 7, 1);
  
  const incomes = await Income.find({ incomeDate: { $gte: monthStart, $lt: nextMonthStart } }).lean();
  
  for (const inc of incomes) {
    let docNumber = null;
    const match = inc.description.match(/INV-\d{4}-\d{4}/);
    if (match) docNumber = match[0];
    
    if (!docNumber) {
      console.log(`Income has no INV number: ${inc.description} | ${inc.amount}`);
      continue;
    }
    
    const doc = await FinancialDocument.findOne({ docNumber }).lean();
    if (!doc) {
      console.log(`Doc not found for ${docNumber}`);
    } else {
      if (doc.grandTotal !== inc.amount) {
        console.log(`MISMATCH: ${docNumber} -> Invoice: ${doc.grandTotal}, Income: ${inc.amount}`);
      }
    }
  }
  
  process.exit(0);
});
