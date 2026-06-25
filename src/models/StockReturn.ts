import { Schema, model, models } from 'mongoose';

const returnItemSchema = new Schema({
  productId:   { type: Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, required: true },
  unit:        { type: String, default: 'เส้น' },
  qty:         { type: Number, required: true },
  unitPrice:   { type: Number, default: 0 },
  lineTotal:   { type: Number, default: 0 },
}, { _id: false });

const stockReturnSchema = new Schema({
  returnNumber: { type: String, required: true, unique: true },
  poId:         { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  poNumber:     { type: String, required: true },
  supplier:     { type: String, default: '' },
  returnDate:   { type: Date, required: true },
  reason:       { type: String, default: '' },
  items:        [returnItemSchema],
  subtotal:     { type: Number, default: 0 },
  refundAmount: { type: Number, default: 0 },
  refundStatus: { type: String, enum: ['pending', 'received'], default: 'pending' },
  refundReceivedAt: { type: Date, default: null },
  incomeId:     { type: Schema.Types.ObjectId, ref: 'Income', default: null },
  note:         { type: String, default: '' },
  createdAt:    { type: Date, default: Date.now },
});

export const StockReturn = models.StockReturn || model('StockReturn', stockReturnSchema);
