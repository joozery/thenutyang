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
  taxId?: string;           // เลขประจำตัวผู้เสียภาษี (ใช้สำหรับ match องค์กร)
};

// ใบสั่งซื้อของคู่ค้า (ซัพพลายเออร์) — แสดงใน popup ที่หน้าลูกค้า
export type PartnerPO = {
  id:         string;
  poNumber:   string;
  orderDate:  string;
  status:     string; // draft | pending | received
  grandTotal: number;
};

export type UnifiedCustomerRow = {
  id: string | null;        // Customer directory _id, null = booking-only (no directory record)
  customerType: 'individual' | 'corporate';
  relationType: 'customer' | 'partner';
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
  partnerPos?: PartnerPO[];
  supplierId?: string; // คู่ค้าที่มาจากหน้าจัดซื้อ — ลิงก์ไปหน้ารายละเอียดซัพพลายเออร์
  supplierContact?: string; // ชื่อผู้ติดต่อของซัพพลายเออร์ (ใช้ตอนแก้ไข)
  searchKeywords?: string[]; // คำค้นหาเพิ่มเติม (เช่น ชื่อบริษัทที่ถูกนำไปรวมกัน)
};

// ซัพพลายเออร์จากหน้าจัดซื้อ → แถว "คู่ค้า" ในหน้าลูกค้า (อ่านอย่างเดียว — แก้ข้อมูลที่หน้าจัดซื้อ)
// จำนวนบิล/ยอดรวม = ใบสั่งซื้อที่ไม่ถูกยกเลิกของซัพพลายเออร์รายนั้น
export async function getSupplierPartners(): Promise<UnifiedCustomerRow[]> {
  await connectDB();
  const { Supplier } = await import('@/models/Supplier');
  const { PurchaseOrder } = await import('@/models/PurchaseOrder');

  const [suppliers, poDocs] = await Promise.all([
    Supplier.find({}).sort({ name: 1 }).lean(),
    PurchaseOrder.find({ status: { $ne: 'cancelled' } })
      .select('supplierId poNumber status grandTotal createdAt')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  // จัดกลุ่ม PO ตามซัพพลายเออร์ — ใช้ทั้งนับยอดรวมและแสดงรายการใน popup
  const posBySupplier = new Map<string, PartnerPO[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of poDocs as any[]) {
    if (!p.supplierId) continue;
    const key = String(p.supplierId);
    const list = posBySupplier.get(key) ?? [];
    list.push({
      id:         String(p._id),
      poNumber:   p.poNumber ?? '',
      orderDate:  p.createdAt instanceof Date ? p.createdAt.toISOString() : '',
      status:     p.status ?? 'pending',
      grandTotal: p.grandTotal ?? 0,
    });
    posBySupplier.set(key, list);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return suppliers.map((s: any) => {
    const pos = posBySupplier.get(String(s._id)) ?? [];
    const stat = pos.length
      ? { bills: pos.length, spent: pos.reduce((sum, p) => sum + p.grandTotal, 0), lastOrder: new Date(pos[0].orderDate) }
      : undefined;
    return {
      id: null,
      customerType: 'corporate' as const,
      relationType: 'partner' as const,
      name: s.name ?? '',
      firstName: '', lastName: '',
      companyName: s.name ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      address: s.address ?? '',
      taxId: s.taxId ?? '',
      branch: '',
      carInfo: '',
      vehicles: [],
      note: s.contact ? `ผู้ติดต่อ: ${s.contact}` : '',
      lineUserId: undefined,
      cars: [],
      totalBills: stat?.bills ?? 0,
      totalSpent: stat?.spent ?? 0,
      lastVisit: stat?.lastOrder instanceof Date ? stat.lastOrder.toISOString() : '',
      tag: 'ปกติ' as const,
      source: 'walkin' as const,
      partnerPos: pos,
      supplierId: String(s._id),
      supplierContact: s.contact ?? '',
    };
  });
}

export function mergeCustomerSources(
  bookingRows: CustomerRow[],
  directoryRows: CustomerDirectoryRow[],
  supplierRows: UnifiedCustomerRow[] = []
): UnifiedCustomerRow[] {
  const byTaxId = new Map<string, UnifiedCustomerRow>();
  const byPhone = new Map<string, UnifiedCustomerRow>();
  const noPhone: UnifiedCustomerRow[] = [];
  // จับคู่เบอร์โทรด้วยตัวเลขล้วน — '081-234-5678' กับ '0812345678' คือคนเดียวกัน
  const phoneKey = (p: string) => (p ?? '').replace(/\D/g, '') || p;
  
  const normalizePlateForMerge = (p: string | undefined | null) => (p || '').trim().replace(/[\s-]+/g, '').toLowerCase();

  for (const b of bookingRows) {
    const pk = phoneKey(b.phone);
    const tk = b.taxId ? b.taxId.replace(/\D/g, '') : '';

    let existing = tk ? byTaxId.get(tk) : undefined;
    if (!existing && pk) existing = byPhone.get(pk);

    if (existing) {
      existing.totalBills += b.totalBills;
      existing.totalSpent += b.totalSpent;
      if (b.lastVisit > existing.lastVisit) existing.lastVisit = b.lastVisit;
      if (b.taxId && !existing.taxId) existing.taxId = b.taxId;
      
      if (tk && !byTaxId.has(tk)) byTaxId.set(tk, existing);
      if (pk && !byPhone.has(pk)) byPhone.set(pk, existing);
      continue;
    }

    const merged: UnifiedCustomerRow = {
      id: null,
      customerType: 'individual',
      relationType: 'customer',
      name: b.name,
      firstName: '', lastName: '', companyName: '',
      phone: b.phone,
      email: '', address: '', taxId: b.taxId || '', branch: '', carInfo: b.carInfo, vehicles: [],
      note: '',
      lineUserId: b.lineUserId,
      cars: b.cars,
      totalBills: b.totalBills,
      totalSpent: b.totalSpent,
      lastVisit: b.lastVisit,
      tag: b.tag,
      source: b.lineUserId ? 'online' : 'walkin',
    };
    
    if (tk) byTaxId.set(tk, merged);
    if (pk) byPhone.set(pk, merged);
    if (!tk && !pk) noPhone.push(merged);
  }

  const nameKey = (n: string) => (n || '').trim().toLowerCase().replace(/\s+/g, '');
  const byName = new Map<string, UnifiedCustomerRow>();

  // Populate byName with booking/docSpend rows so directory matching by name works
  for (const r of [...byTaxId.values(), ...byPhone.values(), ...noPhone]) {
    if (nameKey(r.name) && !byName.has(nameKey(r.name))) byName.set(nameKey(r.name), r);
    if (nameKey(r.companyName) && !byName.has(nameKey(r.companyName))) byName.set(nameKey(r.companyName), r);
  }

  for (const d of directoryRows) {
    const tk = d.taxId ? d.taxId.replace(/\D/g, '') : '';
    const pk = d.phone ? phoneKey(d.phone) : '';
    const nk = nameKey(d.displayName);
    
    // ลองหาแถวที่มีอยู่แล้วจาก TaxId ก่อน, ถ้าไม่มีลองหาจากเบอร์โทร, ถ้าไม่มีอีกหาจากชื่อ
    let existing = tk ? byTaxId.get(tk) : undefined;
    if (!existing) existing = pk ? byPhone.get(pk) : undefined;
    if (!existing) existing = nk ? byName.get(nk) : undefined;
    
    if (existing) {
      // รวมข้อมูลเข้ากับแถวเดิม (Merge)
      // ให้ Directory มี priority สูงกว่าในการแสดงผลชื่อและข้อมูลติดต่อ (เพราะผู้ใช้อาจจะเข้ามาแก้ไขโปรไฟล์ล่าสุด)
      if (!existing.searchKeywords) existing.searchKeywords = [];
      if (existing.name && existing.name !== d.displayName && !existing.searchKeywords.includes(existing.name)) {
        existing.searchKeywords.push(existing.name);
      }
      
      if (d.id) existing.id = d.id;
      if (d.displayName) existing.name = d.displayName;
      if (d.firstName) existing.firstName = d.firstName;
      if (d.lastName) existing.lastName = d.lastName;
      if (d.companyName) existing.companyName = d.companyName;
      if (d.customerType) existing.customerType = d.customerType;
      if (d.relationType) existing.relationType = d.relationType;
      if (d.note) existing.note = d.note;
      
      if (!existing.phone && d.phone) existing.phone = d.phone;
      if (!existing.taxId && d.taxId) existing.taxId = d.taxId;
      if (!existing.address && d.address) existing.address = d.address;
      if (!existing.email && d.email) existing.email = d.email;
      
      // รวมรถ
      const existingPlates = new Set(existing.vehicles.map(v => normalizePlateForMerge(v.licensePlate)));
      for (const v of (d.vehicles ?? [])) {
        const plateKey = normalizePlateForMerge(v.licensePlate);
        if (plateKey && existingPlates.has(plateKey)) continue;
        existing.vehicles.push(v);
        if (plateKey) existingPlates.add(plateKey);
      }
      
      // Update maps
      if (existing.taxId) byTaxId.set(existing.taxId.replace(/\D/g, ''), existing);
      else if (existing.phone) byPhone.set(phoneKey(existing.phone), existing);
      
      if (nameKey(existing.name)) byName.set(nameKey(existing.name), existing);
      continue;
    }

    // ถ้าCustomer directory ไม่มี carInfo ใช้ของจากการจองล่าสุดแทน
    const merged: UnifiedCustomerRow = {
      id: d.id,
      customerType: d.customerType,
      relationType: d.relationType,
      name: d.displayName,
      firstName: d.firstName,
      lastName: d.lastName,
      companyName: d.companyName,
      phone: d.phone,
      email: d.email,
      address: d.address,
      taxId: d.taxId,
      branch: d.branch,
      carInfo: d.carInfo || '',
      vehicles: d.vehicles ?? [],
      note: d.note,
      lineUserId: undefined,
      cars: d.carInfo ? [d.carInfo] : [],
      totalBills: 0,
      totalSpent: 0,
      lastVisit: d.createdAt,
      tag: 'ใหม่',
      source: d.source,
    };
    
    if (tk) byTaxId.set(tk, merged);
    else if (pk) byPhone.set(pk, merged);
    else noPhone.push(merged);
    
    if (nk) byName.set(nk, merged);
  }

  // ซัพพลายเออร์จากหน้าจัดซื้อ — กันซ้ำกับรายชื่อที่มีอยู่แล้ว ทั้งจากเบอร์โทรและชื่อ

  // ซัพพลายเออร์จากหน้าจัดซื้อ — กันซ้ำกับรายชื่อที่มีอยู่แล้ว ทั้งจากเบอร์โทรและชื่อ
  // (เช่น เคยกดเพิ่มเป็นคู่ค้าเองในหน้าลูกค้า หรือเบอร์ตรงกับลูกค้าเดิม)
  const allRows = [...byTaxId.values(), ...byPhone.values(), ...noPhone];
  
  // byName ถูกสร้างและใช้งานตอน merge directory ไปแล้ว ขอแค่เอา row ที่อาจจะไม่มี phone มาใส่เพิ่มเผื่อซัพพลายเออร์
  for (const r of allRows) {
    if (nameKey(r.name) && !byName.has(nameKey(r.name))) byName.set(nameKey(r.name), r);
    if (nameKey(r.companyName) && !byName.has(nameKey(r.companyName))) byName.set(nameKey(r.companyName), r);
  }
  for (const s of supplierRows) {
    const tk = s.taxId ? s.taxId.replace(/\D/g, '') : '';
    const pk = phoneKey(s.phone);
    
    let existing = tk ? byTaxId.get(tk) : undefined;
    if (!existing) existing = (s.phone && byPhone.get(pk)) || byName.get(nameKey(s.name));
    
    if (existing) {
      // ซ้ำกับรายชื่อเดิม — ไม่เพิ่มแถวใหม่ แต่แนบ supplierId + PO ให้แถวเดิม
      // ต้องตั้ง supplierId ด้วย ไม่อย่างนั้นฟิลเตอร์ "คู่ค้า" จะหาไม่เจอ
      if (!existing.supplierId) {
        existing.supplierId = s.supplierId;
        existing.supplierContact = s.supplierContact;
      }
      if (s.partnerPos?.length) existing.partnerPos = [...(existing.partnerPos ?? []), ...s.partnerPos];
      
      if (!existing.searchKeywords) existing.searchKeywords = [];
      if (s.name && s.name !== existing.name && !existing.searchKeywords.includes(s.name)) {
        existing.searchKeywords.push(s.name);
      }
      
      continue;
    }
    if (tk) byTaxId.set(tk, s);
    else if (s.phone) byPhone.set(pk, s);
    else noPhone.push(s);
  }

  const finalRows = Array.from(new Set([...byTaxId.values(), ...byPhone.values(), ...noPhone]));

  for (const r of finalRows) {
    if (!r.id && !r.supplierId) {
      if (r.phone) r.id = `virtual_phone_${r.phone.replace(/\D/g, '')}`;
      else if (r.taxId) r.id = `virtual_taxid_${r.taxId.replace(/\D/g, '')}`;
      else if (r.name) r.id = `virtual_name_${r.name.trim().replace(/\s+/g, '_')}`;
    }
  }

  return finalRows.sort((a, b) => b.totalSpent - a.totalSpent);
}

// ยอดซื้อจากเอกสาร (ใบเสร็จ/ใบรับชำระ) รวมต่อเบอร์โทร — เบอร์ normalize เป็นตัวเลขล้วนกันกรอกคนละรูปแบบ
type DocSpend = { phone: string; name: string; taxId?: string; spent: number; bills: number; lastVisit: Date | null };

type RawDocRow = { _id: unknown; type: string; status: string; customerPhone: string; customerTaxId: string; customerName: string; grandTotal: number; issuedAt?: Date; bookingRef?: string; relatedDocId?: unknown };

function applyDocRow(map: Map<string, DocSpend>, key: string, phone: string, d: RawDocRow, paidBillingIds: Set<string>) {
  if (!key) return;
  if (d.type === 'billing_note') return;
  if (d.bookingRef) return;
  if (d.type === 'payment_note' && d.relatedDocId && paidBillingIds.has(String(d.relatedDocId))) return;
  const cur = map.get(key) ?? { phone, name: '', taxId: d.customerTaxId || undefined, spent: 0, bills: 0, lastVisit: null };
  // credit_note หักออก ไม่นับบิล; ประเภทอื่นบวกปกติ
  cur.spent += d.type === 'credit_note' ? -(d.grandTotal ?? 0) : (d.grandTotal ?? 0);
  if (d.type !== 'credit_note') cur.bills += 1;
  cur.name = d.customerName || cur.name;
  if (d.issuedAt instanceof Date && (!cur.lastVisit || d.issuedAt > cur.lastVisit)) cur.lastVisit = d.issuedAt;
  map.set(key, cur);
}

async function getAllDocSpends(): Promise<{ byPhone: Map<string, DocSpend>, byTaxId: Map<string, DocSpend>, byName: Map<string, DocSpend> }> {
  const { FinancialDocument } = await import('@/models/FinancialDocument');
  const docRows = await FinancialDocument.find(
    {
      status: { $ne: 'cancelled' },
      type: { $in: ['invoice', 'payment_note', 'billing_note', 'credit_note'] },
    },
    { type: 1, status: 1, customerPhone: 1, customerTaxId: 1, customerName: 1, grandTotal: 1, issuedAt: 1, bookingRef: 1, relatedDocId: 1 },
  ).lean() as RawDocRow[];

  const paidBillingIds = new Set(
    docRows.filter(d => d.type === 'billing_note' && d.status === 'paid').map(d => String(d._id)),
  );
  
  const byPhone = new Map<string, DocSpend>();
  const byTaxId = new Map<string, DocSpend>();
  const byName = new Map<string, DocSpend>();

  for (const d of docRows) {
    const taxId = (d.customerTaxId || '').replace(/\D/g, '');
    const phone = (d.customerPhone || '').replace(/\D/g, '');
    const nameKey = (d.customerName || '').trim().toLowerCase().replace(/\s+/g, '');

    if (taxId) {
      applyDocRow(byTaxId, taxId, d.customerPhone || '', d, paidBillingIds);
    } else if (phone) {
      applyDocRow(byPhone, phone, d.customerPhone || '', d, paidBillingIds);
    } else if (nameKey) {
      applyDocRow(byName, nameKey, d.customerPhone || '', d, paidBillingIds);
    }
  }

  return { byPhone, byTaxId, byName };
}

function customerTag(totalSpent: number, totalBills: number): 'VIP' | 'ปกติ' | 'ใหม่' {
  return totalSpent >= 50000 ? 'VIP' : totalBills <= 1 ? 'ใหม่' : 'ปกติ';
}

export async function getCustomers(): Promise<CustomerRow[]> {
  await connectDB();

  const { byPhone: docSpendByPhone, byTaxId: docSpendByTaxId, byName: docSpendByName } = await getAllDocSpends();
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

  const result: CustomerRow[] = rows.map(r => {
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

  for (const [taxIdKey, d] of docSpendByTaxId.entries()) {
    result.push({
      phone:      d.phone || '', // อาจจะไม่มีเบอร์โทร
      name:       d.name,
      taxId:      d.taxId,
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

  for (const [nameKey, d] of docSpendByName.entries()) {
    result.push({
      phone:      d.phone || '',
      name:       d.name,
      taxId:      d.taxId,
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
