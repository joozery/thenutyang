const { FinancialDocument } = require('./src/models/FinancialDocument');
const connectDB = require('./src/lib/mongodb').default;

connectDB().then(async () => {
  const bns = await FinancialDocument.find({ type: 'billing_note' }).lean();
  let withRef = 0;
  for (const b of bns) {
    if (b.relatedDocId || (b.metadata && b.metadata.invoiceIds && b.metadata.invoiceIds.length > 0)) {
      withRef++;
      console.log('BN with ref:', b.docNumber, b.metadata);
    }
  }
  console.log('Total BN with ref:', withRef);
  process.exit(0);
});
