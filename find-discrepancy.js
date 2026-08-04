const { Income } = require('./src/models/Income');
const { FinancialDocument } = require('./src/models/FinancialDocument');
const connectDB = require('./src/lib/mongodb').default;
connectDB().then(async () => {
  const monthStart = new Date(2026, 6, 1); // July 1, 2026
  const nextMonthStart = new Date(2026, 7, 1); // Aug 1, 2026
  
  const incomes = await Income.find({ incomeDate: { $gte: monthStart, $lt: nextMonthStart } }).lean();
  const invoices = await FinancialDocument.find({ type: 'invoice', status: 'paid', issuedAt: { $gte: monthStart, $lt: nextMonthStart } }).lean();
  
  let incomeTotal = 0;
  incomes.forEach(i => incomeTotal += i.amount);
  
  let invoiceTotal = 0;
  invoices.forEach(i => invoiceTotal += i.grandTotal);
  
  console.log(`Income Total: ${incomeTotal}`);
  console.log(`Invoice Total: ${invoiceTotal}`);
  
  // Find incomes without matching invoice
  // Incomes have 'documentId' which links to FinancialDocument
  const invoiceIds = new Set(invoices.map(i => i._id.toString()));
  const missingInvoices = incomes.filter(i => !i.documentId || !invoiceIds.has(i.documentId.toString()));
  
  console.log(`\nIncomes that are NOT in July's paid invoices:`);
  missingInvoices.forEach(i => {
    console.log(`- ${i.amount} baht: ${i.description} (Date: ${i.incomeDate})`);
  });
  
  process.exit(0);
});
