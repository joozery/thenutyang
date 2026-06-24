import Link from 'next/link';
import { Wrench, ChevronRight } from 'lucide-react';
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

      <Link
        href="/admin/documents/settings/services"
        className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 p-4 hover:border-green-300 hover:bg-green-50/30 transition-colors"
      >
        <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center text-green-600 shrink-0"><Wrench size={16} /></div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm">รายการบริการ / ค่าแรง</p>
          <p className="text-xs text-slate-400">จัดการรายชื่อบริการ เช่น ค่าแรงช่าง ค่าตั้งศูนย์ ไว้เลือกใส่ในบิลได้ทันที</p>
        </div>
        <ChevronRight size={16} className="text-slate-400" />
      </Link>

      <DocumentSettingsForm settings={settings} />
    </div>
  );
}
