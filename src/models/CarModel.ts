import { Schema, model, models, Types } from 'mongoose';

export interface ICarModel {
  name: string;
  brandId: Types.ObjectId;
  createdAt: Date;
}

const CarModelSchema = new Schema<ICarModel>({
  name:      { type: String, required: true },
  brandId:   { type: Schema.Types.ObjectId, ref: 'CarBrand', required: true },
  createdAt: { type: Date, default: Date.now },
});

CarModelSchema.index({ brandId: 1, name: 1 }, { unique: true });

export const CarModel = models.CarModel ?? model<ICarModel>('CarModel', CarModelSchema);
