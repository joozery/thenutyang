import 'dotenv/config';
import mongoose from 'mongoose';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const start = new Date(2026, 6, 1); // July 1, 2026
  const end = new Date(2026, 7, 0, 23, 59, 59, 999); // July 31, 2026

  const db = mongoose.connection.db;

  // 1. General Expenses
  const expenses = await db.collection('expenses').find({
    category: { $ne: 'PurchaseOrder' },
    expenseDate: { $gte: start, $lte: end }
  }).toArray();

  let totalMisc = 0;
  const byCategory = {};
  for (const exp of expenses) {
    totalMisc += exp.amount;
    byCategory[exp.category || 'อื่นๆ'] = (byCategory[exp.category || 'อื่นๆ'] || 0) + exp.amount;
  }

  // 2. Purchase Orders
  const pos = await db.collection('purchaseorders').find({
    status: 'received',
    paymentStatus: { $in: ['partial', 'paid'] },
    paymentDate: { $gte: start, $lte: end }
  }).toArray();

  let totalPO = 0;
  for (const po of pos) {
    totalPO += po.amountPaid;
  }

  // 3. Payslips
  const payslips = await db.collection('payslips').find({
    status: 'paid',
    paidAt: { $gte: start, $lte: end }
  }).toArray();

  let totalPayroll = 0;
  for (const p of payslips) {
    totalPayroll += p.netPay;
  }

  const grandTotal = totalMisc + totalPO + totalPayroll;

  console.log('\n--- EXPENSE SUMMARY (JULY 2026) ---');
  console.log('Grand Total:', grandTotal.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }));
  
  console.log('\n--- BY MAIN BUCKET ---');
  console.log(`1. ต้นทุนสินค้า (จัดซื้อ): ${totalPO.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })} (จาก ${pos.length} บิล)`);
  console.log(`2. เงินเดือน/ค่าแรง: ${totalPayroll.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })} (จาก ${payslips.length} รายการ)`);
  console.log(`3. ค่าใช้จ่ายอื่นๆ: ${totalMisc.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })} (จาก ${expenses.length} รายการ)`);

  console.log('\n--- MISC EXPENSES BY CATEGORY ---');
  for (const [cat, val] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`${cat}: ${val.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
