'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { HomepageSettings } from '@/models/HomepageSettings';

export async function saveHomepageSettings(data: {
  videoUrl: string;
  videoTitle: string;
  videoDesc: string;
  videoPublished: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await connectDB();
    await HomepageSettings.findOneAndUpdate({}, { $set: data }, { upsert: true });
    revalidatePath('/');
    revalidatePath('/admin/settings/homepage');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
