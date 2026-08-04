import 'dotenv/config';
import connectDB from './src/lib/mongodb';
import { FinancialDocument } from './src/models/FinancialDocument';

async function main() {
  await connectDB();
  
  // Date range for Aug 1, 2026 local time (assuming +07:00, or just query UTC bounds)
  // Let's just query for the whole month and filter in JS to be safe with timezones
  const monthStart = new Date('2026-07-31T17:00:00.000Z');
  const monthEnd = new Date('2026-08-02T17:00:00.000Z');

  const invoices = await FinancialDocument.find({ 
    type: 'invoice', 
    status: 'paid', 
    paidAt: { $gte: monthStart, $lte: monthEnd } 
  }).lean();

  const paymentNotes = await FinancialDocument.find({ 
    type: 'payment_note', 
    paidAt: { $gte: monthStart, $lte: monthEnd } 
  }).lean();

  const creditNotes = await FinancialDocument.find({ 
    type: 'credit_note', 
    status: { $ne: 'cancelled' }, 
    issuedAt: { $gte: monthStart, $lte: monthEnd } 
  }).lean();

  console.log('--- INVOICES ---');
  for (const doc of invoices as any[]) {
    const d = new Date(doc.paidAt || doc.issuedAt);
    if (d.getDate() === 1 && d.getMonth() === 7 && d.getFullYear() === 2026) {
      console.log(`${doc.docNumber} | ${doc.customerName} | ${doc.grandTotal} | paidAt: ${d.toISOString()} | ref: ${doc.relatedDocId}`);
    }
  }

  console.log('--- PAYMENT NOTES ---');
  for (const doc of paymentNotes as any[]) {
    const d = new Date(doc.paidAt || doc.issuedAt);
    if (d.getDate() === 1 && d.getMonth() === 7 && d.getFullYear() === 2026) {
      console.log(`${doc.docNumber} | ${doc.customerName} | ${doc.grandTotal} | paidAt: ${d.toISOString()} | ref: ${doc.relatedDocId}`);
    }
  }

  console.log('--- CREDIT NOTES ---');
  for (const doc of creditNotes as any[]) {
    const d = new Date(doc.issuedAt);
    if (d.getDate() === 1 && d.getMonth() === 7 && d.getFullYear() === 2026) {
      console.log(`${doc.docNumber} | ${doc.customerName} | ${doc.grandTotal} | issuedAt: ${d.toISOString()}`);
    }
  }

  process.exit(0);
}

main().catch(console.error);
