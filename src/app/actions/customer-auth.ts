'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CUSTOMER_COOKIE } from '@/lib/customer-session';

export async function logoutCustomer() {
  const jar = await cookies();
  jar.delete(CUSTOMER_COOKIE);
  redirect('/');
}
