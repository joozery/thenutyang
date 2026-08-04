require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const movementSchema = new mongoose.Schema({}, { strict: false });
  const Movement = mongoose.models.StockMovement || mongoose.model('StockMovement', movementSchema, 'stockmovements');

  const count = await Movement.countDocuments();
  console.log(`Total movements: ${count}`);

  const moves = await Movement.find({}).sort({ createdAt: -1 }).limit(300).lean();
  const mslhMove = moves.find(m => m.productName.includes('MSLH'));
  console.log(`Is MSLH in the top 300?`, mslhMove ? 'Yes' : 'No');

  process.exit(0);
}

main().catch(console.error);
