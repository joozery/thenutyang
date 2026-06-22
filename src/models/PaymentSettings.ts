import { Schema, model, models } from 'mongoose';

export interface IPaymentSettings {
  qrCodeImage: string;
  updatedAt: Date;
}

const PaymentSettingsSchema = new Schema<IPaymentSettings>({
  qrCodeImage: { type: String, default: '' },
  updatedAt:   { type: Date, default: Date.now },
});

export const PaymentSettings = models.PaymentSettings ?? model<IPaymentSettings>('PaymentSettings', PaymentSettingsSchema);
