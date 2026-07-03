import { Schema, model, models } from 'mongoose';

export interface IProductTypeConfig {
  key: string;
  label: string;
  icon: string;
  unit: string;
  order: number;
  createdAt: Date;
}

const ProductTypeConfigSchema = new Schema<IProductTypeConfig>({
  key:       { type: String, required: true, unique: true },
  label:     { type: String, required: true },
  icon:      { type: String, default: 'Package' },
  unit:      { type: String, default: 'ชิ้น' },
  order:     { type: Number, default: 99 },
  createdAt: { type: Date, default: Date.now },
});

export const ProductTypeConfig = models.ProductTypeConfig ?? model<IProductTypeConfig>('ProductTypeConfig', ProductTypeConfigSchema);
