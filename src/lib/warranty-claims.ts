import connectDB from './mongodb';
import { WarrantyClaim } from '@/models/WarrantyClaim';
import type { ClaimStatus } from './warranty-claims-constants';
export type { ClaimStatus } from './warranty-claims-constants';
export { STATUS_LABEL, STATUS_COLOR } from './warranty-claims-constants';

export type ClaimItem = {
  productName: string;
  brand: string;
  size: string;
  quantity: number;
  reason: string;
};

export type ClaimRow = {
  id: string;
  claimNumber: string;
  customerName: string;
  customerPhone: string;
  licensePlate: string;
  claimDate: string;
  items: ClaimItem[];
  customerNotes: string;
  supplierName: string;
  supplierSentDate: string | null;
  supplierRef: string;
  supplierNotes: string;
  isAdvanced: boolean;
  advanceAmount: number;
  advanceDate: string | null;
  advanceNotes: string;
  resultDate: string | null;
  resultType: 'replacement' | 'money' | '';
  replacementDescription: string;
  compensationAmount: number;
  customerResolutionDate: string | null;
  customerResolutionNotes: string;
  status: ClaimStatus;
  createdAt: string;
};

function toRow(d: any): ClaimRow {
  return {
    id: String(d._id),
    claimNumber: d.claimNumber ?? '',
    customerName: d.customerName ?? '',
    customerPhone: d.customerPhone ?? '',
    licensePlate: d.licensePlate ?? '',
    claimDate: d.claimDate instanceof Date ? d.claimDate.toISOString() : String(d.claimDate ?? ''),
    items: (d.items ?? []).map((i: any) => ({
      productName: i.productName ?? '',
      brand: i.brand ?? '',
      size: i.size ?? '',
      quantity: i.quantity ?? 1,
      reason: i.reason ?? '',
    })),
    customerNotes: d.customerNotes ?? '',
    supplierName: d.supplierName ?? '',
    supplierSentDate: d.supplierSentDate ? new Date(d.supplierSentDate).toISOString() : null,
    supplierRef: d.supplierRef ?? '',
    supplierNotes: d.supplierNotes ?? '',
    isAdvanced: d.isAdvanced ?? false,
    advanceAmount: d.advanceAmount ?? 0,
    advanceDate: d.advanceDate ? new Date(d.advanceDate).toISOString() : null,
    advanceNotes: d.advanceNotes ?? '',
    resultDate: d.resultDate ? new Date(d.resultDate).toISOString() : null,
    resultType: d.resultType ?? '',
    replacementDescription: d.replacementDescription ?? '',
    compensationAmount: d.compensationAmount ?? 0,
    customerResolutionDate: d.customerResolutionDate ? new Date(d.customerResolutionDate).toISOString() : null,
    customerResolutionNotes: d.customerResolutionNotes ?? '',
    status: d.status ?? 'customer_filed',
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt ?? ''),
  };
}

export async function getWarrantyClaims(opts?: { status?: string; q?: string }): Promise<ClaimRow[]> {
  await connectDB();
  const query: any = {};
  if (opts?.status && opts.status !== 'all') query.status = opts.status;
  if (opts?.q) {
    const rx = new RegExp(opts.q, 'i');
    query.$or = [
      { claimNumber: rx },
      { customerName: rx },
      { licensePlate: rx },
      { supplierName: rx },
    ];
  }
  const docs = await WarrantyClaim.find(query).sort({ createdAt: -1 }).lean();
  return docs.map(toRow);
}

export async function getWarrantyClaimById(id: string): Promise<ClaimRow | null> {
  await connectDB();
  const doc = await WarrantyClaim.findById(id).lean();
  if (!doc) return null;
  return toRow(doc);
}

export async function generateClaimNumber(): Promise<string> {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `CLM-${ym}-`;
  const latest = await WarrantyClaim.findOne(
    { claimNumber: { $regex: `^${prefix}` } },
    { claimNumber: 1 },
  )
    .sort({ claimNumber: -1 })
    .lean() as { claimNumber?: string } | null;

  if (!latest) return `${prefix}001`;
  const parts = latest.claimNumber?.split('-') ?? [];
  const seq = parseInt(parts[2] ?? '0', 10);
  return `${prefix}${String(seq + 1).padStart(3, '0')}`;
}
