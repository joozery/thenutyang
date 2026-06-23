import { cookies } from 'next/headers';
import { verifyCustomerToken, CUSTOMER_COOKIE } from '@/lib/customer-session';
import { getCustomerProfile } from '@/lib/customer-profile';
import { getCarBrands, getCarModels } from '@/app/actions/car-data';
import { CartPageClient } from '@/components/cart/cart-page-client';

export const metadata = { title: 'ตะกร้าของคุณ | เดอะนัททายางยนต์' };

export default async function CartPage() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  const customer = token ? await verifyCustomerToken(token) : null;
  const [profile, carBrands, carModels] = await Promise.all([
    customer ? getCustomerProfile(customer.lineUserId) : null,
    getCarBrands(),
    getCarModels(),
  ]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <CartPageClient customer={customer} profile={profile} carBrands={carBrands} carModels={carModels} />
    </div>
  );
}
