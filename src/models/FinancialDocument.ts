import { Schema, model, models } from 'mongoose';

const itemSchema = new Schema({
  description: { type: String, required: true },
  qty:         { type: Number, required: true },
  unitPrice:   { type: Number, required: true },
  discount:    { type: Number, default: 0 },
  lineTotal:   { type: Number, required: true },
}, { _id: false });

const financialDocSchema = new Schema({
  docNumber:     { type: String, required: true, unique: true },
  type:          { type: String, enum: ['invoice', 'quote', 'credit_note'], required: true },
  source:        { type: String, enum: ['booking', 'manual'], default: 'manual' },
  bookingId:     { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
  bookingRef:    { type: String, default: '' },

  customerName:  { type: String, required: true },
  customerPhone: { type: String, default: '' },
  customerCar:   { type: String, default: '' },

  items:         { type: [itemSchema], default: [] },

  subtotal:      { type: Number, required: true },
  discountTotal: { type: Number, default: 0 },
  vatRate:       { type: Number, default: 7 },
  vatAmount:     { type: Number, default: 0 },
  grandTotal:    { type: Number, required: true },

  paymentMethod: { type: String, enum: ['cash', 'transfer', 'credit_card', 'pending'], default: 'pending' },
  paidAt:        { type: Date, default: null },

  status:        { type: String, required: true, default: 'unpaid' },
  note:          { type: String, default: '' },
  issuedAt:      { type: Date, default: Date.now },
  dueDate:       { type: Date, default: null },
  createdAt:     { type: Date, default: Date.now },
}, { collection: 'financialdocuments' });

export const FinancialDocument = models.FinancialDocument || model('FinancialDocument', financialDocSchema);
