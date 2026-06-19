'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import { hashPassword, verifyPassword, verifySessionToken, COOKIE_NAME } from '@/lib/auth';

// ─── สร้างบัญชีใหม่ ──────────────────────────────────────────
export async function createAdminUser(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const username    = (formData.get('username') as string ?? '').trim().toLowerCase();
  const displayName = (formData.get('displayName') as string ?? '').trim();
  const email       = (formData.get('email') as string ?? '').trim();
  const phone       = (formData.get('phone') as string ?? '').trim();
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
    await AdminUser.create({ username, displayName, email, phone, passwordHash, role });
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err) {
    console.error('[createAdminUser]', err);
    return { error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่' };
  }
}

// ─── แก้ไขข้อมูลผู้ใช้ ──────────────────────────────────────
export async function updateAdminUser(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id          = (formData.get('id') as string ?? '').trim();
  const displayName = (formData.get('displayName') as string ?? '').trim();
  const email       = (formData.get('email') as string ?? '').trim();
  const phone       = (formData.get('phone') as string ?? '').trim();
  const role        = (formData.get('role') as 'super' | 'admin') ?? 'admin';

  if (!id || !displayName) return { error: 'ข้อมูลไม่ครบถ้วน' };

  try {
    await connectDB();
    await AdminUser.findByIdAndUpdate(id, { displayName, email, phone, role });
    revalidatePath('/admin/users');
    revalidatePath('/admin/profile');
    return { success: true };
  } catch (err) {
    console.error('[updateAdminUser]', err);
    return { error: 'ไม่สามารถอัปเดตข้อมูลได้' };
  }
}

// ─── เปลี่ยนรหัสผ่าน (โดย Super Admin) ──────────────────────
export async function changeAdminPassword(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id          = (formData.get('id') as string ?? '').trim();
  const newPassword = (formData.get('newPassword') as string ?? '');

  if (!id || newPassword.length < 6) {
    return { error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' };
  }

  try {
    await connectDB();
    const passwordHash = await hashPassword(newPassword);
    await AdminUser.findByIdAndUpdate(id, { passwordHash });
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err) {
    console.error('[changeAdminPassword]', err);
    return { error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' };
  }
}

// ─── เปลี่ยนรหัสผ่านตัวเอง (Profile) ────────────────────────
export async function changeMyPassword(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const currentPassword = (formData.get('currentPassword') as string ?? '');
  const newPassword     = (formData.get('newPassword') as string ?? '');
  const confirmPassword = (formData.get('confirmPassword') as string ?? '');

  if (newPassword.length < 6) return { error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' };
  if (newPassword !== confirmPassword) return { error: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' };

  try {
    await connectDB();
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value ?? '';
    const session = await verifySessionToken(token);
    if (!session) return { error: 'กรุณาเข้าสู่ระบบใหม่' };

    const user = await AdminUser.findOne({ username: session.username });
    if (!user) return { error: 'ไม่พบบัญชีผู้ใช้' };

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) return { error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' };

    const passwordHash = await hashPassword(newPassword);
    await AdminUser.findByIdAndUpdate(user._id, { passwordHash });
    return { success: true };
  } catch (err) {
    console.error('[changeMyPassword]', err);
    return { error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' };
  }
}

// ─── อัปเดต Profile ตัวเอง ───────────────────────────────────
export async function updateMyProfile(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const displayName = (formData.get('displayName') as string ?? '').trim();
  const email       = (formData.get('email') as string ?? '').trim();
  const phone       = (formData.get('phone') as string ?? '').trim();

  if (!displayName) return { error: 'กรุณากรอกชื่อที่แสดง' };

  try {
    await connectDB();
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value ?? '';
    const session = await verifySessionToken(token);
    if (!session) return { error: 'กรุณาเข้าสู่ระบบใหม่' };

    await AdminUser.findOneAndUpdate({ username: session.username }, { displayName, email, phone });
    revalidatePath('/admin/profile');
    return { success: true };
  } catch (err) {
    console.error('[updateMyProfile]', err);
    return { error: 'ไม่สามารถอัปเดตโปรไฟล์ได้' };
  }
}

// ─── เปิด/ปิดบัญชี ───────────────────────────────────────────
export async function toggleAdminUserActive(id: string, currentUsername: string) {
  try {
    await connectDB();
    const user = await AdminUser.findById(id);
    if (!user || user.username === currentUsername) return;
    await AdminUser.findByIdAndUpdate(id, { isActive: !user.isActive });
    revalidatePath('/admin/users');
  } catch (err) {
    console.error('[toggleAdminUserActive]', err);
  }
}

// ─── ลบบัญชี ─────────────────────────────────────────────────
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

// ─── Setup first admin ───────────────────────────────────────
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
    return { error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า MONGODB_URI' };
  }
}
