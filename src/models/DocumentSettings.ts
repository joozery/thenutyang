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
  updatedAt:            { type: Date, default: Date.now },
});

export const DocumentSettings = models.DocumentSettings ?? model<IDocumentSettings>('DocumentSettings', DocumentSettingsSchema);
