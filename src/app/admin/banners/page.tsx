import { getAllBanners } from '@/lib/banners';
import { BannersClient } from '@/components/admin/banners-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'แบนเนอร์โปรโมชั่น | Admin' };

export default async function BannersPage() {
  const banners = await getAllBanners();
  return <BannersClient banners={banners} />;
}
