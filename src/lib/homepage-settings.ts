import connectDB from './mongodb';
import { HomepageSettings } from '@/models/HomepageSettings';

export type HomepageSettingsData = {
  videoUrl:       string;
  videoTitle:     string;
  videoDesc:      string;
  videoPublished: boolean;
};

export async function getHomepageSettings(): Promise<HomepageSettingsData> {
  await connectDB();
  const doc = await HomepageSettings.findOne().lean() as HomepageSettingsData | null;
  return {
    videoUrl:       doc?.videoUrl       ?? '',
    videoTitle:     doc?.videoTitle     ?? '',
    videoDesc:      doc?.videoDesc      ?? '',
    videoPublished: doc?.videoPublished ?? false,
  };
}
