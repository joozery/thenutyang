import mongoose, { Schema, model, models } from 'mongoose';

export interface IBanner {
  slot: 'main' | 'promo1' | 'promo2';  // main = ซ้ายใหญ่, promo1/2 = ขวาบน/ล่าง
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  bgImage: string;     // path ของภาพพื้นหลัง
  published: boolean;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>({
  slot:        { type: String, enum: ['main', 'promo1', 'promo2'], required: true, unique: true },
  title:       { type: String, required: true },
  subtitle:    { type: String, default: '' },
  buttonText:  { type: String, default: '' },
  buttonLink:  { type: String, default: '/' },
  bgImage:     { type: String, default: '' },
  published:   { type: Boolean, default: true },
  updatedAt:   { type: Date, default: Date.now },
});

export const Banner = models.Banner ?? model<IBanner>('Banner', BannerSchema);
