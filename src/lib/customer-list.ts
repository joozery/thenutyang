import { getCustomers, getSupplierPartners, mergeCustomerSources, type UnifiedCustomerRow } from '@/lib/customers';
import { getCustomerDirectory } from '@/lib/customer-directory';

/**
 * รายชื่อลูกค้า/คู่ค้าสำหรับหน้า /admin/customers — กรอง ค้นหา แบ่งหน้าที่ฝั่ง server
 *
 * การรวมข้อมูล (จอง + เอกสารการเงิน + ทะเบียนลูกค้า + ซัพพลายเออร์) ต้องอ่านทุก collection
 * จึงแคชผลรวมไว้ในหน่วยความจำสั้นๆ ให้การค้นหา/เปลี่ยนหน้าไม่ต้องอ่าน DB ใหม่ทุกครั้ง
 * - action ที่แก้ลูกค้า/คู่ค้า เรียก invalidateCustomerListCache() → เห็นผลทันที
 * - การเปลี่ยนแปลงจากหน้าอื่น (บิล, การจอง, PO) จะสะท้อนภายใน CACHE_TTL_MS
 */
const CACHE_TTL_MS = 30_000;
export const CUSTOMER_PAGE_SIZE = 15;

type Cache = { data: UnifiedCustomerRow[] | null; at: number; promise: Promise<UnifiedCustomerRow[]> | null; gen: number };

declare global {
  var _customerListCache: Cache | undefined;
}

const cache: Cache = (global._customerListCache ??= { data: null, at: 0, promise: null, gen: 0 });

async function loadMergedCustomers(): Promise<UnifiedCustomerRow[]> {
  const [bookingCustomers, directoryCustomers, supplierPartners] = await Promise.all([
    getCustomers(),
    getCustomerDirectory(),
    getSupplierPartners(),
  ]);
  return mergeCustomerSources(bookingCustomers, directoryCustomers, supplierPartners);
}

async function getMergedCustomers(): Promise<UnifiedCustomerRow[]> {
  if (cache.data && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  // รวม request ที่เข้ามาพร้อมกันให้โหลดรอบเดียว
  if (!cache.promise) {
    const gen = cache.gen;
    cache.promise = loadMergedCustomers()
      .then((data) => {
        // ถ้าถูก invalidate ระหว่างโหลด อย่าเก็บผลเก่าลงแคช
        if (gen === cache.gen) { cache.data = data; cache.at = Date.now(); }
        return data;
      })
      .finally(() => { cache.promise = null; });
  }
  return cache.promise;
}

export function invalidateCustomerListCache() {
  cache.gen++;
  cache.data = null;
  cache.at = 0;
  cache.promise = null;
}

export type CustomerListFilters = {
  q?: string;
  tag?: string;       // 'VIP' | 'ปกติ' | 'ใหม่'
  source?: string;    // 'ออนไลน์' | 'หน้าร้าน'
  relation?: string;  // 'ลูกค้า' | 'คู่ค้า'
  page?: number;
};

export type CustomerListStats = {
  total: number;
  customerCount: number;
  partnerCount: number;
  vipCount: number;
  newCount: number;
  customerSpent: number;
  partnerSpent: number;
};

export type CustomerListResult = {
  rows: UnifiedCustomerRow[];
  totalItems: number;
  page: number;
  totalPages: number;
  pageSize: number;
  stats: CustomerListStats;
};

function matches(c: UnifiedCustomerRow, f: CustomerListFilters, q: string): boolean {
  if (q) {
    const plates  = c.vehicles.map(v => (v.licensePlate ?? '').toLowerCase()).join(' ');
    const brands  = c.vehicles.map(v => (v.carBrand ?? '').toLowerCase()).join(' ');
    const models  = c.vehicles.map(v => (v.carModel ?? '').toLowerCase()).join(' ');
    const carInfo = (c.carInfo ?? '').toLowerCase();
    const hit =
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      plates.includes(q) ||
      brands.includes(q) ||
      models.includes(q) ||
      carInfo.includes(q) ||
      (c.address ?? '').toLowerCase().includes(q) ||
      (c.taxId ?? '').includes(q) ||
      (c.companyName ?? '').toLowerCase().includes(q) ||
      (c.searchKeywords ?? []).some(k => k.toLowerCase().includes(q));
    if (!hit) return false;
  }
  if (f.tag && f.tag !== 'ทั้งหมด' && c.tag !== f.tag) return false;
  if (f.source === 'ออนไลน์' && c.source !== 'online') return false;
  if (f.source === 'หน้าร้าน' && c.source !== 'walkin') return false;
  if (f.relation === 'ลูกค้า' && c.relationType === 'partner') return false;
  if (f.relation === 'คู่ค้า' && !(c.relationType === 'partner' || !!c.supplierId)) return false;
  return true;
}

export async function queryCustomerList(filters: CustomerListFilters = {}): Promise<CustomerListResult> {
  const all = await getMergedCustomers();
  const q = (filters.q ?? '').toLowerCase().trim();
  const filtered = all.filter(c => matches(c, filters, q));

  const totalPages = Math.max(1, Math.ceil(filtered.length / CUSTOMER_PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages);

  // การ์ดสรุปด้านบนคิดจากข้อมูลทั้งหมด ไม่ขึ้นกับตัวกรอง (เหมือนเดิม)
  const stats: CustomerListStats = { total: all.length, customerCount: 0, partnerCount: 0, vipCount: 0, newCount: 0, customerSpent: 0, partnerSpent: 0 };
  for (const c of all) {
    if (c.tag === 'VIP') stats.vipCount++;
    if (c.tag === 'ใหม่') stats.newCount++;
    if (c.relationType === 'partner') { stats.partnerCount++; stats.partnerSpent += c.totalSpent; }
    else { stats.customerCount++; stats.customerSpent += c.totalSpent; }
  }

  return {
    rows: filtered.slice((page - 1) * CUSTOMER_PAGE_SIZE, page * CUSTOMER_PAGE_SIZE),
    totalItems: filtered.length,
    page,
    totalPages,
    pageSize: CUSTOMER_PAGE_SIZE,
    stats,
  };
}
