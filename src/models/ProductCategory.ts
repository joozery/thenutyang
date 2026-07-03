import { Schema, model, models } from 'mongoose';

export interface IProductCategory {
  key: string;
  label: string;
  productType: string;
  createdAt: Date;
}

const ProductCategorySchema = new Schema<IProductCategory>({
  key:         { type: String, required: true },
  label:       { type: String, required: true },
  productType: { type: String, required: true, default: 'tires' },
  createdAt:   { type: Date, default: Date.now },
});

export const ProductCategory = models.ProductCategory ?? model<IProductCategory>('ProductCategory', ProductCategorySchema);
