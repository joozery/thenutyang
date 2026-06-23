import { Schema, model, models } from 'mongoose';

export interface ICarBrand {
  name: string;
  createdAt: Date;
}

const CarBrandSchema = new Schema<ICarBrand>({
  name:      { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export const CarBrand = models.CarBrand ?? model<ICarBrand>('CarBrand', CarBrandSchema);
