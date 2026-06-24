import mongoose, { Schema, model, models } from 'mongoose';

export interface IBooking {
  ref: string;
  orderRef: string;
  tireId: string;
  tireName: string;
  tirePrice: number;
  quantity: number;
  name: string;
  customerType: 'individual' | 'corporate';
  companyName: string;
  phone: string;
  lineId: string;
  carBrand: string;
  carModel: string;
  carYear: string;
  licensePlate: string;
  mileageBefore: number | null;
  mileageAfter: number | null;
  address: string;
  taxId: string;
  appointmentDate: string;
  note: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  lineUserId?: string;
  depositAmount: number;
  depositSlipUrl: string;
  depositStatus: 'pending' | 'submitted' | 'verified' | 'not_required';
  depositVerifyNote: string;
  depositPaidAt: Date | null;
  depositRefunded: boolean;
  depositRefundedAt: Date | null;
  balanceStatus: 'unpaid' | 'paid';
  balancePaymentMethod: 'cash' | 'transfer' | 'credit_card' | '';
  balancePaidAt: Date | null;
  balanceReceivedAmount: number | null;
  balanceSlipUrl: string;
  balanceVerifyNote: string;
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  ref:             { type: String, required: true, unique: true },
  orderRef:        { type: String, required: true, index: true },
  tireId:          { type: String, required: true },
  tireName:        { type: String, required: true },
  tirePrice:       { type: Number, required: true },
  quantity:        { type: Number, required: true, default: 4 },
  name:            { type: String, required: true },
  customerType:    { type: String, enum: ['individual', 'corporate'], default: 'individual' },
  companyName:     { type: String, default: '' },
  phone:           { type: String, required: true },
  lineId:          { type: String, default: '' },
  carBrand:        { type: String, default: '' },
  carModel:        { type: String, default: '' },
  carYear:         { type: String, default: '' },
  licensePlate:    { type: String, default: '' },
  mileageBefore:   { type: Number, default: null },
  mileageAfter:    { type: Number, default: null },
  address:         { type: String, default: '' },
  taxId:           { type: String, default: '' },
  appointmentDate: { type: String, required: true },
  note:            { type: String, default: '' },
  status:          { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  lineUserId:      { type: String },
  depositAmount:     { type: Number, default: 1000 },
  depositSlipUrl:    { type: String, default: '' },
  depositStatus:     { type: String, enum: ['pending', 'submitted', 'verified', 'not_required'], default: 'pending' },
  depositVerifyNote: { type: String, default: '' },
  depositPaidAt:     { type: Date, default: null },
  depositRefunded:   { type: Boolean, default: false },
  depositRefundedAt: { type: Date, default: null },
  balanceStatus:        { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  balancePaymentMethod: { type: String, enum: ['cash', 'transfer', 'credit_card', ''], default: '' },
  balancePaidAt:        { type: Date, default: null },
  balanceReceivedAmount: { type: Number, default: null },
  balanceSlipUrl:       { type: String, default: '' },
  balanceVerifyNote:    { type: String, default: '' },
  createdAt:       { type: Date, default: Date.now },
});

export const Booking = models.Booking ?? model<IBooking>('Booking', BookingSchema);
