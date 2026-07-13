import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const uri = readFileSync('.env.local','utf8').match(/MONGODB_URI=(.+)/)?.[1]?.trim();
await mongoose.connect(uri);
const moves = mongoose.connection.collection('stockmovements');
const products = mongoose.connection.collection('products');

// กลุ่มรับเข้าอัตโนมัติจาก PO ที่ซ้ำ (refNo + product เดียวกัน)
const groups = await moves.aggregate([
  { $match: { type: 'in', note: { $regex: '^รับสินค้าจาก PO' } } },
  { $group: { _id: { refNo: '$refNo', productId: '$productId' }, ids: { $push: '$_id' }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } },
]).toArray();

let deleted = 0, stockFixed = 0, stockSkipped = 0;
for (const g of groups) {
  const { refNo, productId } = g._id;
  const ins = await moves.find({ type: 'in', refNo, productId, note: { $regex: '^รับสินค้าจาก' } }).sort({ createdAt: 1 }).toArray();
  // ใบที่เคยยกเลิกแล้วรับใหม่ = รับได้มากกว่า 1 ครั้งโดยชอบ (มี movement คืนสินค้าจากยกเลิกคั่น)
  const cancels = await moves.countDocuments({ type: 'out', refNo, productId, note: { $regex: '^คืนสินค้าจากยกเลิก' } });
  const allowed = 1 + cancels;
  const extras = ins.slice(allowed);
  for (const ex of extras) {
    // ถ้ามีการ "ปรับสต๊อก (ตรวจนับ)" หลังรายการซ้ำนี้ = ร้านนับของจริงแล้ว ไม่แตะสต๊อก แค่ลบประวัติซ้ำ
    const adjustedAfter = await moves.findOne({ type: 'adjust', productId, createdAt: { $gt: ex.createdAt } });
    console.log(`${APPLY ? 'ลบ' : '[dry-run] จะลบ'} ${refNo} · ${ex.productName} · qty ${ex.qty} · ${new Date(ex.createdAt).toISOString()}${adjustedAfter ? ' (มีตรวจนับทีหลัง — ไม่แก้สต๊อก)' : ' (หักสต๊อกคืน -' + ex.qty + ')'}`);
    if (APPLY) {
      await moves.deleteOne({ _id: ex._id });
      deleted++;
      if (!adjustedAfter) {
        await products.updateOne({ _id: ex.productId }, { $inc: { stock: -ex.qty } });
        stockFixed++;
      } else stockSkipped++;
    }
  }
}
console.log(APPLY ? `\nลบแล้ว ${deleted} รายการ · แก้สต๊อก ${stockFixed} · ไม่แตะสต๊อก(มีตรวจนับ) ${stockSkipped}` : '\n(dry-run เท่านั้น — ยังไม่แก้อะไร)');
await mongoose.disconnect();
