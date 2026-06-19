import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://raredropdevwooyou_db_user:cmVdfLcTHCwrk3bq@thenutyang.eqmmvdf.mongodb.net/?appName=thenutyang';

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, key, 256
  );
  const toHex = (arr) => Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${toHex(salt)}:${toHex(new Uint8Array(bits))}`;
}

const NEW_PASSWORD = 'Thenut@2024';

const client = new MongoClient(MONGODB_URI);
await client.connect();

const db = client.db();
const col = db.collection('adminusers');

const users = await col.find({}, { projection: { username: 1, displayName: 1, role: 1 } }).toArray();
console.log('\n📋 Admin users ที่มีอยู่:');
users.forEach(u => console.log(`   - ${u.username} (${u.displayName}) [${u.role}]`));

// reset รหัสผ่านของ admin คนแรก
const target = users.find(u => u.role === 'super') ?? users[0];
if (target) {
  const passwordHash = await hashPassword(NEW_PASSWORD);
  await col.updateOne({ _id: target._id }, { $set: { passwordHash } });
  console.log(`\n✅ Reset รหัสผ่านสำเร็จ`);
  console.log(`   username : ${target.username}`);
  console.log(`   password : ${NEW_PASSWORD}`);
  console.log(`   role     : ${target.role}`);
}

await client.close();
