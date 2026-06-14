import { Schema, model, models } from 'mongoose';

export interface IAdminUser {
  username: string;
  passwordHash: string;
  displayName: string;
  role: 'super' | 'admin';
  createdAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>({
  username:     { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  displayName:  { type: String, required: true },
  role:         { type: String, enum: ['super', 'admin'], default: 'admin' },
  createdAt:    { type: Date, default: Date.now },
});

export const AdminUser = models.AdminUser ?? model<IAdminUser>('AdminUser', AdminUserSchema);
