import { Schema, model, models } from 'mongoose';

export type ProductType = string;

export interface IProduct {
  productType: string;
  brand: string;
  model: string;
  size: string;
  rimSize: number;
  type: string;
  note: string;
  description: string; // รายละเอียดสินค้า — แสดงบนหน้ารายละเอียด
  warranty: string;    // เงื่อนไขประกัน เช่น "รับประกัน 2 ปี หรือ 50,000 กม."
  priceCash: number;
  priceCredit: number;
  priceInstallment: number;
  costPrice: number;
  oldPrice?: number;
  badge?: string;
  image: string;
  images: string[]; // รูปเพิ่มเติม (แกลเลอรี) — image คือรูปหลัก
  category: string;
  specs: { load: string; speed: string; type: string };
  stock: number;
  year: string;
  published: boolean;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  productType:      { type: String, default: 'tires' },
  brand:            { type: String, required: true },
  model:            { type: String, required: true },
  size:             { type: String, default: '' },
  rimSize:          { type: Number, default: 0 },
  type:             { type: String, default: '' },
  note:             { type: String, default: '' },
  description:      { type: String, default: '' },
  warranty:         { type: String, default: '' },
  priceCash:        { type: Number, required: true },
  priceCredit:      { type: Number, required: true },
  priceInstallment: { type: Number, required: true },
  costPrice:        { type: Number, default: 0 },
  oldPrice:         { type: Number },
  badge:            { type: String },
  image:            { type: String, default: '/yang.png' },
  images:           { type: [String], default: [] },
  category:         { type: String, default: 'touring' },
  specs: {
    load:  { type: String, default: '' },
    speed: { type: String, default: '' },
    type:  { type: String, default: '' },
  },
  stock:     { type: Number, required: true, default: 0 },
  year:      { type: String, default: '26' },
  published: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Product = models.Product ?? model<IProduct>('Product', ProductSchema);
