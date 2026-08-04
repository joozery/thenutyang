require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const productSchema = new mongoose.Schema({}, { strict: false });
  const Product = mongoose.models.Product || mongoose.model('Product', productSchema, 'products');
  
  const movementSchema = new mongoose.Schema({}, { strict: false });
  const Movement = mongoose.models.StockMovement || mongoose.model('StockMovement', movementSchema, 'stockmovements');

  const products = await Product.find({}).lean();
  const allMovements = await Movement.find({}).lean();

  // Create a Set of productIds that have movements
  // Note: some movements store productId as string, some as ObjectId, so we stringify all
  const productsWithMovements = new Set(
    allMovements.map(m => m.productId ? m.productId.toString() : null).filter(Boolean)
  );

  let noHistoryStockGt0 = [];
  let noHistoryStock0 = [];

  for (const p of products) {
    const idStr = p._id.toString();
    if (!productsWithMovements.has(idStr)) {
      const stock = p.stock || 0;
      const name = `${p.brand || ''} ${p.model || ''} ${p.size || ''}`.trim();
      if (stock > 0) {
        noHistoryStockGt0.push({ id: idStr, name, stock });
      } else {
        noHistoryStock0.push({ id: idStr, name, stock });
      }
    }
  }

  console.log(`\n=== สรุปผลการตรวจสอบ ===`);
  console.log(`จำนวนสินค้าทั้งหมดในระบบ: ${products.length}`);
  console.log(`จำนวนสินค้าที่มีประวัติการเคลื่อนไหว: ${productsWithMovements.size}`);
  console.log(`จำนวนสินค้าที่ **ไม่มี** ประวัติการเคลื่อนไหว: ${noHistoryStockGt0.length + noHistoryStock0.length}`);
  
  if (noHistoryStockGt0.length > 0) {
    console.log(`\n🚨 พบสินค้าที่ "มีสต็อก > 0 แต่ไม่มีประวัติรับเข้า/เบิกออก" (${noHistoryStockGt0.length} รายการ):`);
    noHistoryStockGt0.forEach(p => console.log(`  - [สต็อก: ${p.stock}] ${p.name}`));
  } else {
    console.log(`\n✅ ไม่พบสินค้าที่มีสต็อกแต่ไม่มีประวัติ (ข้อมูลถูกต้อง)`);
  }

  if (noHistoryStock0.length > 0) {
    console.log(`\nℹ️ สินค้าที่ยังไม่มีประวัติการเคลื่อนไหวเลย (และสต็อก = 0) มีจำนวน ${noHistoryStock0.length} รายการ (ปกติ)`);
    // Optionally list a few
    noHistoryStock0.slice(0, 5).forEach(p => console.log(`  - ${p.name}`));
    if (noHistoryStock0.length > 5) console.log(`  ... และอื่นๆ อีก ${noHistoryStock0.length - 5} รายการ`);
  }

  process.exit(0);
}

main().catch(console.error);
