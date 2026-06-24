import { getServiceItems } from '@/lib/service-items';
import { ServiceItemsClient } from '@/components/admin/documents/service-items-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'รายการบริการ/ค่าแรง | Admin' };

export default async function ServiceItemsPage() {
  const items = await getServiceItems();
  return <ServiceItemsClient items={items} />;
}
