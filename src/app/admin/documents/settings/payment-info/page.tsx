import { getDocumentSettings } from '@/lib/document-settings';
import { PaymentInfoSettingsForm } from '@/components/admin/documents/payment-info-settings-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ข้อมูลการรับชำระเงิน | Admin' };

export default async function PaymentInfoSettingsPage() {
  const settings = await getDocumentSettings();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">ข้อมูลการรับชำระเงิน</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          เลขบัญชี/พร้อมเพย์/QR ที่จะแสดงเป็นหน้าที่ 2 ต่อจากเอกสาร เมื่อติ๊ก &quot;แสดงข้อมูลการรับชำระ&quot; ตอนสร้างเอกสาร
        </p>
      </div>
      <PaymentInfoSettingsForm settings={settings} />
    </div>
  );
}
