import { Schema, model, models } from 'mongoose';

export interface ICustomer {
  lineUserId?: string;
  customerType: 'individual' | 'corporate';
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  carInfo: string;
  note: string;
  source: 'online' | 'walkin';
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  lineUserId:   { type: String },
  customerType: { type: String, enum: ['individual', 'corporate'], default: 'individual' },
  firstName:    { type: String, default: '' },
  lastName:     { type: String, default: '' },
  companyName:  { type: String, default: '' },
  phone:        { type: String, default: '' },
  email:        { type: String, default: '' },
  address:      { type: String, default: '' },
  taxId:        { type: String, default: '' },
  carInfo:      { type: String, default: '' },
  note:         { type: String, default: '' },
  source:       { type: String, enum: ['online', 'walkin'], default: 'walkin' },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now },
});

export const Customer = models.Customer ?? model<ICustomer>('Customer', CustomerSchema);
