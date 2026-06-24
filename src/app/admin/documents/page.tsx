import { getDocuments, getDocStats } from '@/lib/documents';
import { getBookingsByOrderRef, type OrderBooking } from '@/lib/payment-settings';
import { DocumentsClient } from '@/components/admin/documents-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'บิล / เอกสาร | Admin' };

export default async function DocumentsPage() {
  const [docs, stats] = await Promise.all([
    getDocuments(),
    getDocStats(),
  ]);

  // เอกสารที่มาจากการจอง (bookingRef) — ดึงสถานะมัดจำ/ยอดคงเหลือจริงจาก Booking มาโชว์คู่กัน
  const uniqueBookingRefs = [...new Set(docs.map((d) => d.bookingRef).filter(Boolean))];
  const bookingStatuses = await Promise.all(uniqueBookingRefs.map((ref) => getBookingsByOrderRef(ref)));
  const bookingStatusMap = uniqueBookingRefs.reduce((map, ref, i) => {
    const status = bookingStatuses[i];
    if (status) map[ref] = status;
    return map;
  }, {} as Record<string, OrderBooking>);

  return <DocumentsClient initialDocs={docs} stats={stats} bookingStatusMap={bookingStatusMap} />;
}
