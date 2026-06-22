import connectDB from './mongodb';
import { Customer } from '@/models/Customer';

export type CustomerProfile = {
  firstName: string;
  lastName: string;
  phone: string;
};

export async function getCustomerProfile(lineUserId: string): Promise<CustomerProfile | null> {
  await connectDB();
  const doc = await Customer.findOne({ lineUserId }).lean() as CustomerProfile | null;
  if (!doc) return null;
  return { firstName: doc.firstName ?? '', lastName: doc.lastName ?? '', phone: doc.phone ?? '' };
}
