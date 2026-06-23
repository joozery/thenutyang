'use client';

import { useRef, useState } from 'react';
import { QrCode, Upload } from 'lucide-react';
import { uploadImage } from '@/app/actions/upload';
import { setPaymentQrImage } from '@/app/actions/payment';

export function QrUploadForm({ currentImage }: { currentImage: string }) {
  const [image, setImage] = useState(currentImage);
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
      const { url } = await uploadImage(fd, 'settings');
      const result = await setPaymentQrImage(url);
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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
       {/* Background accent */}
       <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2.5 bg-green-100 text-green-600 rounded-xl">
          <QrCode size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">QR Code รับเงิน</h2>
          <p className="text-xs text-slate-500 mt-0.5">รูปที่จะแสดงให้ลูกค้าสแกนชำระมัดจำ</p>
        </div>
      </div>

      <div className="flex flex-col items-center flex-1 justify-center relative z-10">
        <div className="w-full max-w-[240px] aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden mb-6 group relative">
          {image ? (
            <>
              <img src={image} alt="QR Code" className="w-full h-full object-contain bg-white" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                 <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full font-bold hover:scale-105 transition-transform text-sm shadow-xl">
                   <Upload size={16} /> เปลี่ยนรูป
                 </button>
              </div>
            </>
          ) : (
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                <QrCode size={24} className="text-slate-300" />
              </div>
              <span className="text-sm text-slate-400 font-medium block mb-1">ยังไม่มี QR Code</span>
              <span className="text-[10px] text-slate-400 block">คลิกปุ่มด้านล่างเพื่ออัปโหลด</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="w-full flex justify-center items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-md"
        >
          <Upload size={16} /> {isUploading ? 'กำลังอัปโหลด...' : image ? 'เปลี่ยน QR Code ใหม่' : 'อัปโหลด QR Code'}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
        {error && <p className="text-xs text-red-500 mt-3 text-center bg-red-50 p-2 rounded-lg w-full">{error}</p>}
      </div>
    </div>
  );
}
