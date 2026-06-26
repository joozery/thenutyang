import { Schema, model, models } from 'mongoose';

const lineItemSchema = new Schema({
  productId:   { type: Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, required: true },
  unit:        { type: String, default: 'เส้น' },
  qty:         { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, required: true, min: 0 },
  discount:    { type: Number, default: 0, min: 0, max: 100 },
  year:        { type: String, default: '' },
  lineTotal:   { type: Number, required: true },
}, { _id: false });

const purchaseOrderSchema = new Schema({
  poNumber: { type: String, required: true, unique: true },
  poType:   { type: String, enum: ['standard', 'urgent'], default: 'standard' },

  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  supplierSnapshot: {
    name:    { type: String, default: '' },
    address: { type: String, default: '' },
    contact: { type: String, default: '' },
    phone:   { type: String, default: '' },
    email:   { type: String, default: '' },
    taxId:   { type: String, default: '' },
  },

  reference: { type: String, default: '' },
  dueDate: { type: Date },
  items:   [lineItemSchema],

  paymentTerm:     { type: String, enum: ['cash', '30', '45', '60'], default: '30' },
  paymentMethod:   { type: String, enum: ['transfer', 'check', 'cash'], default: 'transfer' },
  shippingAddress: { type: String, default: '' },
  notes:           { type: String, default: '' },
  specialTerms:    { type: String, default: '' },

  subtotal:      { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  vat:           { type: Number, default: 0 },
  grandTotal:    { type: Number, default: 0 },

  vatType:       { type: String, enum: ['included', 'excluded', 'none'], default: 'none' },

  status: {
    type: String,
    enum: ['draft', 'pending', 'received', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid',
  },
  amountPaid:  { type: Number, default: 0 },
  paymentDate: { type: Date },
  expenseId:   { type: Schema.Types.ObjectId, ref: 'Expense' },
  createdAt: { type: Date, default: Date.now },
});

export const PurchaseOrder = models.PurchaseOrder || model('PurchaseOrder', purchaseOrderSchema);
