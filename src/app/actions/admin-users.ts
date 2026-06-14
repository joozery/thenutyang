'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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

  await connectDB();

  const exists = await AdminUser.findOne({ username });
  if (exists) return { error: `ชื่อผู้ใช้ "${username}" ถูกใช้แล้ว` };

  const passwordHash = await hashPassword(password);
  await AdminUser.create({ username, displayName, passwordHash, role });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function setupFirstAdmin(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  await connectDB();

  const count = await AdminUser.countDocuments();
  if (count > 0) redirect('/admin/login');

  const username    = (formData.get('username') as string ?? '').trim().toLowerCase();
  const displayName = (formData.get('displayName') as string ?? '').trim();
  const password    = (formData.get('password') as string ?? '');

  if (!username || !displayName || password.length < 6) {
    return { error: 'กรุณากรอกข้อมูลให้ครบ (รหัสผ่านอย่างน้อย 6 ตัว)' };
  }

  const passwordHash = await hashPassword(password);
  await AdminUser.create({ username, displayName, passwordHash, role: 'super' });

  redirect('/admin/login');
}

export async function deleteAdminUser(id: string, currentUsername: string) {
  await connectDB();

  const user = await AdminUser.findById(id);
  if (!user) return;
  if (user.username === currentUsername) return; // ลบตัวเองไม่ได้

  // ป้องกันลบ super admin คนสุดท้าย
  if (user.role === 'super') {
    const superCount = await AdminUser.countDocuments({ role: 'super' });
    if (superCount <= 1) return;
  }

  await AdminUser.findByIdAndDelete(id);
  revalidatePath('/admin/users');
}
