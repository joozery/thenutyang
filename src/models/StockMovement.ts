import { Schema, model, models } from 'mongoose';

const stockMovementSchema = new Schema({
  productId:   { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  type:        { type: String, enum: ['in', 'out', 'adjust'], required: true },
  qty:         { type: Number, required: true },
  stockBefore: { type: Number, required: true },
  stockAfter:  { type: Number, required: true },
  refNo:       { type: String, default: '' },
  note:        { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now },
});

export const StockMovement = models.StockMovement || model('StockMovement', stockMovementSchema);
