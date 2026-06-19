import { Schema, model, models } from 'mongoose';

export interface IProduct {
  brand: string;
  model: string;
  size: string;
  rimSize: number;
  type: string;
  note: string;
  priceCash: number;
  priceCredit: number;
  priceInstallment: number;
  oldPrice?: number;
  badge?: string;
  image: string;
  category: 'touring' | 'sport' | 'eco' | 'suv' | 'allseason';
  specs: { load: string; speed: string; type: string };
  stock: number;
  year: string;
  published: boolean;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  brand:            { type: String, required: true },
  model:            { type: String, required: true },
  size:             { type: String, required: true },
  rimSize:          { type: Number, required: true },
  type:             { type: String, default: '' },
  note:             { type: String, default: '' },
  priceCash:        { type: Number, required: true },
  priceCredit:      { type: Number, required: true },
  priceInstallment: { type: Number, required: true },
  oldPrice:         { type: Number },
  badge:            { type: String },
  image:            { type: String, default: '/yang.png' },
  category:         { type: String, enum: ['touring', 'sport', 'eco', 'suv', 'allseason'], default: 'touring' },
  specs: {
    load:  { type: String, default: '91' },
    speed: { type: String, default: 'V' },
    type:  { type: String, default: 'ยางทั่วไป' },
  },
  stock:     { type: Number, required: true, default: 0 },
  year:      { type: String, default: '26' },
  published: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Product = models.Product ?? model<IProduct>('Product', ProductSchema);
