const { Income } = require('./src/models/Income');
const { FinancialDocument } = require('./src/models/FinancialDocument');
const connectDB = require('./src/lib/mongodb').default;

connectDB().then(async () => {
  console.log('--- Starting Fix ---');

  // Fix 1: Delete duplicate income for INV-2026-0202
  const delRes = await Income.deleteOne({ note: 'อ้างอิงเอกสาร INV-2026-0202' });
  console.log('Deleted duplicate Income for INV-2026-0202:', delRes.deletedCount);
  
  // Link INV-2026-0202 to BN-2026-0001 so it acts like an auto-generated invoice
  const bn1 = await FinancialDocument.findOne({ docNumber: 'BN-2026-0001' }).lean();
  if (bn1) {
    const updInv = await FinancialDocument.updateOne({ docNumber: 'INV-2026-0202' }, { $set: { relatedDocId: bn1._id, relatedDocNumber: bn1.docNumber } });
    console.log('Linked INV-2026-0202 to BN-2026-0001:', updInv.modifiedCount);
  }

  // Fix 2: Sync BN-2026-0008 and its Payment Note / Income to match INV-2026-0554 (12700 instead of 12800)
  const bn8 = await FinancialDocument.findOne({ docNumber: 'BN-2026-0008' }).lean();
  if (bn8) {
    await FinancialDocument.updateOne({ _id: bn8._id }, { $set: { grandTotal: 12700 } });
    console.log('Updated BN-2026-0008 to 12700');
    
    // Update its Payment Note
    const pn8 = await FinancialDocument.findOne({ relatedDocId: bn8._id, type: 'payment_note' }).lean();
    if (pn8) {
      await FinancialDocument.updateOne({ _id: pn8._id }, { $set: { grandTotal: 12700, subtotal: 12700, 'items.0.unitPrice': 12700, 'items.0.lineTotal': 12700 } });
      console.log('Updated Payment Note to 12700');
      
      // Update the Income
      await Income.updateOne({ note: `อ้างอิงใบรับชำระ ${pn8.docNumber}` }, { $set: { amount: 12700 } });
      console.log('Updated Income to 12700');
    }
  }

  console.log('--- Fix Complete ---');
  process.exit(0);
});
