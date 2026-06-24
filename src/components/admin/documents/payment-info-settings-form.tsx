'use client';

import { useActionState, useRef, useState } from 'react';
import { Upload, QrCode } from 'lucide-react';
import { uploadImage } from '@/app/actions/upload';
import { updatePaymentInfo, setPaymentQr } from '@/app/actions/document-settings';
import type { IDocumentSettings } from '@/models/DocumentSettings';

const inputCls = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100";

export function PaymentInfoSettingsForm({ settings }: { settings: IDocumentSettings }) {
  const [state, formAction, isPending] = useActionState(updatePaymentInfo, null);
  const [qr, setQr] = useState(settings.paymentQrUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [qrError, setQrError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUploadQr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setQrError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { url } = await uploadImage(fd, 'documents');
      const result = await setPaymentQr(url);
      if (result.error) throw new Error(result.error);
      setQr(url);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ');
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-slate-900 text-sm">บัญชีรับโอนเงิน</h2>
        {state?.error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}
        {state?.ok && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">บันทึกแล้ว</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">ธนาคาร</label>
            <input name="bankName" defaultValue={settings.bankName} placeholder="ธนาคารกสิกรไทย" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">สาขา</label>
            <input name="bankBranch" defaultValue={settings.bankBranch} placeholder="สาขาบิ๊กซี รัตนาธิเบศร์" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">เลขที่บัญชี</label>
            <input name="bankAccountNumber" defaultValue={settings.bankAccountNumber} placeholder="123-4-56789-0" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">ชื่อบัญชี</label>
            <input name="bankAccountName" defaultValue={settings.bankAccountName} placeholder="บริษัท เดอะนัททายางยนต์ จำกัด" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">พร้อมเพย์ (ถ้ามี)</label>
          <input name="promptPay" defaultValue={settings.promptPay} placeholder="เบอร์โทร หรือเลขผู้เสียภาษีที่ผูกพร้อมเพย์" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">หมายเหตุการชำระเงิน</label>
          <textarea name="paymentNote" defaultValue={settings.paymentNote} rows={2} placeholder="เช่น โอนแล้วกรุณาแจ้งสลิปทาง LINE @thenuttire เพื่อยืนยันการสั่งซื้อ"
            className={inputCls + ' resize-none'} />
        </div>

        <button type="submit" disabled={isPending}
          className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
          {isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </form>

      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <h2 className="font-bold text-slate-900 text-sm mb-4">QR Code รับเงิน</h2>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
            {qr ? <img src={qr} alt="QR Code" className="w-full h-full object-contain p-1.5" /> : <QrCode size={28} className="text-slate-300" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">QR พร้อมเพย์ / โอนเงิน</p>
            <p className="text-[11px] text-slate-400 mb-1.5">แสดงในหน้าข้อมูลการรับชำระเงินของเอกสาร</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <Upload size={12} /> {isUploading ? 'กำลังอัปโหลด...' : qr ? 'เปลี่ยนรูป' : 'อัปโหลด'}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUploadQr} />
            {qrError && <p className="text-xs text-red-500 mt-1">{qrError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
