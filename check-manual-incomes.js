const { Income } = require('./src/models/Income');
const connectDB = require('./src/lib/mongodb').default;
connectDB().then(async () => {
  const monthStart = new Date(2026, 6, 1);
  const nextMonthStart = new Date(2026, 7, 1);
  // manual incomes = no documentId or documentId is null
  const manualIncomes = await Income.find({ incomeDate: { $gte: monthStart, $lt: nextMonthStart }, documentId: { $exists: false } }).lean();
  console.log('Manual Incomes without documentId:', manualIncomes);
  
  const manualIncomes2 = await Income.find({ incomeDate: { $gte: monthStart, $lt: nextMonthStart }, documentId: null }).lean();
  console.log('Manual Incomes with null documentId:', manualIncomes2);
  
  process.exit(0);
});
