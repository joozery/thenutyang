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
  // จับคู่เบอร์โทรด้วยตัวเลขล้วน — '081-234-5678' กับ '0812345678' คือคนเดียวกัน
  const phoneKey = (p: string) => (p ?? '').replace(/\D/g, '') || p;

  for (const b of bookingRows) {
    byPhone.set(phoneKey(b.phone), {
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
    const existing = d.phone ? byPhone.get(phoneKey(d.phone)) : undefined;
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
    if (d.phone) byPhone.set(phoneKey(d.phone), merged);
    else noPhone.push(merged);
  }

  return [...byPhone.values(), ...noPhone].sort((a, b) => b.totalSpent - a.totalSpent);
}

// ยอดซื้อจากเอกสาร (ใบเสร็จ/ใบรับชำระ) รวมต่อเบอร์โทร — เบอร์ normalize เป็นตัวเลขล้วนกันกรอกคนละรูปแบบ
type DocSpend = { phone: string; name: string; spent: number; bills: number; lastVisit: Date | null };

async function getDocSpendByPhone(): Promise<Map<string, DocSpend>> {
  const { FinancialDocument } = await import('@/models/FinancialDocument');
  const docRows = await FinancialDocument.find(
    {
      customerPhone: { $nin: ['', null] },
      status: { $ne: 'cancelled' },
      type: { $in: ['invoice', 'payment_note', 'billing_note'] },
    },
    { type: 1, status: 1, customerPhone: 1, customerName: 1, grandTotal: 1, issuedAt: 1, bookingRef: 1, relatedDocId: 1 },
  ).lean() as { _id: unknown; type: string; status: string; customerPhone: string; customerName: string; grandTotal: number; issuedAt?: Date; bookingRef?: string; relatedDocId?: unknown }[];

  // ใบแจ้งหนี้ที่จ่ายครบ = มีใบเสร็จเต็มจำนวนออกอัตโนมัติแล้ว — ใบรับชำระรายงวดของมันต้องไม่ถูกนับซ้ำ
  const paidBillingIds = new Set(
    docRows.filter(d => d.type === 'billing_note' && d.status === 'paid').map(d => String(d._id)),
  );

  const spendByPhone = new Map<string, DocSpend>();
  for (const d of docRows) {
    if (d.type === 'billing_note') continue;
    if (d.bookingRef) continue; // เอกสารจากระบบจอง — ยอดถูกนับผ่าน Booking แล้ว
    if (d.type === 'payment_note' && d.relatedDocId && paidBillingIds.has(String(d.relatedDocId))) continue;

    const key = d.customerPhone.replace(/\D/g, '');
    if (!key) continue;
    const cur = spendByPhone.get(key) ?? { phone: d.customerPhone, name: '', spent: 0, bills: 0, lastVisit: null };
    cur.spent += d.grandTotal ?? 0;
    cur.bills += 1;
    cur.name = d.customerName || cur.name;
    if (d.issuedAt instanceof Date && (!cur.lastVisit || d.issuedAt > cur.lastVisit)) cur.lastVisit = d.issuedAt;
    spendByPhone.set(key, cur);
  }
  return spendByPhone;
}

function customerTag(totalSpent: number, totalBills: number): 'VIP' | 'ปกติ' | 'ใหม่' {
  return totalSpent >= 50000 ? 'VIP' : totalBills <= 1 ? 'ใหม่' : 'ปกติ';
}

export async function getCustomers(): Promise<CustomerRow[]> {
  await connectDB();

  const docSpendByPhone = await getDocSpendByPhone();
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

  const result = rows.map(r => {
    const c = carInfoByPhone.get(r._id as string);
    const mileage = c ? ((c.mileageAfter ?? c.mileageBefore) as number | null) : null;

    // รวมยอดจากเอกสาร (บิลหน้าร้าน) เข้ากับยอดจากระบบจอง — จับคู่ด้วยเบอร์โทรตัวเลขล้วน
    const phoneKey = String(r._id ?? '').replace(/\D/g, '');
    const docSpend = phoneKey ? docSpendByPhone.get(phoneKey) : undefined;
    if (docSpend) docSpendByPhone.delete(phoneKey);
    const totalSpent = (r.totalSpent as number) + (docSpend?.spent ?? 0);
    const totalBills = (r.totalBills as number) + (docSpend?.bills ?? 0);
    const bookingLastVisit = r.lastVisit instanceof Date ? r.lastVisit : new Date(String(r.lastVisit));
    const lastVisit = docSpend?.lastVisit && docSpend.lastVisit > bookingLastVisit ? docSpend.lastVisit : bookingLastVisit;

    return {
      phone:      r._id as string,
      name:       r.name as string,
      lineUserId: r.lineUserId as string | undefined,
      lineId:     r.lineId as string | undefined,
      cars:       r.cars as string[],
      carInfo:    composeCarInfo({ licensePlate: (c?.licensePlate as string) ?? '', mileage: mileage != null ? String(mileage) : '' }),
      totalBills,
      totalSpent,
      lastVisit:  lastVisit.toISOString(),
      tag:        customerTag(totalSpent, totalBills),
    };
  });

  // เบอร์ที่มีแต่เอกสาร ไม่เคยจองเลย — สร้างแถวให้ด้วย ให้ mergeCustomerSources จับคู่กับ directory ต่อ
  for (const d of docSpendByPhone.values()) {
    result.push({
      phone:      d.phone,
      name:       d.name,
      lineUserId: undefined,
      lineId:     undefined,
      cars:       [],
      carInfo:    '',
      totalBills: d.bills,
      totalSpent: d.spent,
      lastVisit:  d.lastVisit ? d.lastVisit.toISOString() : '',
      tag:        customerTag(d.spent, d.bills),
    });
  }

  return result;
}

export function formatLastVisit(iso: string): string {
  if (!iso || isNaN(new Date(iso).getTime())) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'วันนี้';
  if (days === 1) return 'เมื่อวาน';
  if (days < 7)  return `${days} วันที่แล้ว`;
  if (days < 30) return `${Math.floor(days / 7)} สัปดาห์ที่แล้ว`;
  if (days < 365) return `${Math.floor(days / 30)} เดือนที่แล้ว`;
  return `${Math.floor(days / 365)} ปีที่แล้ว`;
}
