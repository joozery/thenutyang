'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSessionToken, verifyPassword, COOKIE_NAME, MAX_AGE } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';

export async function login(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const username = (formData.get('username') as string ?? '').trim();
  const password = (formData.get('password') as string ?? '');

  try {
    await connectDB();

    const count = await AdminUser.countDocuments();
    if (count === 0) redirect('/admin/setup');

    const user = await AdminUser.findOne({ username });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }

    const token = await createSessionToken(user.username);
    const jar = await cookies();
    jar.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    });

    redirect('/admin');
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
    console.error('[login]', err);
    return { error: 'ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง' };
  }
}

export async function logout() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  redirect('/admin/login');
}
