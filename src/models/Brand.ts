import { Schema, model, models } from 'mongoose';

export interface IBrand {
  name: string;
  logo: string;
  createdAt: Date;
}

const BrandSchema = new Schema<IBrand>({
  name:      { type: String, required: true, unique: true },
  logo:      { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export const Brand = models.Brand ?? model<IBrand>('Brand', BrandSchema);
