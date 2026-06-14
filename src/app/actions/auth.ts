'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSessionToken, COOKIE_NAME, MAX_AGE } from '@/lib/auth';

export async function login(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const username = (formData.get('username') as string ?? '').trim();
  const password = (formData.get('password') as string ?? '');

  const validUser = process.env.ADMIN_USERNAME ?? 'admin';
  const validPass = process.env.ADMIN_PASSWORD ?? 'admin';

  if (username !== validUser || password !== validPass) {
    return { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  }

  const token = await createSessionToken();
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });

  redirect('/admin');
}

export async function logout() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  redirect('/admin/login');
}
