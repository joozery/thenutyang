const { FinancialDocument } = require('./src/models/FinancialDocument');
const { Booking } = require('./src/models/Booking');
const { Income } = require('./src/models/Income');
const connectDB = require('./src/lib/mongodb').default;

connectDB().then(async () => {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

  const incomes = await Income.find({ incomeDate: { $gte: monthStart, $lte: monthEnd } }).lean();
  
  const invoicesRaw = await FinancialDocument.find({ type: 'invoice', status: 'paid', bookingRef: '', paidAt: { $gte: monthStart, $lte: monthEnd } }).lean();
  const paymentNotes = await FinancialDocument.find({ type: 'payment_note', bookingRef: '', paidAt: { $gte: monthStart, $lte: monthEnd } }).lean();
  const creditNotes = await FinancialDocument.find({ type: 'credit_note', status: { $ne: 'cancelled' }, bookingRef: '', issuedAt: { $gte: monthStart, $lte: monthEnd } }).lean();
  const depositBookings = await Booking.find({ status: { $ne: 'cancelled' }, depositStatus: 'verified', depositRefunded: { $ne: true }, depositPaidAt: { $gte: monthStart, $lte: monthEnd } }).lean();
  const balanceBookings = await Booking.find({ status: { $ne: 'cancelled' }, balanceStatus: 'paid', balancePaidAt: { $gte: monthStart, $lte: monthEnd } }).lean();

  const relatedIds = invoicesRaw.map(i => i.relatedDocId).filter(Boolean);
  const relatedDocs = relatedIds.length ? await FinancialDocument.find({ _id: { $in: relatedIds } }, { type: 1 }).lean() : [];
  const relatedTypeMap = new Map(relatedDocs.map(d => [String(d._id), d.type]));
  
  const invoices = invoicesRaw.filter(i => !i.relatedDocId || relatedTypeMap.get(String(i.relatedDocId)) !== 'billing_note');

  let allIncludedDocs = [];
  invoices.forEach(i => allIncludedDocs.push(i));
  paymentNotes.forEach(i => allIncludedDocs.push(i));
  // Not pushing credit notes, they subtract

  console.log(`Income table count: ${incomes.length}`);
  console.log(`Finance Included Docs (invoices+payments): ${allIncludedDocs.length}`);
  
  // Find which Income record doesn't have a matching doc (by amount or date or something)
  // Usually, Income records have `description` that contains the DocNumber, like "รับชำระบิล INV-XXXX" or just "INV-XXXX"
  
  let incomeDescMap = incomes.reduce((acc, inc) => {
    acc[inc.description] = inc.amount;
    return acc;
  }, {});
  
  allIncludedDocs.forEach(doc => {
    // try to find matching income by docNumber
    const foundIncome = incomes.find(inc => inc.description.includes(doc.docNumber));
    if (!foundIncome) {
      console.log(`Doc in Finance but NOT in Income: ${doc.docNumber} (${doc.grandTotal})`);
    } else {
      if (foundIncome.amount !== doc.grandTotal) {
        console.log(`Mismatch amount: ${doc.docNumber} - Finance: ${doc.grandTotal}, Income: ${foundIncome.amount}`);
      }
    }
  });

  console.log('--- Incomes without matching Finance doc ---');
  incomes.forEach(inc => {
    const foundDoc = allIncludedDocs.find(doc => inc.description.includes(doc.docNumber));
    if (!foundDoc) {
      console.log(`Income NOT in Finance: ${inc.description} - Amount: ${inc.amount}`);
    }
  });

  process.exit(0);
});
