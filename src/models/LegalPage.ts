import { Schema, model, models } from 'mongoose';

// หน้าเอกสารนโยบาย (ความเป็นส่วนตัว / เงื่อนไขการใช้บริการ) — แก้ไขได้จากหลังบ้าน
export interface ILegalPage {
  key: 'privacy' | 'terms';
  title: string;
  content: string; // ข้อความล้วน ขึ้นบรรทัดใหม่ตามที่พิมพ์
  updatedAt: Date;
}

const LegalPageSchema = new Schema<ILegalPage>({
  key:     { type: String, required: true, unique: true, enum: ['privacy', 'terms'] },
  title:   { type: String, required: true },
  content: { type: String, default: '' },
}, { timestamps: true });

export const LegalPage = models.LegalPage ?? model<ILegalPage>('LegalPage', LegalPageSchema);
