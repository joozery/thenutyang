const { Supplier } = require('./src/models/Supplier');
const connectDB = require('./src/lib/mongodb').default;
connectDB().then(async () => {
  await Supplier.deleteMany({ _id: { $in: ['6a4f6ebd29e2c870c8114588', '6a4f6efd29e2c870c8114589'] } });
  console.log('Deleted');
  process.exit(0);
});
