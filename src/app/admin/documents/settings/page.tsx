import { getDocumentSettings } from '@/lib/document-settings';
import { DocumentSettingsForm } from '@/components/admin/documents/document-settings-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ตั้งค่าหัวกระดาษเอกสาร | Admin' };

export default async function DocumentSettingsPage() {
  const settings = await getDocumentSettings();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">ตั้งค่าหัวกระดาษเอกสาร</h1>
        <p className="text-xs text-slate-400 mt-0.5">โลโก้ ข้อมูลบริษัท และลายเซ็นที่จะแสดงบนใบเสนอราคา ใบเสร็จ/ใบกำกับภาษี ใบลดหนี้ และใบสั่งซื้อ</p>
      </div>
      <DocumentSettingsForm settings={settings} />
    </div>
  );
}
