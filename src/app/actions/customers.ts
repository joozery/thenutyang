'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Customer } from '@/models/Customer';

export type VehicleEntry = {
  carBrand:     string;
  carModel:     string;
  carColor:     string;
  licensePlate: string;
  mileage:      string;
  chassisNo:    string;
};

type SavedCustomer = { id: string; name: string; phone: string; address: string; taxId: string; branch: string; carInfo: string; vehicles: VehicleEntry[] };
type ActionResult = { error?: string; ok?: boolean; customer?: SavedCustomer };

export type CustomerFormInput = {
  customerType: 'individual' | 'corporate';
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
};

// เทียบทะเบียนรถแบบไม่สนช่องว่าง/ตัวพิมพ์ — 'กก 1234' กับ 'กก-1234' คนพิมพ์ต่างกันแต่คือคันเดียวกัน
function normalizePlate(plate: string): string {
  return plate.trim().replace(/[\s-]+/g, '').toLowerCase();
}

function validate(input: CustomerFormInput): string | null {
  if (input.customerType === 'corporate' && !input.companyName.trim()) return 'กรุณากรอกชื่อบริษัท';
  const hasVehicle = input.vehicles.some(v => v.licensePlate.trim() || v.carBrand.trim());
  if (input.customerType === 'individual' && !input.firstName.trim() && !hasVehicle) {
    return 'กรุณากรอกชื่อลูกค้า หรือข้อมูลรถอย่างน้อย 1 คัน';
  }
  const plates = input.vehicles.map(v => normalizePlate(v.licensePlate)).filter(Boolean);
  const dupPlate = plates.find((p, i) => plates.indexOf(p) !== i);
  if (dupPlate) return 'มีทะเบียนรถซ้ำกันในรายการรถของลูกค้า';
  return null;
}

// เช็คว่าทะเบียนไปซ้ำกับรถของลูกค้า "คนอื่น" ในระบบหรือไม่ — กันลงทะเบียนรถคันเดียวกันไว้หลายคน
// (ต้องเรียกหลัง connectDB แล้ว) คืน error message ถ้าซ้ำ, null ถ้าไม่ซ้ำ
async function checkPlateOwnedByOther(vehicles: VehicleEntry[], excludeCustomerId?: string): Promise<string | null> {
  const plates = vehicles.map(v => normalizePlate(v.licensePlate)).filter(Boolean);
  if (plates.length === 0) return null;

  const others = await Customer.find(
    {
      'vehicles.licensePlate': { $nin: ['', null] },
      ...(excludeCustomerId ? { _id: { $ne: excludeCustomerId } } : {}),
    },
    { firstName: 1, lastName: 1, companyName: 1, customerType: 1, 'vehicles.licensePlate': 1 },
  ).lean() as { firstName?: string; lastName?: string; companyName?: string; customerType?: string; vehicles?: { licensePlate?: string }[] }[];

  for (const c of others) {
    const hit = (c.vehicles ?? []).find(v => plates.includes(normalizePlate(v.licensePlate ?? '')));
    if (hit) {
      const owner = c.customerType === 'corporate' && c.companyName
        ? c.companyName
        : `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'ไม่ระบุชื่อ';
      return `ทะเบียน "${hit.licensePlate}" ถูกลงทะเบียนไว้แล้วกับลูกค้า "${owner}"`;
    }
  }
  return null;
}

export async function createCustomer(input: CustomerFormInput): Promise<ActionResult> {
  try {
    const error = validate(input);
    if (error) return { error };

    await connectDB();
    const plateError = await checkPlateOwnedByOther(input.vehicles);
    if (plateError) return { error: plateError };

    const doc = await Customer.create({ ...input, source: 'walkin' });
    revalidatePath('/admin/customers');
    const name = input.customerType === 'corporate' && input.companyName.trim()
      ? input.companyName.trim()
      : `${input.firstName} ${input.lastName}`.trim();
    return {
      ok: true,
      customer: { id: String(doc._id), name, phone: input.phone, address: input.address, taxId: input.taxId, branch: input.branch, carInfo: input.carInfo, vehicles: input.vehicles },
    };
  } catch (err) {
    console.error('[createCustomer]', err);
    return { error: 'บันทึกไม่สำเร็จ' };
  }
}

export async function updateCustomer(id: string, input: CustomerFormInput): Promise<ActionResult> {
  try {
    const error = validate(input);
    if (error) return { error };

    await connectDB();
    const plateError = await checkPlateOwnedByOther(input.vehicles, id);
    if (plateError) return { error: plateError };

    await Customer.findByIdAndUpdate(id, { ...input, updatedAt: new Date() });
    revalidatePath('/admin/customers');
    return { ok: true };
  } catch (err) {
    console.error('[updateCustomer]', err);
    return { error: 'บันทึกไม่สำเร็จ' };
  }
}

// เรียกตอนจองสำเร็จ (เว็บไซต์ลูกค้า) — sync ข้อมูลเข้า Customer Directory ให้อัตโนมัติ ไม่บล็อกการจองถ้าล้มเหลว
export async function upsertCustomerFromBooking(input: {
  lineUserId?: string;
  customerType: 'individual' | 'corporate';
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  address: string;
  taxId: string;
}): Promise<void> {
  try {
    if (!input.lineUserId && !input.phone) return;
    await connectDB();
    const filter = input.lineUserId ? { lineUserId: input.lineUserId } : { phone: input.phone };

    await Customer.findOneAndUpdate(
      filter,
      {
        $set: {
          customerType: input.customerType,
          firstName:    input.firstName,
          lastName:     input.lastName,
          companyName:  input.companyName,
          phone:        input.phone,
          address:      input.address,
          taxId:        input.taxId,
          source:       input.lineUserId ? 'online' : 'walkin',
          updatedAt:    new Date(),
        },
      },
      { upsert: true },
    );
    revalidatePath('/admin/customers');
  } catch (err) {
    console.error('[upsertCustomerFromBooking]', err);
  }
}

export async function addVehicleToCustomer(
  customerId: string,
  vehicle: VehicleEntry,
): Promise<{ ok?: boolean; updated?: boolean; error?: string }> {
  try {
    if (!customerId) return { error: 'ไม่พบลูกค้า' };
    if (!vehicle.licensePlate.trim() && !vehicle.carBrand.trim()) return { error: 'กรุณากรอกทะเบียนหรือยี่ห้อรถ' };
    await connectDB();

    // ทะเบียนเดิมที่มีอยู่แล้ว → อัปเดตข้อมูลคันเดิม (สี/ไมล์/เลขตัวถัง ฯลฯ) แทนการเพิ่มรถซ้ำอีกคัน
    const plate = normalizePlate(vehicle.licensePlate);
    if (plate) {
      const customer = await Customer.findById(customerId).lean() as { vehicles?: VehicleEntry[] } | null;
      if (!customer) return { error: 'ไม่พบลูกค้า' };
      const idx = (customer.vehicles ?? []).findIndex(v => normalizePlate(v.licensePlate) === plate);
      if (idx >= 0) {
        await Customer.findByIdAndUpdate(customerId, {
          $set: { [`vehicles.${idx}`]: vehicle, updatedAt: new Date() },
        });
        revalidatePath('/admin/customers');
        return { ok: true, updated: true };
      }

      // ทะเบียนไปซ้ำกับรถของลูกค้าคนอื่น → ไม่ให้เพิ่ม
      const plateError = await checkPlateOwnedByOther([vehicle], customerId);
      if (plateError) return { error: plateError };
    }

    await Customer.findByIdAndUpdate(customerId, {
      $push: { vehicles: vehicle },
      $set:  { updatedAt: new Date() },
    });
    revalidatePath('/admin/customers');
    return { ok: true };
  } catch (err) {
    console.error('[addVehicleToCustomer]', err);
    return { error: 'บันทึกไม่สำเร็จ' };
  }
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  try {
    await connectDB();
    await Customer.findByIdAndDelete(id);
    revalidatePath('/admin/customers');
    return { ok: true };
  } catch (err) {
    console.error('[deleteCustomer]', err);
    return { error: 'ลบไม่สำเร็จ' };
  }
}
