import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import connectDB from './src/lib/mongodb';
import { FinancialDocument } from './src/models/FinancialDocument';
import { Income } from './src/models/Income';

async function main() {
  await connectDB();
  
  const now = new Date('2026-08-03T00:00:00Z');
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const invoices = await FinancialDocument.find({
    type: 'invoice',
    issuedAt: { $gte: monthStart, $lt: nextMonthStart },
  }).lean();
  
  const incomes = await Income.find({
    incomeDate: { $gte: monthStart, $lt: nextMonthStart }
  }).lean();

  const totalInvoice = invoices.filter(d => d.status === 'paid').reduce((s, d) => s + d.grandTotal, 0);
  const totalIncome = incomes.reduce((s, d) => s + d.amount, 0);

  console.log(`--- SUMMARY ---`);
  console.log(`Total Sales (Paid Invoices with issuedAt in Aug): ${totalInvoice}`);
  console.log(`Total Income (incomeDate in Aug): ${totalIncome}`);
  console.log(`Difference (Income - Sales): ${totalIncome - totalInvoice}`);

  console.log('\n--- Incomes without an Invoice issued in Aug ---');
  for (const inc of incomes) {
    const matchedInvoice = invoices.find(inv => 
      (inc.documentId && inc.documentId.toString() === inv._id.toString()) ||
      (inc.description && inc.description.includes(inv.docNumber))
    );
    if (!matchedInvoice) {
      console.log(`Income: ${inc.description} | Amount: ${inc.amount} | Date: ${inc.incomeDate}`);
    }
  }
  
  process.exit(0);
}

main().catch(console.error);
