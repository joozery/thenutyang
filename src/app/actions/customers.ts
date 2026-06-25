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

type SavedCustomer = { id: string; name: string; phone: string; address: string; taxId: string; carInfo: string; vehicles: VehicleEntry[] };
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
  carInfo: string;
  vehicles: VehicleEntry[];
  note: string;
};

function validate(input: CustomerFormInput): string | null {
  if (input.customerType === 'corporate' && !input.companyName.trim()) return 'กรุณากรอกชื่อบริษัท';
  const hasVehicle = input.vehicles.some(v => v.licensePlate.trim() || v.carBrand.trim());
  if (input.customerType === 'individual' && !input.firstName.trim() && !hasVehicle) {
    return 'กรุณากรอกชื่อลูกค้า หรือข้อมูลรถอย่างน้อย 1 คัน';
  }
  return null;
}

export async function createCustomer(input: CustomerFormInput): Promise<ActionResult> {
  try {
    const error = validate(input);
    if (error) return { error };

    await connectDB();
    const doc = await Customer.create({ ...input, source: 'walkin' });
    revalidatePath('/admin/customers');
    const name = input.customerType === 'corporate' && input.companyName.trim()
      ? input.companyName.trim()
      : `${input.firstName} ${input.lastName}`.trim();
    return {
      ok: true,
      customer: { id: String(doc._id), name, phone: input.phone, address: input.address, taxId: input.taxId, carInfo: input.carInfo, vehicles: input.vehicles },
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
): Promise<{ ok?: boolean; error?: string }> {
  try {
    if (!customerId) return { error: 'ไม่พบลูกค้า' };
    if (!vehicle.licensePlate.trim() && !vehicle.carBrand.trim()) return { error: 'กรุณากรอกทะเบียนหรือยี่ห้อรถ' };
    await connectDB();
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
