import connectDB from '@/lib/mongodb';
import { Banner, IBanner } from '@/models/Banner';

export type BannerSlot = 'main' | 'promo1' | 'promo2';

export type BannerRow = {
  id: string;
  slot: BannerSlot;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  bgImage: string;
  published: boolean;
  updatedAt: string;
};

// Default banners ถ้ายังไม่มีใน DB
const DEFAULTS: Record<BannerSlot, Omit<IBanner, 'updatedAt'>> = {
  main: {
    slot: 'main',
    title: 'ซื้อ 3 แถม 1',
    subtitle: 'เฉพาะรุ่นที่ร่วมรายการ',
    buttonText: 'ช้อปเลย',
    buttonLink: '/tires',
    bgImage: '/yang/green.png',
    published: true,
  },
  promo1: {
    slot: 'promo1',
    title: 'ผ่อน 0%',
    subtitle: 'สูงสุด 4 เดือน',
    buttonText: 'ดูรายละเอียด',
    buttonLink: '/tires',
    bgImage: '/cover/31.png',
    published: true,
  },
  promo2: {
    slot: 'promo2',
    title: 'บริการตั้งศูนย์',
    subtitle: 'เริ่มต้น 500.-',
    buttonText: 'จองคิวรับบริการ',
    buttonLink: '/booking',
    bgImage: '/ser.png',
    published: true,
  },
};

function toRow(doc: any): BannerRow {
  return {
    id: doc._id?.toString() ?? doc.id,
    slot: doc.slot,
    title: doc.title,
    subtitle: doc.subtitle,
    buttonText: doc.buttonText,
    buttonLink: doc.buttonLink,
    bgImage: doc.bgImage,
    published: doc.published,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : '',
  };
}

export async function getAllBanners(): Promise<BannerRow[]> {
  await connectDB();
  const slots: BannerSlot[] = ['main', 'promo1', 'promo2'];
  const results: BannerRow[] = [];

  for (const slot of slots) {
    let doc = await Banner.findOne({ slot }).lean();
    if (!doc) {
      // Auto-seed default
      doc = await Banner.create({ ...DEFAULTS[slot], updatedAt: new Date() });
    }
    results.push(toRow(doc));
  }

  return results;
}

export async function getBannerBySlot(slot: BannerSlot): Promise<BannerRow | null> {
  await connectDB();
  let doc = await Banner.findOne({ slot }).lean();
  if (!doc) {
    doc = await Banner.create({ ...DEFAULTS[slot], updatedAt: new Date() });
  }
  return toRow(doc);
}
