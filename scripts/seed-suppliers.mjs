import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://raredropdevwooyou_db_user:cmVdfLcTHCwrk3bq@thenutyang.eqmmvdf.mongodb.net/?appName=thenutyang';

const suppliers = [
  {
    name:    'บริษัท มิชลิน (ประเทศไทย) จำกัด',
    address: '689 ภิรัช ทาวเวอร์ แอท เอ็มควอเทียร์ ชั้น 21 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
    contact: 'คุณสมชาย วงศ์ไทย',
    phone:   '02-685-9000',
    email:   'sales.th@michelin.com',
    taxId:   '0105534001234',
  },
  {
    name:    'บริดจสโตน เซลส์ (ประเทศไทย) จำกัด',
    address: '175 อาคารสาทรซิตี้ทาวเวอร์ ชั้น 20 ถ.สาทรใต้ แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพฯ 10120',
    contact: 'คุณวิชัย ประสงค์ดี',
    phone:   '02-285-7000',
    email:   'sales@bridgestone.co.th',
    taxId:   '0105534005678',
  },
  {
    name:    'ยางโยโกฮาม่า ไทย จำกัด',
    address: '388 ถ.สี่พระยา แขวงสี่พระยา เขตบางรัก กรุงเทพฯ 10500',
    contact: 'คุณนิรันดร์ รุ่งเรือง',
    phone:   '02-267-1000',
    email:   'sales@yokohama.co.th',
    taxId:   '0105534009012',
  },
  {
    name:    'ดันลอป ไทร์ ประเทศไทย จำกัด',
    address: '62/1 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310',
    contact: 'คุณสุดาพร มั่นคง',
    phone:   '02-643-5000',
    email:   'sales@dunlop.co.th',
    taxId:   '0105534003456',
  },
  {
    name:    'บริษัท กู๊ดเยียร์ ไทยแลนด์ จำกัด',
    address: '1 ซ.เฉยพ่วง ถ.วิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
    contact: 'คุณประเสริฐ ชำนาญ',
    phone:   '02-955-0500',
    email:   'sales@goodyear.co.th',
    taxId:   '0105534007890',
  },
  {
    name:    'ปิเรลลี่ ไทยแลนด์ จำกัด',
    address: '345 อาคารพาร์คเวนเชอร์ ชั้น 15 ถ.วิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330',
    contact: 'คุณอรรถพล บุญมี',
    phone:   '02-655-2000',
    email:   'sales@pirelli.co.th',
    taxId:   '0105534002345',
  },
  {
    name:    'คอนติเนนทัล ไทร์ส (ประเทศไทย) จำกัด',
    address: '191 อาคารซิลลิค ชั้น 22 ถ.สีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500',
    contact: 'คุณธีรยุทธ สุขใจ',
    phone:   '02-234-8000',
    email:   'sales@continental.co.th',
    taxId:   '0105534006789',
  },
];

const client = new MongoClient(MONGODB_URI);
await client.connect();
const col = client.db().collection('suppliers');

let inserted = 0;
for (const sup of suppliers) {
  const exists = await col.findOne({ name: sup.name });
  if (!exists) {
    await col.insertOne({ ...sup, createdAt: new Date() });
    console.log(`✅ ${sup.name}`);
    inserted++;
  } else {
    console.log(`⏭  มีอยู่แล้ว: ${sup.name}`);
  }
}

console.log(`\nเสร็จ — เพิ่ม ${inserted} ซัพพลายเออร์`);
await client.close();
