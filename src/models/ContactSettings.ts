import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContactSettings extends Document {
  address: string;
  phoneMain: string;
  phoneMainLabel: string;
  phoneSale: string;
  phoneSaleLabel: string;
  lineId: string;
  lineLabel: string;
  email: string;
  workingHours: string;
  workingDays: string;
  googleMapUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDesc: string;
  heroImage: string;
  updatedAt: Date;
}

const ContactSettingsSchema: Schema = new Schema({
  address: { type: String, required: true, default: 'เดอะนัทยางยนต์ (THE NUT TIRE)\\nถนน... ตำบล... อำเภอ...\\nจังหวัด... 12345' },
  phoneMain: { type: String, required: true, default: '099-999-9999' },
  phoneMainLabel: { type: String, default: 'คุณนัท' },
  phoneSale: { type: String, required: true, default: '088-888-8888' },
  phoneSaleLabel: { type: String, default: 'ฝ่ายขาย' },
  lineId: { type: String, required: true, default: '@thenuttire' },
  lineLabel: { type: String, default: 'มี @ ด้วยนะครับ' },
  email: { type: String, required: true, default: 'contact@thenuttire.com' },
  workingHours: { type: String, required: true, default: '08:00 - 18:00 น.' },
  workingDays: { type: String, required: true, default: 'จันทร์ - อาทิตย์' },
  googleMapUrl: { type: String, required: true, default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15502.830635414603!2d100.510000!3d13.730000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQzJzQ4LjAiTiAxMDDCsDMwJzM2LjAiRQ!5e0!3m2!1sth!2sth!4v1620000000000!5m2!1sth!2sth' },
  heroTitle: { type: String, default: 'ติดต่อเรา' },
  heroSubtitle: { type: String, default: 'THE NUT TIRE' },
  heroDesc: { type: String, default: 'สอบถามข้อมูลเพิ่มเติม จองคิวเปลี่ยนยาง\\nหรือปรึกษาปัญหาเรื่องรถยนต์ เราพร้อมดูแลคุณ' },
  heroImage: { type: String, default: '/yang.png' },
}, {
  timestamps: true
});

const ContactSettings: Model<IContactSettings> = mongoose.models.ContactSettings || mongoose.model<IContactSettings>('ContactSettings', ContactSettingsSchema);

export default ContactSettings;
