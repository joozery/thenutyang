import connectDB from './mongodb';
import { Booking } from '@/models/Booking';

export type CustomerRow = {
  phone: string;
  name: string;
  lineUserId?: string;
  lineId?: string;
  cars: string[];           // unique "carModel ปี carYear"
  totalBills: number;
  totalSpent: number;
  lastVisit: string;        // ISO date string
  tag: 'VIP' | 'ปกติ' | 'ใหม่';
};

export async function getCustomers(): Promise<CustomerRow[]> {
  await connectDB();

  const rows = await Booking.aggregate([
    // group by phone
    {
      $group: {
        _id: '$phone',
        name:        { $last: '$name' },
        lineUserId:  { $last: '$lineUserId' },
        lineId:      { $last: '$lineId' },
        cars:        { $addToSet: { $concat: ['$carModel', ' ปี ', '$carYear'] } },
        totalBills:  { $sum: 1 },
        totalSpent:  { $sum: { $multiply: ['$tirePrice', '$quantity'] } },
        lastVisit:   { $max: '$createdAt' },
      },
    },
    { $sort: { totalSpent: -1 } },
  ]);

  return rows.map(r => ({
    phone:      r._id as string,
    name:       r.name as string,
    lineUserId: r.lineUserId as string | undefined,
    lineId:     r.lineId as string | undefined,
    cars:       r.cars as string[],
    totalBills: r.totalBills as number,
    totalSpent: r.totalSpent as number,
    lastVisit:  r.lastVisit instanceof Date ? r.lastVisit.toISOString() : String(r.lastVisit),
    tag:        r.totalSpent >= 50000 ? 'VIP' : r.totalBills === 1 ? 'ใหม่' : 'ปกติ',
  }));
}

export function formatLastVisit(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'วันนี้';
  if (days === 1) return 'เมื่อวาน';
  if (days < 7)  return `${days} วันที่แล้ว`;
  if (days < 30) return `${Math.floor(days / 7)} สัปดาห์ที่แล้ว`;
  if (days < 365) return `${Math.floor(days / 30)} เดือนที่แล้ว`;
  return `${Math.floor(days / 365)} ปีที่แล้ว`;
}
