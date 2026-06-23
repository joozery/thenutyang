'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { createCartBooking } from '@/app/actions/booking';
import type { CustomerSession } from '@/lib/customer-session';
import type { CustomerProfile } from '@/lib/customer-profile';
import type { CarBrandRow, CarModelRow } from '@/app/actions/car-data';
import { useCart } from './cart-context';
import { CartCheckoutForm } from './cart-checkout-form';
import { CartOrderSummary } from './cart-order-summary';

const FORM_ID = 'cart-checkout-form';

export function CartPageClient({
  customer,
  profile,
  carBrands,
  carModels,
}: {
  customer?: CustomerSession | null;
  profile?: CustomerProfile | null;
  carBrands: CarBrandRow[];
  carModels: CarModelRow[];
}) {
  const { items } = useCart();
  const [state, formAction, isPending] = useActionState(createCartBooking, null);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-20 text-center">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">ยังไม่มีสินค้าในตะกร้า</h1>
        <p className="text-slate-500 text-sm mb-6">เลือกยางที่ต้องการแล้วกด &quot;เพิ่มลงตะกร้า&quot; ได้เลยค่ะ</p>
        <Link href="/tires" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          ดูยางรถยนต์ทั้งหมด
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
      <h1 className="text-2xl font-black text-slate-900 mb-6">ตะกร้าของคุณ ({items.length} รายการ)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
        <div className="lg:col-span-2">
          <CartCheckoutForm formId={FORM_ID} formAction={formAction} customer={customer} profile={profile} carBrands={carBrands} carModels={carModels} />
        </div>

        <div className="lg:col-span-1 lg:sticky lg:top-6">
          <CartOrderSummary formId={FORM_ID} customer={customer} error={state?.error} isPending={isPending} />
        </div>
      </div>
    </div>
  );
}
