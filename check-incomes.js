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
  
  // Also check if any invoice comes from BN where we didn't filter out properly?
  // Wait, in documents.ts/dashboard.ts, we recently modified updateDocStatus to INSERT Income when BN is paid, 
  // but wait! Did we modify updateDocStatus? Let's see!
  
  const invoices = invoicesRaw.filter(i => !i.relatedDocId || relatedTypeMap.get(String(i.relatedDocId)) !== 'billing_note');

  const incomeFromDeposits = depositBookings.reduce((s, b) => s + (b.depositAmount || 0), 0);
  const incomeFromBalances = balanceBookings.reduce((s, b) => {
    const totalAmount = b.tirePrice * b.quantity;
    const expectedRemaining = b.depositStatus === 'verified' ? totalAmount - b.depositAmount : totalAmount;
    return s + (b.balanceReceivedAmount ?? expectedRemaining);
  }, 0);
  const incomeFromInvoices = invoices.reduce((s, d) => s + (d.grandTotal || 0), 0);
  const incomeFromPayments = paymentNotes.reduce((s, d) => s + (d.grandTotal || 0), 0);
  const incomeFromCreditNotes = creditNotes.reduce((s, d) => s + Math.abs(d.grandTotal || 0), 0);

  const financeTotal = incomeFromDeposits + incomeFromBalances + incomeFromInvoices + incomeFromPayments - incomeFromCreditNotes;
  const dbTotal = incomes.reduce((s, i) => s + i.amount, 0);

  console.log('Finance Total:', financeTotal);
  console.log('DB Total (Income collection):', dbTotal);
  console.log('Breakdown Finance:', { deposit: incomeFromDeposits, balance: incomeFromBalances, invoice: incomeFromInvoices, payment: incomeFromPayments, credit: incomeFromCreditNotes });

  let dbBreakdown = {};
  incomes.forEach(i => {
    dbBreakdown[i.category] = (dbBreakdown[i.category] || 0) + i.amount;
  });
  console.log('Breakdown DB:', dbBreakdown);

  process.exit(0);
});
