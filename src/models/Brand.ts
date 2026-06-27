import { Schema, model, models } from 'mongoose';

export type BrandProductType = 'tires' | 'wheels' | 'accessories' | 'brakes' | 'shock' | 'oil';

export interface IBrand {
  name: string;
  logo: string;
  productType: BrandProductType;
  createdAt: Date;
}

const BrandSchema = new Schema<IBrand>({
  name:        { type: String, required: true },
  logo:        { type: String, default: '' },
  productType: { type: String, enum: ['tires','wheels','accessories','brakes','shock','oil'], default: 'tires' },
  createdAt:   { type: Date, default: Date.now },
});

// index ร่วมกัน name+productType ต้อง unique เพราะแบรนด์เดียวกันอาจอยู่ได้หลายหมวด
BrandSchema.index({ name: 1, productType: 1 }, { unique: true });

export const Brand = models.Brand ?? model<IBrand>('Brand', BrandSchema);
