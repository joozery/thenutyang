import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/thenutyang";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const serviceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    description: [{ type: String }],
    icon: { type: String, required: true },
    color: { type: String, required: true },
    isBestSeller: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  }, { timestamps: true });

  const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

  await Service.deleteMany({});
  
  await Service.insertMany([
    {
      title: "รับประกันยาง",
      subtitle: "2 ปีเต็ม",
      description: ["รับประกันเคลมฟรีทุกกรณี ตามเงื่อนไขของยี่ห้อนั้นๆกำหนด", "รับประกัน 2 ปี กรณีเกิดจากการผลิต กรณีบวมบนยาง (แก้มไม่เกี่ยว)"],
      icon: "ShieldCheck",
      color: "blue",
      isBestSeller: true,
      order: 1
    },
    {
      title: "สลับยางฟรี",
      subtitle: "ทุก 10,000 กม.",
      description: ["สลับยางฟรีทุกๆ 10,000 กิโลเมตร หรือทุกๆ 6 เดือน", "ไม่จำกัดจำนวนครั้ง ตลอดอายุการใช้งาน"],
      icon: "RefreshCw",
      color: "orange",
      isBestSeller: false,
      order: 2
    },
    {
      title: "ปะยางฟรี",
      subtitle: "ตลอดอายุการใช้งาน",
      description: ["ปะยางแบบแทงไหม/แทงหนอนรถยนต์ ไม่จำกัดจำนวนครั้ง (แจ้งช่างว่าปะฟรี)", "หากไม่แจ้ง จะเป็นการถอดปะสตรีมร้อน มีค่าบริการ 200-400 บาท"],
      icon: "Wrench",
      color: "purple",
      isBestSeller: false,
      order: 3
    },
    {
      title: "จุ๊บลม ถ่วงล้อ ตั้งศูนย์",
      subtitle: "รับประกัน 3 เดือน",
      description: ["จุ๊บลมยาง: หากมีปัญหาเปลี่ยนตัวใหม่ทันที", "ถ่วงล้อ: หากพวงมาลัยสั่น ถ่วงล้อใหม่ฟรี", "ตั้งศูนย์: หากดึงหรือพวงมาลัยไม่ตรง ตั้งศูนย์ใหม่ฟรี"],
      icon: "Settings",
      color: "red",
      isBestSeller: false,
      order: 4
    },
    {
      title: "ลมไนโตรเจนฟรี",
      subtitle: "ตลอดอายุการใช้งาน",
      description: ["เติมลมไนโตรเจนให้ฟรี ตลอดอายุการใช้งาน ไม่จำกัดจำนวนครั้ง", "ช่วยรักษาแรงดันลมยางให้คงที่ และยืดอายุการใช้งานของยาง"],
      icon: "Wind",
      color: "green",
      isBestSeller: false,
      order: 5
    }
  ]);

  console.log("Services seeded successfully.");
  mongoose.disconnect();
}

main().catch(console.error);
