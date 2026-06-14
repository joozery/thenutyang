'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import connectDB from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import { hashPassword } from '@/lib/auth';

export async function createAdminUser(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const username    = (formData.get('username') as string ?? '').trim().toLowerCase();
  const displayName = (formData.get('displayName') as string ?? '').trim();
  const password    = (formData.get('password') as string ?? '');
  const role        = (formData.get('role') as 'super' | 'admin') ?? 'admin';

  if (!username || !displayName || password.length < 6) {
    return { error: 'กรุณากรอกข้อมูลให้ครบ (รหัสผ่านอย่างน้อย 6 ตัว)' };
  }

  try {
    await connectDB();
    const exists = await AdminUser.findOne({ username });
    if (exists) return { error: `ชื่อผู้ใช้ "${username}" ถูกใช้แล้ว` };
    const passwordHash = await hashPassword(password);
    await AdminUser.create({ username, displayName, passwordHash, role });
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err) {
    console.error('[createAdminUser]', err);
    return { error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่' };
  }
}

export async function setupFirstAdmin(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const username    = (formData.get('username') as string ?? '').trim().toLowerCase();
  const displayName = (formData.get('displayName') as string ?? '').trim();
  const password    = (formData.get('password') as string ?? '');

  if (!username || !displayName || password.length < 6) {
    return { error: 'กรุณากรอกข้อมูลให้ครบ (รหัสผ่านอย่างน้อย 6 ตัว)' };
  }

  try {
    await connectDB();
    const count = await AdminUser.countDocuments();
    if (count > 0) redirect('/admin/login');
    const passwordHash = await hashPassword(password);
    await AdminUser.create({ username, displayName, passwordHash, role: 'super' });
    redirect('/admin/login');
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error('[setupFirstAdmin]', err);
    return { error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบ MONGODB_URI บน Vercel' };
  }
}

export async function deleteAdminUser(id: string, currentUsername: string) {
  try {
    await connectDB();
    const user = await AdminUser.findById(id);
    if (!user) return;
    if (user.username === currentUsername) return;
    if (user.role === 'super') {
      const superCount = await AdminUser.countDocuments({ role: 'super' });
      if (superCount <= 1) return;
    }
    await AdminUser.findByIdAndDelete(id);
    revalidatePath('/admin/users');
  } catch (err) {
    console.error('[deleteAdminUser]', err);
  }
}
