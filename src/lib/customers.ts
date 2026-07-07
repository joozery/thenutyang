import connectDB from './mongodb';
import { Booking } from '@/models/Booking';
import type { CustomerDirectoryRow } from './customer-directory';
import type { VehicleEntry } from '@/models/Customer';
import { composeCarInfo } from './car-info';

export type CustomerRow = {
  phone: string;
  name: string;
  lineUserId?: string;
  lineId?: string;
  cars: string[];           // unique "carModel ปี carYear"
  carInfo: string;          // ทะเบียน/ไมล์ ล่าสุดจากการจองครั้งล่าสุด
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
  branch: string;
  carInfo: string;
  vehicles: VehicleEntry[];
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
      email: '', address: '', taxId: '', branch: '', carInfo: b.carInfo, vehicles: [],
      note: '',
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
    // ถ้า Customer directory ไม่มี carInfo (เช่น sync มาจาก booking แต่ยังไม่เคยแก้ในหน้าลูกค้า) ใช้ของจากการจองล่าสุดแทน
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
      branch: d.branch,
      carInfo: d.carInfo || existing?.carInfo || '',
      vehicles: d.vehicles ?? [],
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

  const [rows, carInfoRows] = await Promise.all([
    Booking.aggregate([
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$phone',
          name:       { $last: '$name' },
          lineUserId: { $last: '$lineUserId' },
          lineId:     { $last: '$lineId' },
          cars:       { $addToSet: { $concat: ['$carModel', ' ปี ', '$carYear'] } },
          totalBills: { $sum: 1 },
          totalSpent: { $sum: { $multiply: ['$tirePrice', '$quantity'] } },
          lastVisit:  { $max: '$createdAt' },
        },
      },
      { $sort: { totalSpent: -1 } },
    ]),
    // แยกอีกชุดเฉพาะการจองที่มีข้อมูลรถกรอกไว้จริง แล้วหาตัวล่าสุด — กันเคส "การจองล่าสุด" ดันไม่มีใครกรอกทะเบียน/ไมล์
    Booking.aggregate([
      { $match: { $or: [{ licensePlate: { $ne: '' } }, { mileageBefore: { $ne: null } }, { mileageAfter: { $ne: null } }] } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$phone',
          licensePlate:  { $last: '$licensePlate' },
          mileageBefore: { $last: '$mileageBefore' },
          mileageAfter:  { $last: '$mileageAfter' },
        },
      },
    ]),
  ]);

  const carInfoByPhone = new Map(carInfoRows.map((c) => [c._id as string, c]));

  return rows.map(r => {
    const c = carInfoByPhone.get(r._id as string);
    const mileage = c ? ((c.mileageAfter ?? c.mileageBefore) as number | null) : null;
    return {
      phone:      r._id as string,
      name:       r.name as string,
      lineUserId: r.lineUserId as string | undefined,
      lineId:     r.lineId as string | undefined,
      cars:       r.cars as string[],
      carInfo:    composeCarInfo({ licensePlate: (c?.licensePlate as string) ?? '', mileage: mileage != null ? String(mileage) : '' }),
      totalBills: r.totalBills as number,
      totalSpent: r.totalSpent as number,
      lastVisit:  r.lastVisit instanceof Date ? r.lastVisit.toISOString() : String(r.lastVisit),
      tag:        (r.totalSpent >= 50000 ? 'VIP' : r.totalBills === 1 ? 'ใหม่' : 'ปกติ') as 'VIP' | 'ปกติ' | 'ใหม่',
    };
  });
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
