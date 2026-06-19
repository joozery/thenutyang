import { Schema, model, models } from 'mongoose';

export interface IAdminUser {
  username: string;
  passwordHash: string;
  displayName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: 'super' | 'admin';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>({
  username:     { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  displayName:  { type: String, required: true },
  email:        { type: String, default: '' },
  phone:        { type: String, default: '' },
  avatar:       { type: String, default: '' },
  role:         { type: String, enum: ['super', 'admin'], default: 'admin' },
  isActive:     { type: Boolean, default: true },
  lastLoginAt:  { type: Date, default: null },
  createdAt:    { type: Date, default: Date.now },
}, { timestamps: true });

export const AdminUser = models.AdminUser ?? model<IAdminUser>('AdminUser', AdminUserSchema);
