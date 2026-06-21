import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const collections = await mongoose.connection.db?.listCollections().toArray();
  for (const c of collections || []) {
    const count = await mongoose.connection.db?.collection(c.name).countDocuments();
    if (count && count > 0) {
      console.log(`${c.name}: ${count}`);
    }
  }
  await mongoose.disconnect();
}
check().catch(console.error);
