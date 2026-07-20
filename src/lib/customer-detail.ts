import connectDB from './mongodb';
import { Customer } from '@/models/Customer';
import { FinancialDocument } from '@/models/FinancialDocument';
import { Booking } from '@/models/Booking';
import type { VehicleEntry } from '@/models/Customer';
import { parseCarInfo } from './car-info';

export type CustomerDetailData = {
  id: string;
  customerType: 'individual' | 'corporate';
  relationType: 'customer' | 'partner';
  firstName: string;
  lastName: string;
  companyName: string;
  displayName: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  branch: string;
  carInfo: string;
  vehicles: VehicleEntry[];
  note: string;
  source: 'online' | 'walkin';
  createdAt: string;
};

export type CustomerDoc = {
  id: string;
  docNumber: string;
  type: string;
  customerCar: string;
  grandTotal: number;
  status: string;
  paymentMethod: string;
  bookingRef: string;
  relatedDocId: string;
  createdAt: string;
};

export type CustomerBooking = {
  id: string;
  carBrand: string;
  carModel: string;
  carYear: string;
  licensePlate: string;
  tireSize: string;
  quantity: number;
  tirePrice: number;
  status: string;
  createdAt: string;
};

export type CustomerDetailResult = {
  customer: CustomerDetailData;
  docs: CustomerDoc[];
  bookings: CustomerBooking[];
  totalSpent: number;
  totalDocs: number;
  totalBookings: number;
};

const DOC_TYPE_LABEL: Record<string, string> = {
  invoice:      'ใบเสร็จ',
  quote:        'ใบเสนอราคา',
  billing_note: 'ใบแจ้งหนี้',
  credit_note:  'ใบลดหนี้',
  payment_note: 'ใบรับชำระ',
};

export function docTypeLabel(type: string): string {
  return DOC_TYPE_LABEL[type] ?? type;
}

export async function getCustomerDetail(id: string): Promise<CustomerDetailResult | null> {
  await connectDB();

  const raw = await Customer.findById(id).lean();
  if (!raw) return null;

  const d = raw as Record<string, unknown>;
  const firstName   = String(d.firstName   ?? '');
  const lastName    = String(d.lastName    ?? '');
  const companyName = String(d.companyName ?? '');
  const displayName = d.customerType === 'corporate' && companyName
    ? companyName
    : `${firstName} ${lastName}`.trim() || companyName || 'ไม่ระบุชื่อ';

  const customer: CustomerDetailData = {
    id:           String(d._id),
    customerType: (d.customerType as 'individual' | 'corporate') ?? 'individual',
    relationType: (d.relationType as 'customer' | 'partner') ?? 'customer',
    firstName,
    lastName,
    companyName,
    displayName,
    phone:    String(d.phone    ?? ''),
    email:    String(d.email    ?? ''),
    address:  String(d.address  ?? ''),
    taxId:    String(d.taxId    ?? ''),
    branch:   String(d.branch   ?? ''),
    carInfo:  String(d.carInfo  ?? ''),
    vehicles: (d.vehicles as VehicleEntry[] | undefined) ?? [],
    note:     String(d.note     ?? ''),
    source:   (d.source as 'online' | 'walkin') ?? 'walkin',
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt ?? ''),
  };

  const phone = customer.phone;
  const taxId = customer.taxId;

  // normalize phone — กัน format mismatch เช่น '081-234-5678' vs '0812345678'
  const phoneDigits = phone.replace(/\D/g, '');
  const phoneFilter = phone
    ? (phoneDigits && phoneDigits !== phone ? { $in: [phone, phoneDigits] } : phone)
    : null;

  // fallback สำหรับ FinancialDocument: ไม่มีเบอร์ → ใช้ taxId → ใช้ชื่อ
  const taxDigits = taxId.replace(/\D/g, '');
  const docFilter: Record<string, unknown> = phoneFilter
    ? { customerPhone: phoneFilter }
    : taxDigits
      ? { customerTaxId: taxDigits && taxDigits !== taxId ? { $in: [taxId, taxDigits] } : taxId }
      : { customerName: displayName };

  const [rawDocs, rawBookings] = await Promise.all([
    FinancialDocument.find(docFilter)
      .sort({ createdAt: -1 })
      .limit(50)
      .select('docNumber type customerCar grandTotal status paymentMethod bookingRef relatedDocId createdAt')
      .lean(),
    phoneFilter
      ? Booking.find({ phone: phoneFilter })
          .sort({ createdAt: -1 })
          .limit(50)
          .select('carBrand carModel carYear licensePlate tireSize quantity tirePrice status createdAt')
          .lean()
      : Promise.resolve([]),
  ]);

  const docs: CustomerDoc[] = (rawDocs as Record<string, unknown>[]).map((doc) => ({
    id:            String(doc._id),
    docNumber:     String(doc.docNumber ?? ''),
    type:          String(doc.type ?? ''),
    customerCar:   String(doc.customerCar ?? ''),
    grandTotal:    Number(doc.grandTotal ?? 0),
    status:        String(doc.status ?? ''),
    paymentMethod: String(doc.paymentMethod ?? ''),
    bookingRef:    String(doc.bookingRef ?? ''),
    relatedDocId:  doc.relatedDocId ? String(doc.relatedDocId) : '',
    createdAt:     doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt ?? ''),
  }));

  const bookings: CustomerBooking[] = (rawBookings as Record<string, unknown>[]).map((b) => ({
    id:           String(b._id),
    carBrand:     String(b.carBrand     ?? ''),
    carModel:     String(b.carModel     ?? ''),
    carYear:      String(b.carYear      ?? ''),
    licensePlate: String(b.licensePlate ?? ''),
    tireSize:     String(b.tireSize     ?? ''),
    quantity:     Number(b.quantity     ?? 0),
    tirePrice:    Number(b.tirePrice    ?? 0),
    status:       String(b.status       ?? ''),
    createdAt:    b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt ?? ''),
  }));

  // เติมรถจาก docs + bookings ที่ยังไม่มีใน Customer model (dedup ด้วย licensePlate หรือ brand+model)
  const seen = new Set<string>(
    customer.vehicles
      .map(v => (v.licensePlate || `${v.carBrand}||${v.carModel}`).toLowerCase())
      .filter(Boolean),
  );
  function addVehicleIfNew(v: VehicleEntry) {
    if (!v.licensePlate && !v.carBrand && !v.carModel) return;
    const key = (v.licensePlate || `${v.carBrand}||${v.carModel}`).toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    customer.vehicles.push(v);
  }
  // จาก customerCar ของ FinancialDocument (เก็บข้อมูลรถ ณ วันออกเอกสาร)
  for (const doc of docs) {
    if (!doc.customerCar) continue;
    const p = parseCarInfo(doc.customerCar);
    addVehicleIfNew({ carBrand: p.carBrand, carModel: p.carModel, carColor: p.carColor, licensePlate: p.licensePlate, mileage: p.mileage, chassisNo: p.chassisNo });
  }
  // จาก booking (กรณีลูกค้าจองออนไลน์)
  for (const b of bookings) {
    addVehicleIfNew({ carBrand: b.carBrand, carModel: b.carModel, carColor: '', licensePlate: b.licensePlate, mileage: '', chassisNo: '' });
  }

  // ยอดซื้อรวม = ยอดจากการจอง + เอกสารที่ไม่ได้มาจากการจอง (กันนับเงินก้อนเดียวซ้ำสองทาง)
  // ใบแจ้งหนี้ที่จ่ายครบมีใบเสร็จเต็มจำนวนออกอัตโนมัติ — ใบรับชำระรายงวดของมันไม่ถูกนับซ้ำ
  const paidBillingIds = new Set(docs.filter(d => d.type === 'billing_note' && d.status === 'paid').map(d => d.id));
  const docSpent = docs
    .filter(d =>
      d.status !== 'cancelled' &&
      !d.bookingRef &&
      (d.type === 'invoice' || (d.type === 'payment_note' && !(d.relatedDocId && paidBillingIds.has(d.relatedDocId))))
    )
    .reduce((s, d) => s + d.grandTotal, 0);
  const bookingSpent = bookings.reduce((s, b) => s + b.tirePrice * b.quantity, 0);
  const totalSpent   = docSpent + bookingSpent;
  const totalDocs    = docs.length;
  const totalBookings = bookings.length;

  return { customer, docs, bookings, totalSpent, totalDocs, totalBookings };
}
