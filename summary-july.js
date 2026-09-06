import 'dotenv/config';
import mongoose from 'mongoose';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const start = new Date(2026, 6, 1); // July 1, 2026
  const end = new Date(2026, 7, 0, 23, 59, 59, 999); // July 31, 2026

  const db = mongoose.connection.db;

  const invoices = await db.collection('financialdocuments').find({
    type: 'invoice',
    status: 'paid',
    issuedAt: { $gte: start, $lte: end }
  }).toArray();

  let total = 0;
  for (const inv of invoices) {
    total += inv.grandTotal;
  }

  console.log('Invoices count:', invoices.length);
  console.log('Total grandTotal:', total.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }));

  // Group by day
  const byDay = {};
  for (const inv of invoices) {
    const day = inv.issuedAt.toISOString().split('T')[0];
    byDay[day] = (byDay[day] || 0) + inv.grandTotal;
  }

  console.log('\nBy Day:');
  for (const [day, val] of Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`${day}: ${val.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}`);
  }

  // Top 5 invoices
  console.log('\nTop 5 Invoices:');
  const topInvoices = invoices.sort((a, b) => b.grandTotal - a.grandTotal).slice(0, 5);
  for (const inv of topInvoices) {
    console.log(`${inv.documentNo} (${inv.issuedAt.toISOString().split('T')[0]}): ${inv.grandTotal.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
