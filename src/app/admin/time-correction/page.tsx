import { getTimeCorrectionRequests } from '@/lib/time-correction';
import { TimeCorrectionClient } from '@/components/admin/time-correction-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'อนุมัติแก้ไขเวลา | Admin' };

export default async function TimeCorrectionPage() {
  const requests = await getTimeCorrectionRequests();
  return <TimeCorrectionClient requests={requests} />;
}
