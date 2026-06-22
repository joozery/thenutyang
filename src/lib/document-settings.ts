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
  updatedAt: new Date(0),
};

export async function getDocumentSettings(): Promise<IDocumentSettings> {
  await connectDB();
  const doc = await DocumentSettings.findOne({}).lean() as IDocumentSettings | null;
  return doc ?? EMPTY;
}
