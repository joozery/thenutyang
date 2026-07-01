import { Schema, model, models } from 'mongoose';

export interface IDocumentSettings {
  logoUrl: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  issuerName: string;
  issuerSignatureUrl: string;
  approverName: string;
  approverSignatureUrl: string;
  stampUrl: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankBranch: string;
  promptPay: string;
  paymentQrUrl: string;
  paymentNote: string;
  lineId: string;
  updatedAt: Date;
}

const DocumentSettingsSchema = new Schema<IDocumentSettings>({
  logoUrl:              { type: String, default: '' },
  companyName:          { type: String, default: '' },
  address:              { type: String, default: '' },
  phone:                { type: String, default: '' },
  email:                { type: String, default: '' },
  website:              { type: String, default: '' },
  taxId:                { type: String, default: '' },
  issuerName:           { type: String, default: '' },
  issuerSignatureUrl:   { type: String, default: '' },
  approverName:         { type: String, default: '' },
  approverSignatureUrl: { type: String, default: '' },
  stampUrl:             { type: String, default: '' },
  bankName:             { type: String, default: '' },
  bankAccountNumber:    { type: String, default: '' },
  bankAccountName:      { type: String, default: '' },
  bankBranch:           { type: String, default: '' },
  promptPay:            { type: String, default: '' },
  paymentQrUrl:         { type: String, default: '' },
  paymentNote:          { type: String, default: '' },
  lineId:               { type: String, default: '' },
  updatedAt:            { type: Date, default: Date.now },
});

if (models.DocumentSettings) {
  delete models.DocumentSettings;
}
export const DocumentSettings = model<IDocumentSettings>('DocumentSettings', DocumentSettingsSchema);
