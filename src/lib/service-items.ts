import connectDB from './mongodb';
import { ServiceItem } from '@/models/ServiceItem';

export type ServiceItemRow = {
  id: string;
  name: string;
  price: number;
  cost: number;
  unit: string;
  note: string;
};

export async function getServiceItems(): Promise<ServiceItemRow[]> {
  await connectDB();
  const docs = await ServiceItem.find({}).sort({ name: 1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    name: d.name ?? '',
    price: d.price ?? 0,
    cost: d.cost ?? 0,
    unit: d.unit ?? 'ครั้ง',
    note: d.note ?? '',
  }));
}
