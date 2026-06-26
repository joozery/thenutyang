import { getHomepageSettings } from '@/lib/homepage-settings';
import { HomepageSettingsClient } from '@/components/admin/homepage-settings-client';

export default async function HomepageSettingsPage() {
  const settings = await getHomepageSettings();
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">ตั้งค่าหน้าหลัก</h1>
        <p className="text-sm text-slate-400 mt-1">จัดการวิดีโอที่แสดงในหน้าแรกของเว็บไซต์</p>
      </div>
      <HomepageSettingsClient settings={settings} />
    </div>
  );
}
