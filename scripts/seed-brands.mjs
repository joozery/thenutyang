import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://raredropdevwooyou_db_user:cmVdfLcTHCwrk3bq@thenutyang.eqmmvdf.mongodb.net/?appName=thenutyang';

const brands = [
  { name: 'MICHELIN',    logo: '/brand/michelin-7-logo-svgrepo-com.svg' },
  { name: 'BRIDGESTONE', logo: '/brand/bridgestone-26989.svg' },
  { name: 'YOKOHAMA',    logo: '/brand/yokohama-logo.svg' },
  { name: 'DUNLOP',      logo: '/brand/dunlop-sport.svg' },
  { name: 'GOODYEAR',    logo: '/brand/goodyear-tire-1.svg' },
  { name: 'CONTINENTAL', logo: '/brand/continental-2-1.svg' },
  { name: 'PIRELLI',     logo: '/brand/pirelli-2.svg' },
];

const client = new MongoClient(MONGODB_URI);
await client.connect();
const col = client.db().collection('brands');

let inserted = 0;
for (const brand of brands) {
  const exists = await col.findOne({ name: brand.name });
  if (!exists) {
    await col.insertOne({ ...brand, createdAt: new Date() });
    console.log(`✅ ${brand.name}`);
    inserted++;
  } else {
    console.log(`⏭  มีอยู่แล้ว: ${brand.name}`);
  }
}

console.log(`\nเสร็จ — เพิ่ม ${inserted} แบรนด์`);
await client.close();
