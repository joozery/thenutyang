import { cookies } from 'next/headers';
import { verifyCustomerToken, CUSTOMER_COOKIE } from '@/lib/customer-session';
import { getCustomerProfile } from '@/lib/customer-profile';
import { CartPageClient } from '@/components/cart/cart-page-client';

export const metadata = { title: 'ตะกร้าของคุณ | เดอะนัททายางยนต์' };

export default async function CartPage() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  const customer = token ? await verifyCustomerToken(token) : null;
  const profile = customer ? await getCustomerProfile(customer.lineUserId) : null;

  return (
    <div className="bg-slate-50 min-h-screen">
      <CartPageClient customer={customer} profile={profile} />
    </div>
  );
}
