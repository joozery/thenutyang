import connectDB from './mongodb';
import { Booking } from '@/models/Booking';
import type { CustomerDirectoryRow } from './customer-directory';

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

export type UnifiedCustomerRow = {
  id: string | null;        // Customer directory _id, null = booking-only (no directory record)
  customerType: 'individual' | 'corporate';
  name: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  carInfo: string;
  note: string;
  lineUserId?: string;
  cars: string[];
  totalBills: number;
  totalSpent: number;
  lastVisit: string;
  tag: 'VIP' | 'ปกติ' | 'ใหม่';
  source: 'online' | 'walkin';
};

export function mergeCustomerSources(
  bookingRows: CustomerRow[],
  directoryRows: CustomerDirectoryRow[]
): UnifiedCustomerRow[] {
  const byPhone = new Map<string, UnifiedCustomerRow>();
  const noPhone: UnifiedCustomerRow[] = [];

  for (const b of bookingRows) {
    byPhone.set(b.phone, {
      id: null,
      customerType: 'individual',
      name: b.name,
      firstName: '', lastName: '', companyName: '',
      phone: b.phone,
      email: '', address: '', taxId: '', carInfo: '', note: '',
      lineUserId: b.lineUserId,
      cars: b.cars,
      totalBills: b.totalBills,
      totalSpent: b.totalSpent,
      lastVisit: b.lastVisit,
      tag: b.tag,
      source: b.lineUserId ? 'online' : 'walkin',
    });
  }

  for (const d of directoryRows) {
    const existing = d.phone ? byPhone.get(d.phone) : undefined;
    const merged: UnifiedCustomerRow = {
      id: d.id,
      customerType: d.customerType,
      name: d.displayName,
      firstName: d.firstName,
      lastName: d.lastName,
      companyName: d.companyName,
      phone: d.phone,
      email: d.email,
      address: d.address,
      taxId: d.taxId,
      carInfo: d.carInfo,
      note: d.note,
      lineUserId: existing?.lineUserId,
      cars: existing
        ? (d.carInfo && !existing.cars.includes(d.carInfo) ? [...existing.cars, d.carInfo] : existing.cars)
        : (d.carInfo ? [d.carInfo] : []),
      totalBills: existing?.totalBills ?? 0,
      totalSpent: existing?.totalSpent ?? 0,
      lastVisit: existing?.lastVisit ?? d.createdAt,
      tag: existing?.tag ?? 'ใหม่',
      source: d.source,
    };
    if (d.phone) byPhone.set(d.phone, merged);
    else noPhone.push(merged);
  }

  return [...byPhone.values(), ...noPhone].sort((a, b) => b.totalSpent - a.totalSpent);
}

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
