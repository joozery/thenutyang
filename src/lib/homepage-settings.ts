import connectDB from './mongodb';
import { HomepageSettings } from '@/models/HomepageSettings';

export type HomepageSettingsData = {
  videoType:      'youtube' | 'file';
  videoUrl:       string;
  videoTitle:     string;
  videoDesc:      string;
  videoPublished: boolean;
};

export async function getHomepageSettings(): Promise<HomepageSettingsData> {
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await HomepageSettings.findOne().lean() as any;
  return {
    videoType:      doc?.videoType      ?? 'file',
    videoUrl:       doc?.videoUrl       ?? '',
    videoTitle:     doc?.videoTitle     ?? '',
    videoDesc:      doc?.videoDesc      ?? '',
    videoPublished: doc?.videoPublished ?? false,
  };
}
