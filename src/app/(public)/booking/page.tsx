import { getTireById } from '@/lib/tires';
import { getProductById } from '@/lib/products';
import { AddToCartRedirect } from '@/components/cart/add-to-cart-redirect';

export const metadata = { title: 'จองยาง / ขอใบเสนอราคา | เดอะนัททายางยนต์' };

async function resolveTire(tireId?: string) {
  if (!tireId) return undefined;

  const product = await getProductById(tireId);
  if (product) {
    return { id: product.id, brand: product.brand, model: product.model, size: product.size, image: product.image, price: product.priceCash };
  }

  // legacy mock catalog ids ('1'-'24'), still used by the LINE chatbot carousel
  const mock = getTireById(tireId);
  if (mock) {
    return { id: mock.id, brand: mock.brand, model: mock.model, size: mock.size, image: mock.image, price: mock.price };
  }

  return undefined;
}

// deep link เก่า (เช่นจาก LINE chatbot carousel) — เพิ่มลงตะกร้าแล้วพาไปหน้าตะกร้าทันที ใช้ flow เดียวกับปุ่ม "จองเลย" ทั่วเว็บ
export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ tireId?: string }>;
}) {
  const { tireId } = await searchParams;
  const tire = await resolveTire(tireId);

  return (
    <div className="bg-slate-50 min-h-screen">
      <AddToCartRedirect tire={tire} />
    </div>
  );
}
