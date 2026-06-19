import { Schema, model, models } from 'mongoose';

const supplierSchema = new Schema({
  name:    { type: String, required: true },
  address: { type: String, default: '' },
  contact: { type: String, default: '' },
  phone:   { type: String, default: '' },
  email:   { type: String, default: '' },
  taxId:   { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export const Supplier = models.Supplier || model('Supplier', supplierSchema);
