'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Banner } from '@/models/Banner';
import type { BannerSlot } from '@/lib/banners';

type Result = { ok: true } | { ok: false; error: string };

type BannerInput = {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  bgImage: string;
  published: boolean;
};

export async function updateBanner(slot: BannerSlot, data: BannerInput): Promise<Result> {
  try {
    await connectDB();
    await Banner.findOneAndUpdate(
      { slot },
      { ...data, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    revalidatePath('/');
    revalidatePath('/admin/banners');
    return { ok: true };
  } catch (e) {
    console.error('[updateBanner]', e);
    return { ok: false, error: String(e) };
  }
}
