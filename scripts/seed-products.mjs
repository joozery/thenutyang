import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://raredropdevwooyou_db_user:cmVdfLcTHCwrk3bq@thenutyang.eqmmvdf.mongodb.net/?appName=thenutyang';

function rimFromSize(size) {
  const m = size.match(/R(\d+)$/i);
  return m ? Number(m[1]) : 15;
}

function creditPrice(cash) { return Math.round(cash * 1.03 * 100) / 100; }
function installmentPrice(cash) { return Math.round(cash * 1.05 * 100) / 100; }

const products = [
  // 155/65R13
  { brand: 'MAXXIS',     model: 'MAP5',             size: '155/65R13', type: '',            note: '',                priceCash: 1500, stock: 14, year: '26', category: 'touring'   },
  { brand: 'GITI',       model: 'T20',              size: '155/65R13', type: '',            note: '',                priceCash: 1960, stock: 8,  year: '26', category: 'touring'   },
  { brand: 'SAILUN',     model: 'ELITE 2',          size: '155/65R13', type: '',            note: '',                priceCash: 1450, stock: 20, year: '26', category: 'touring'   },
  // 185/65R15
  { brand: 'BRIDGESTONE',model: 'TECHNO',           size: '185/65R15', type: '',            note: '',                priceCash: 2050, stock: 20, year: '26', category: 'touring'   },
  { brand: 'YOKOHAMA',   model: 'E70',              size: '185/65R15', type: '',            note: '',                priceCash: 1950, stock: 24, year: '26', category: 'eco'       },
  { brand: 'CONTINENTAL',model: 'CC7',              size: '185/65R15', type: '',            note: '',                priceCash: 1850, stock: 18, year: '26', category: 'touring'   },
  { brand: 'GOODYEAR',   model: 'DURAPLUS 2',       size: '185/65R15', type: '',            note: '4 เส้น ลด 200.-', priceCash: 1800, stock: 28, year: '26', category: 'touring'   },
  { brand: 'DUNLOP',     model: 'SP2030',           size: '185/65R15', type: '',            note: '',                priceCash: 1800, stock: 30, year: '26', category: 'touring'   },
  // 195/65R15
  { brand: 'DAYTON',     model: 'DT30',             size: '195/65R15', type: '',            note: '4 เส้น ลด 200.-', priceCash: 1700, stock: 32, year: '26', category: 'touring'   },
  { brand: 'BRIDGESTONE',model: 'EP150',            size: '195/65R15', type: '',            note: '4 เส้น ลด 400.-', priceCash: 2350, stock: 16, year: '26', category: 'eco'       },
  { brand: 'MICHELIN',   model: 'XM2+',             size: '195/65R15', type: '',            note: '',                priceCash: 3300, stock: 8,  year: '26', category: 'touring',  badge: 'ขายดี' },
  { brand: 'GOODYEAR',   model: 'MAXGUARD',         size: '195/65R15', type: '',            note: '4 เส้น ลด 200.-', priceCash: 2150, stock: 14, year: '26', category: 'touring'   },
  { brand: 'TOYO',       model: 'CR1',              size: '195/65R15', type: '',            note: '',                priceCash: 2300, stock: 22, year: '26', category: 'touring'   },
  { brand: 'DUNLOP',     model: 'EC300+',           size: '195/65R15', type: '',            note: '',                priceCash: 1850, stock: 16, year: '26', category: 'eco'       },
  // 205/55R16
  { brand: 'BRIDGESTONE',model: 'EP300',            size: '205/55R16', type: '',            note: '4 เส้น ลด 400.-', priceCash: 2750, stock: 12, year: '26', category: 'eco'       },
  { brand: 'YOKOHAMA',   model: 'AE51',             size: '205/55R16', type: '',            note: '',                priceCash: 2850, stock: 10, year: '26', category: 'eco'       },
  { brand: 'PIRELLI',    model: 'CINTURATO ROSSO',  size: '205/55R16', type: '',            note: '',                priceCash: 2450, stock: 4,  year: '25', category: 'touring'   },
  { brand: 'DUNLOP',     model: 'LM705',            size: '205/55R16', type: '',            note: '',                priceCash: 2100, stock: 20, year: '26', category: 'touring'   },
  // 215/45R17
  { brand: 'DUNLOP',     model: 'BLUE RESPONSE TG', size: '215/45R17', type: 'EV',         note: '',                priceCash: 2000, stock: 12, year: '26', category: 'sport'     },
  { brand: 'YOKOHAMA',   model: 'V553',             size: '215/45R17', type: 'EV / Non EV',note: '',                priceCash: 2950, stock: 6,  year: '26', category: 'sport'     },
  // 265/65R17
  { brand: 'TOYO',       model: 'H/T2',             size: '265/65R17', type: '',            note: 'ตัวหนังสือขาว',   priceCash: 3100, stock: 8,  year: '26', category: 'suv'       },
  // 185/70R14
  { brand: 'ALLIANCE',   model: 'AL30',             size: '185/70R14', type: '',            note: '',                priceCash: 1800, stock: 40, year: '26', category: 'touring'   },
];

const client = new MongoClient(MONGODB_URI);
await client.connect();
const col = client.db().collection('products');

const existing = await col.countDocuments();
if (existing > 0) {
  console.log(`⏭  มีข้อมูลอยู่แล้ว ${existing} รายการ — ข้ามการ seed`);
  await client.close();
  process.exit(0);
}

const docs = products.map(p => ({
  ...p,
  rimSize: rimFromSize(p.size),
  priceCredit: creditPrice(p.priceCash),
  priceInstallment: installmentPrice(p.priceCash),
  image: '/yang.png',
  specs: { load: '91', speed: 'V', type: 'ยางทั่วไป' },
  published: true,
  createdAt: new Date(),
}));

await col.insertMany(docs);
console.log(`✅ Seed สำเร็จ — เพิ่ม ${docs.length} รายการ`);
await client.close();
