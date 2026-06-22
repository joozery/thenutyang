'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { CUSTOMER_COOKIE, verifyCustomerToken } from '@/lib/customer-session';
import connectDB from '@/lib/mongodb';
import { Customer } from '@/models/Customer';

export async function logoutCustomer() {
  const jar = await cookies();
  jar.delete(CUSTOMER_COOKIE);
  redirect('/');
}

export async function updateCustomerProfile(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  try {
    const jar = await cookies();
    const token = jar.get(CUSTOMER_COOKIE)?.value;
    const session = token ? await verifyCustomerToken(token) : null;
    if (!session) return { error: 'กรุณาเข้าสู่ระบบก่อน' };

    await connectDB();
    await Customer.findOneAndUpdate(
      { lineUserId: session.lineUserId },
      {
        firstName: (formData.get('firstName') as string) ?? '',
        lastName:  (formData.get('lastName') as string) ?? '',
        phone:     (formData.get('phone') as string) ?? '',
        source:    'online',
        updatedAt: new Date(),
      },
      { upsert: true }
    );

    revalidatePath('/account');
    return { ok: true };
  } catch (err) {
    console.error('[updateCustomerProfile]', err);
    return { error: 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่' };
  }
}
