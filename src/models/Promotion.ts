import mongoose, { Schema, model, models } from 'mongoose';

export interface IPromotion {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  bgImage: string;
  icon: string;
  validUntil: string;
  order: number;
  published: boolean;
}

const PromotionSchema = new Schema<IPromotion>({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  buttonText: { type: String, default: 'ดูรายละเอียด' },
  buttonLink: { type: String, default: '/' },
  bgImage: { type: String, default: 'from-green-600 to-emerald-800' },
  icon: { type: String, default: 'Sparkles' },
  validUntil: { type: String, default: 'ไม่มีวันหมดอายุ' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true });

export const Promotion = models.Promotion ?? model<IPromotion>('Promotion', PromotionSchema);
