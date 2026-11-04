import { cache } from 'react';
import connectDB from '@/lib/mongodb';
import ContactSettings, { type IContactSettings } from '@/models/ContactSettings';

export type ContactSettingsData = Omit<IContactSettings, keyof import('mongoose').Document> & { id: string };

/**
 * ดึงข้อมูลติดต่อร้าน (เอกสารเดียวในคอลเลกชัน)
 * ห่อด้วย React cache() เพื่อให้ header / footer / sticky contact / หน้าแรก
 * ที่เรียกใน request เดียวกัน ใช้ผลลัพธ์ร่วมกัน — query DB แค่ครั้งเดียว
 */
export const getContactSettings = cache(async (): Promise<ContactSettingsData | null> => {
  await connectDB();
  const doc = await ContactSettings.findOne({}).lean();
  if (!doc) return null;
  const { _id, __v, ...rest } = doc as unknown as Record<string, unknown>;
  void __v;
  // แปลงเป็น plain object (Date/ObjectId → string) เพื่อส่งข้าม server/client ได้
  return JSON.parse(JSON.stringify({ ...rest, id: String(_id) }));
});
