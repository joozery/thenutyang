import connectDB from './mongodb';
import { DocumentSettings, type IDocumentSettings } from '@/models/DocumentSettings';

const EMPTY: IDocumentSettings = {
  logoUrl: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  taxId: '',
  issuerName: '',
  issuerSignatureUrl: '',
  approverName: '',
  approverSignatureUrl: '',
  stampUrl: '',
  bankName: '',
  bankAccountNumber: '',
  bankAccountName: '',
  bankBranch: '',
  promptPay: '',
  paymentQrUrl: '',
  paymentNote: '',
  lineId: '',
  updatedAt: new Date(0),
};

export async function getDocumentSettings(): Promise<IDocumentSettings> {
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await DocumentSettings.findOne({}).lean() as any;
  if (!doc) return EMPTY;
  // ตัด _id (ObjectId) / __v ออก — ส่งตรงไป Client Component ไม่ได้เพราะไม่ใช่ plain object
  return {
    logoUrl:              doc.logoUrl ?? '',
    companyName:          doc.companyName ?? '',
    address:              doc.address ?? '',
    phone:                doc.phone ?? '',
    email:                doc.email ?? '',
    website:              doc.website ?? '',
    taxId:                doc.taxId ?? '',
    issuerName:           doc.issuerName ?? '',
    issuerSignatureUrl:   doc.issuerSignatureUrl ?? '',
    approverName:         doc.approverName ?? '',
    approverSignatureUrl: doc.approverSignatureUrl ?? '',
    stampUrl:             doc.stampUrl ?? '',
    bankName:             doc.bankName ?? '',
    bankAccountNumber:    doc.bankAccountNumber ?? '',
    bankAccountName:      doc.bankAccountName ?? '',
    bankBranch:           doc.bankBranch ?? '',
    promptPay:            doc.promptPay ?? '',
    paymentQrUrl:         doc.paymentQrUrl ?? '',
    paymentNote:          doc.paymentNote ?? '',
    lineId:               doc.lineId ?? '',
    updatedAt:            doc.updatedAt ?? new Date(0),
  };
}
