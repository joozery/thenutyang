import connectDB from './mongodb';
import { Customer } from '@/models/Customer';
import type { VehicleEntry } from '@/models/Customer';

export type CustomerDirectoryRow = {
  id: string;
  customerType: 'individual' | 'corporate';
  relationType: 'customer' | 'partner';
  displayName: string;
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
  source: 'online' | 'walkin';
  createdAt: string;
};

function getDisplayName(d: Record<string, unknown>): string {
  const companyName = (d.companyName as string) ?? '';
  if (d.customerType === 'corporate' && companyName) return companyName;
  const fullName = `${(d.firstName as string) ?? ''} ${(d.lastName as string) ?? ''}`.trim();
  return fullName || companyName || 'ไม่ระบุชื่อ';
}

export async function getCustomerDirectory(): Promise<CustomerDirectoryRow[]> {
  await connectDB();
  const docs = await Customer.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    customerType: (d.customerType as 'individual' | 'corporate') ?? 'individual',
    relationType: (d.relationType as 'customer' | 'partner') ?? 'customer',
    displayName: getDisplayName(d),
    firstName: d.firstName ?? '',
    lastName: d.lastName ?? '',
    companyName: d.companyName ?? '',
    phone: d.phone ?? '',
    email: d.email ?? '',
    address: d.address ?? '',
    taxId: d.taxId ?? '',
    branch: d.branch ?? '',
    carInfo: d.carInfo ?? '',
    vehicles: (d.vehicles as VehicleEntry[] | undefined) ?? [],
    note: d.note ?? '',
    source: (d.source as 'online' | 'walkin') ?? 'walkin',
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt ?? ''),
  }));
}
