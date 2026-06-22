import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IService extends Document {
  title: string;
  subtitle: string;
  description: string[];
  icon: string;
  color: string;
  isBestSeller: boolean;
  order: number;
}

const ServiceSchema: Schema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: [{ type: String }],
  icon: { type: String, required: true },
  color: { type: String, required: true },
  isBestSeller: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export const Service: Model<IService> = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
