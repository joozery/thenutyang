import mongoose, { Schema, model, models } from 'mongoose';

export interface IBooking {
  ref: string;
  tireId: string;
  tireName: string;
  tirePrice: number;
  quantity: number;
  name: string;
  phone: string;
  lineId: string;
  carModel: string;
  carYear: string;
  appointmentDate: string;
  note: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  lineUserId?: string;
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  ref:             { type: String, required: true, unique: true },
  tireId:          { type: String, required: true },
  tireName:        { type: String, required: true },
  tirePrice:       { type: Number, required: true },
  quantity:        { type: Number, required: true, default: 4 },
  name:            { type: String, required: true },
  phone:           { type: String, required: true },
  lineId:          { type: String, required: true },
  carModel:        { type: String, required: true },
  carYear:         { type: String, required: true },
  appointmentDate: { type: String, required: true },
  note:            { type: String, default: '' },
  status:          { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  lineUserId:      { type: String },
  createdAt:       { type: Date, default: Date.now },
});

export const Booking = models.Booking ?? model<IBooking>('Booking', BookingSchema);
