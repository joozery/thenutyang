import { Landmark, QrCode, StickyNote } from 'lucide-react';
import type { IDocumentSettings } from '@/models/DocumentSettings';

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 text-[12px] py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-900 text-right">{value}</span>
    </div>
  );
}

export function PaymentInfoPage({
  settings,
  docNumber,
  docTypeLabel,
  grandTotal,
}: {
  settings: IDocumentSettings;
  docNumber: string;
  docTypeLabel: string;
  grandTotal: number;
}) {
  const hasBankInfo = settings.bankName || settings.bankAccountNumber || settings.promptPay;

  return (
    <div id="print-document" style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '14mm 12mm' }} className="text-slate-800 text-[12px]">
      <div className="flex justify-between items-start mb-6">
        <div className="h-14 flex items-center">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.companyName} className="h-full w-auto object-contain" />
          ) : (
            <span className="text-xl font-black text-slate-900">{settings.companyName || 'บริษัทของคุณ'}</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-green-700">ข้อมูลการรับชำระเงิน</div>
          <div className="text-[10px] text-slate-500 mt-0.5">อ้างอิง {docTypeLabel} {docNumber}</div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5 flex items-center justify-between">
        <span className="font-bold text-slate-800">ยอดที่ต้องชำระ</span>
        <span className="text-2xl font-black text-green-700 tabular-nums">฿{grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-3">
          {hasBankInfo && (
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="font-bold text-slate-900 mb-2 flex items-center gap-1.5"><Landmark size={14} className="text-green-600" /> โอนเงินผ่านบัญชีธนาคาร</p>
              <Row label="ธนาคาร" value={settings.bankName} />
              <Row label="สาขา" value={settings.bankBranch} />
              <Row label="เลขที่บัญชี" value={settings.bankAccountNumber} />
              <Row label="ชื่อบัญชี" value={settings.bankAccountName} />
              <Row label="พร้อมเพย์" value={settings.promptPay} />
            </div>
          )}
          {settings.paymentNote && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-[11px] text-slate-800">
              <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5"><StickyNote size={12} /> หมายเหตุ</p>
              <p className="whitespace-pre-line leading-relaxed">{settings.paymentNote}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center border border-slate-200 rounded-xl p-4">
          {settings.paymentQrUrl ? (
            <img src={settings.paymentQrUrl} alt="QR Code รับเงิน" className="w-48 h-48 object-contain" />
          ) : (
            <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-300 gap-2">
              <QrCode size={48} />
              <span className="text-[11px]">ไม่มี QR Code</span>
            </div>
          )}
          <p className="text-[11px] text-slate-500 mt-2">สแกนเพื่อชำระเงิน</p>
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-slate-100 text-center text-[9px] text-slate-500">
        เอกสารนี้เป็นส่วนเสริมของ {docTypeLabel} {docNumber} · ออกโดย {settings.companyName || ''}
      </div>
    </div>
  );
}
