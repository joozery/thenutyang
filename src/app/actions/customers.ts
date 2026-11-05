'use server';

import { revalidatePath } from 'next/cache';
import { invalidateCustomerListCache } from '@/lib/customer-list';
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
export type ExistingCustomerMatch = { id: string; name: string; phone: string; vehicleCount: number };
type ExistingCustomerMode = 'keep-profile' | 'replace-profile';
type ActionResult = {
  error?: string;
  ok?: boolean;
  customer?: SavedCustomer;
  requiresExistingCustomerConfirmation?: boolean;
  existingCustomer?: ExistingCustomerMatch;
};

export type CustomerFormInput = {
  customerType: 'individual' | 'corporate';
  relationType: 'customer' | 'partner';
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

type ExistingCustomerRecord = Partial<CustomerFormInput> & {
  _id: unknown;
  vehicles?: VehicleEntry[];
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

export async function createCustomer(
  input: CustomerFormInput,
  existingCustomerMode?: ExistingCustomerMode,
): Promise<ActionResult> {
  try {
    const error = validate(input);
    if (error) return { error };

    await connectDB();
    
    // ถ้ามีการระบุเบอร์โทรศัพท์ ลองค้นหาว่ามีลูกค้าคนนี้ในระบบอยู่แล้วหรือไม่
    if (input.phone) {
      const cleanPhone = input.phone.replace(/\D/g, '');
      if (cleanPhone) {
        // ใช้ Regex เพื่อค้นหาเบอร์โทรแบบไม่สนเครื่องหมาย (เช่น 08-1234 หรือ 081234 ก็เจอเหมือนกัน)
        const regexStr = `^\\D*${cleanPhone.split('').join('\\D*')}\\D*$`;
        const existing = await Customer.findOne({ phone: { $regex: new RegExp(regexStr) } }).lean() as ExistingCustomerRecord | null;
        
        if (existing && existing._id) {
           const existingId = String(existing._id);
           const existingName = displayName(existing) || 'ไม่ระบุชื่อ';

           if (!existingCustomerMode) {
             return {
               requiresExistingCustomerConfirmation: true,
               existingCustomer: {
                 id: existingId,
                 name: existingName,
                 phone: existing.phone ?? input.phone,
                 vehicleCount: (existing.vehicles ?? []).length,
               },
             };
           }
           
           // เช็คว่ารถที่เพิ่มใหม่ไปซ้ำกับ "ลูกค้าคนอื่น" หรือไม่
           const plateError = await checkPlateOwnedByOther(input.vehicles, existingId);
           if (plateError) return { error: plateError };
           
           // รวมข้อมูลรถ (Merge Vehicles) โดยป้องกันรถซ้ำ
           const mergedVehicles = [...(existing.vehicles || [])];

           for (const v of input.vehicles) {
             const p = normalizePlate(v.licensePlate);
             const existingVehicleIndex = p
               ? mergedVehicles.findIndex((current: VehicleEntry) => normalizePlate(current.licensePlate) === p)
               : -1;
             if (existingVehicleIndex >= 0) {
               mergedVehicles[existingVehicleIndex] = v;
             } else {
               mergedVehicles.push(v);
             }
           }
           
           // อัปเดตข้อมูลอื่นๆ ที่ยังว่างอยู่
           const updates: Record<string, unknown> = {
             vehicles: mergedVehicles,
           };

           const profileFields: (keyof CustomerFormInput)[] = [
             'customerType', 'relationType', 'firstName', 'lastName', 'companyName',
             'email', 'address', 'taxId', 'branch', 'note', 'carInfo',
           ];
           for (const field of profileFields) {
             if (existingCustomerMode === 'replace-profile' || (!existing[field] && input[field])) {
               updates[field] = input[field];
             }
           }
           
           // ถ้ามีข้อมูลใหม่เข้ามา ให้บันทึกการอัปเดตแทนการสร้างใหม่
           if (Object.keys(updates).length > 0) {
             updates.updatedAt = new Date();
             await Customer.findByIdAndUpdate(existingId, { $set: updates });
           }

           if (existingCustomerMode === 'replace-profile') {
             const oldName = displayName(existing);
             const docFilter = existing.phone?.trim()
               ? { customerPhone: existing.phone.trim() }
               : oldName ? { customerName: oldName, customerPhone: '' } : null;
             if (docFilter) {
               const { FinancialDocument } = await import('@/models/FinancialDocument');
               await FinancialDocument.updateMany(docFilter, {
                 $set: {
                   customerName: displayName(input),
                   customerPhone: input.phone,
                   customerEmail: input.email,
                   customerAddress: input.address,
                   customerTaxId: input.taxId,
                   customerBranch: input.branch,
                 },
               });
               revalidatePath('/admin/documents');
             }
           }
           
           invalidateCustomerListCache();
           revalidatePath('/admin/customers');
           
           // คำนวณชื่อที่จะส่งกลับไปอัปเดตหน้า UI
           const finalType = existingCustomerMode === 'replace-profile'
             ? input.customerType
             : existing.customerType || input.customerType;
           const finalName = finalType === 'corporate' 
             ? (existingCustomerMode === 'replace-profile' ? input.companyName : existing.companyName || input.companyName || '').trim()
             : existingCustomerMode === 'replace-profile'
               ? `${input.firstName} ${input.lastName}`.trim()
               : `${existing.firstName || input.firstName || ''} ${existing.lastName || input.lastName || ''}`.trim();
             
           return {
             ok: true,
             customer: {
               id: existingId,
               name: finalName,
               phone: input.phone,
               address: existingCustomerMode === 'replace-profile' ? input.address : existing.address || input.address,
               taxId: existingCustomerMode === 'replace-profile' ? input.taxId : existing.taxId || input.taxId,
               branch: existingCustomerMode === 'replace-profile' ? input.branch : existing.branch || input.branch,
               carInfo: input.carInfo,
               vehicles: mergedVehicles,
             },
           };
        }
      }
    }

    const plateError = await checkPlateOwnedByOther(input.vehicles);
    if (plateError) return { error: plateError };

    const doc = await Customer.create({ ...input, source: 'walkin' });
    invalidateCustomerListCache();
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

function displayName(c: { customerType?: string; companyName?: string; firstName?: string; lastName?: string }): string {
  return c.customerType === 'corporate' && c.companyName?.trim()
    ? c.companyName.trim()
    : `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
}

export async function updateCustomer(id: string, input: CustomerFormInput): Promise<ActionResult> {
  try {
    const error = validate(input);
    if (error) return { error };

    await connectDB();
    const plateError = await checkPlateOwnedByOther(input.vehicles, id);
    if (plateError) return { error: plateError };

    // เก็บข้อมูลเดิมไว้ก่อน — ใช้ตามหาบิลของลูกค้าคนนี้ (บิลเก็บชื่อ/เบอร์เป็น snapshot ไม่มี customerId)
    let existing: { customerType?: string; companyName?: string; firstName?: string; lastName?: string; phone?: string; } | null = null;
    if (id.startsWith('virtual_')) {
      const parts = id.split('_');
      const type = parts[1];
      const val = parts.slice(2).join('_');
      existing = {
        firstName: type === 'name' ? val : '',
        phone: type === 'phone' ? val : '',
      };
      
      await Customer.create({ ...input, source: 'walkin' });
    } else {
      existing = await Customer.findById(id).lean() as {
        customerType?: string; companyName?: string; firstName?: string; lastName?: string; phone?: string;
      } | null;
      if (!existing) return { error: 'ไม่พบลูกค้า' };
      await Customer.findByIdAndUpdate(id, { ...input, updatedAt: new Date() });
    }

    // sync ข้อมูลใหม่ไปยังบิล/เอกสารทั้งหมดของลูกค้าคนนี้
    // จับคู่ด้วยเบอร์โทรเดิมเป็นหลัก ถ้าไม่มีเบอร์ใช้ชื่อเดิม (เฉพาะบิลที่ไม่มีเบอร์ กันไปแก้บิลคนอื่นที่ชื่อซ้ำ)
    const oldName = displayName(existing);
    const docFilter = existing.phone?.trim()
      ? { customerPhone: existing.phone.trim() }
      : oldName ? { customerName: oldName, customerPhone: '' } : null;

    if (docFilter) {
      const newName = displayName(input);
      const { FinancialDocument } = await import('@/models/FinancialDocument');
      await FinancialDocument.updateMany(docFilter, {
        $set: {
          ...(newName ? { customerName: newName } : {}), // ไม่ล้างชื่อบนบิลถ้าลูกค้าไม่มีชื่อ
          customerPhone:   input.phone,
          customerEmail:   input.email,
          customerAddress: input.address,
          customerTaxId:   input.taxId,
          customerBranch:  input.branch,
        },
      });
      revalidatePath('/admin/documents');
    }

    invalidateCustomerListCache();
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
    invalidateCustomerListCache();
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
        invalidateCustomerListCache();
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
    invalidateCustomerListCache();
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
    invalidateCustomerListCache();
    revalidatePath('/admin/customers');
    return { ok: true };
  } catch (err) {
    console.error('[deleteCustomer]', err);
    return { error: 'ลบไม่สำเร็จ' };
  }
}
