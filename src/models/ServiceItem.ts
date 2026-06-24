import { Schema, model, models } from 'mongoose';

// แคตตาล็อกรายการ "บริการ/ค่าแรง" (เช่น ค่าแรงช่าง ค่าตั้งศูนย์ ค่าถ่วงล้อ) ใช้เลือกเป็นรายการในบิล แยกจาก Service ที่เป็นเนื้อหาหน้าเว็บ
export interface IServiceItem {
  name: string;
  price: number;
  unit: string;
  note: string;
  createdAt: Date;
}

const ServiceItemSchema = new Schema<IServiceItem>({
  name:      { type: String, required: true },
  price:     { type: Number, required: true, default: 0 },
  unit:      { type: String, default: 'ครั้ง' },
  note:      { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export const ServiceItem = models.ServiceItem ?? model<IServiceItem>('ServiceItem', ServiceItemSchema);
