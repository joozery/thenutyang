import { Schema, model, models } from 'mongoose';

export interface IClaimItem {
  productName: string;
  brand: string;
  size: string;
  quantity: number;
  reason: string;
}

export interface IWarrantyClaim {
  claimNumber: string;

  // Step 1 — ลูกค้าเข้าเครม
  customerName: string;
  customerPhone: string;
  licensePlate: string;
  claimDate: Date;
  items: IClaimItem[];
  customerNotes: string;

  // Step 2 — เดอะนัทส่งเครม
  supplierName: string;
  supplierSentDate: Date | null;
  supplierRef: string;
  supplierNotes: string;

  // Step 3 — สำรองจ่ายก่อน
  isAdvanced: boolean;
  advanceAmount: number;
  advanceDate: Date | null;
  advanceNotes: string;

  // Step 4 — ผลออก
  resultDate: Date | null;
  resultType: 'replacement' | 'money' | '';
  replacementDescription: string;
  compensationAmount: number;

  // การคืนให้ลูกค้า
  customerResolutionDate: Date | null;
  customerResolutionNotes: string;

  status: 'customer_filed' | 'sent_to_supplier' | 'waiting_result' | 'resolved';

  createdAt: Date;
  updatedAt: Date;
}

const claimItemSchema = new Schema<IClaimItem>(
  {
    productName: { type: String, required: true },
    brand: { type: String, default: '' },
    size: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, default: '' },
  },
  { _id: false },
);

const warrantyClaimSchema = new Schema<IWarrantyClaim>(
  {
    claimNumber: { type: String, required: true, unique: true },

    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    licensePlate: { type: String, default: '' },
    claimDate: { type: Date, required: true },
    items: [claimItemSchema],
    customerNotes: { type: String, default: '' },

    supplierName: { type: String, default: '' },
    supplierSentDate: { type: Date, default: null },
    supplierRef: { type: String, default: '' },
    supplierNotes: { type: String, default: '' },

    isAdvanced: { type: Boolean, default: false },
    advanceAmount: { type: Number, default: 0 },
    advanceDate: { type: Date, default: null },
    advanceNotes: { type: String, default: '' },

    resultDate: { type: Date, default: null },
    resultType: { type: String, enum: ['replacement', 'money', ''], default: '' },
    replacementDescription: { type: String, default: '' },
    compensationAmount: { type: Number, default: 0 },

    customerResolutionDate: { type: Date, default: null },
    customerResolutionNotes: { type: String, default: '' },

    status: {
      type: String,
      enum: ['customer_filed', 'sent_to_supplier', 'waiting_result', 'resolved'],
      default: 'customer_filed',
    },
  },
  { timestamps: true },
);

export const WarrantyClaim =
  models.WarrantyClaim ?? model<IWarrantyClaim>('WarrantyClaim', warrantyClaimSchema);
