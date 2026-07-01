'use client';

import { useActionState, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { uploadImage } from '@/app/actions/upload';
import {
  updateDocumentInfo,
  setDocumentLogo,
  setIssuerSignature,
  setApproverSignature,
  setCompanyStamp,
} from '@/app/actions/document-settings';
import type { IDocumentSettings } from '@/models/DocumentSettings';

function ImageUploadField({
  label, hint, currentUrl, folder, onUploaded, shape = 'box',
}: {
  label: string;
  hint: string;
  currentUrl: string;
  folder: string;
  onUploaded: (url: string) => Promise<{ error?: string; ok?: boolean }>;
  shape?: 'box' | 'wide';
}) {
  const [image, setImage] = useState(currentUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { url } = await uploadImage(fd, folder);
      const result = await onUploaded(url);
      if (result.error) throw new Error(result.error);
      setImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ');
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className={`rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 ${shape === 'wide' ? 'w-32 h-20' : 'w-20 h-20'}`}>
        {image ? (
          <img src={image} alt={label} className="w-full h-full object-contain p-1.5" />
        ) : (
          <span className="text-[10px] text-slate-400 text-center px-1.5">ไม่มีรูป</span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-[11px] text-slate-400 mb-1.5">{hint}</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <Upload size={12} /> {isUploading ? 'กำลังอัปโหลด...' : image ? 'เปลี่ยนรูป' : 'อัปโหลด'}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}

export function DocumentSettingsForm({ settings }: { settings: IDocumentSettings }) {
  const [state, formAction, isPending] = useActionState(updateDocumentInfo, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state?.ok]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <h2 className="font-bold text-slate-900 text-sm mb-4">โลโก้บริษัท</h2>
        <ImageUploadField
          label="โลโก้" hint="แสดงที่หัวกระดาษเอกสารทุกใบ" currentUrl={settings.logoUrl}
          folder="documents" onUploaded={setDocumentLogo} shape="wide"
        />
      </div>

      <form action={formAction} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-slate-900 text-sm">ข้อมูลหัวกระดาษ</h2>
        {state?.error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}
        {state?.ok && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">บันทึกแล้ว</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">ชื่อบริษัท/ร้าน</label>
            <input name="companyName" defaultValue={settings.companyName} placeholder="บริษัท เดอะนัททายางยนต์ จำกัด"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">เลขที่ผู้เสียภาษี</label>
            <input name="taxId" defaultValue={settings.taxId} placeholder="0105560197458"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">ที่อยู่</label>
          <textarea name="address" defaultValue={settings.address} rows={2} placeholder="เลขที่ 28 ถนนวิภาวดีรังสิต แขวง... เขต... กรุงเทพฯ 10400"
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">เบอร์โทร</label>
            <input name="phone" defaultValue={settings.phone} placeholder="082-559-5666"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">LINE @</label>
            <input name="lineId" defaultValue={settings.lineId} placeholder="@thenuttire"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">อีเมล</label>
            <input name="email" type="email" defaultValue={settings.email} placeholder="thenuttire@gmail.com"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">เว็บไซต์/Facebook</label>
            <input name="website" defaultValue={settings.website} placeholder="www.facebook.com/thenuttire"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">ชื่อผู้ออกเอกสาร</label>
            <input name="issuerName" defaultValue={settings.issuerName} placeholder="ชื่อ-นามสกุล"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">ชื่อผู้อนุมัติเอกสาร</label>
            <input name="approverName" defaultValue={settings.approverName} placeholder="ชื่อ-นามสกุล"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
          </div>
        </div>

        <button type="submit" disabled={isPending}
          className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
          {isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </form>

      <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-5">
        <h2 className="font-bold text-slate-900 text-sm">ลายเซ็นและตราประทับ</h2>
        <ImageUploadField
          label="ลายเซ็นผู้ออกเอกสาร" hint="แสดงในช่อง “ผู้ออกเอกสาร (ผู้ขาย)”" currentUrl={settings.issuerSignatureUrl}
          folder="signatures" onUploaded={setIssuerSignature}
        />
        <ImageUploadField
          label="ลายเซ็นผู้อนุมัติเอกสาร" hint="แสดงในช่อง “ผู้อนุมัติเอกสาร (ผู้ขาย)”" currentUrl={settings.approverSignatureUrl}
          folder="signatures" onUploaded={setApproverSignature}
        />
        <ImageUploadField
          label="ตราประทับบริษัท" hint="แสดงในช่อง “ตราประทับ (ผู้ขาย)” (ถ้ามี)" currentUrl={settings.stampUrl}
          folder="signatures" onUploaded={setCompanyStamp}
        />
      </div>
    </div>
  );
}
