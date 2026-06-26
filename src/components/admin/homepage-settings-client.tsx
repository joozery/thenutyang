'use client';

import { useState, useTransition, useRef } from 'react';
import { saveHomepageSettings } from '@/app/actions/homepage-settings';
import type { HomepageSettingsData } from '@/lib/homepage-settings';
import { CheckCircle, PlayCircle, Eye, EyeOff, Upload, Loader2, X } from 'lucide-react';

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 bg-white transition-all';

export function HomepageSettingsClient({ settings }: { settings: HomepageSettingsData }) {
  const [form, setForm] = useState({ ...settings, videoType: 'file' as const });
  const [fileUrl, setFileUrl] = useState(settings.videoUrl ?? '');
  const [toast, setToast] = useState('');
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    startTransition(async () => {
      const res = await saveHomepageSettings({ ...form, videoUrl: fileUrl, videoType: 'file' });
      if (res.ok) {
        setToast('บันทึกแล้ว');
        setTimeout(() => setToast(''), 2500);
      }
    });
  }

  async function handleFileUpload(file: File) {
    setUploadError('');
    setUploading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/upload-video');
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status < 300) resolve(data.url);
          else reject(new Error(data.error ?? 'Upload failed'));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(fd);
      });

      setFileUrl(url);
      setUploadProgress(100);
      const updated = { ...form, videoUrl: url, videoType: 'file' as const, videoPublished: true };
      setForm(updated);
      const saveRes = await saveHomepageSettings(updated);
      if (saveRes.ok) {
        setToast('อัปโหลดและบันทึกแล้ว');
        setTimeout(() => setToast(''), 2500);
      } else {
        setUploadError(`บันทึกไม่สำเร็จ: ${saveRes.error}`);
      }
    } catch (e) {
      setUploadError(String(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-lg shadow-xl flex items-center gap-2">
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">

        {/* Header + Published toggle */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <PlayCircle size={20} className="text-red-500" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">วิดีโอหน้าแรก</h2>
            <p className="text-xs text-slate-400">อัปโหลดไฟล์วิดีโอ MP4 / WebM / MOV</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, videoPublished: !f.videoPublished }))}
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${form.videoPublished ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
          >
            {form.videoPublished ? <Eye size={14} /> : <EyeOff size={14} />}
            {form.videoPublished ? 'แสดงอยู่' : 'ซ่อนอยู่'}
          </button>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-600">ไฟล์วิดีโอ (MP4, WebM, MOV — สูงสุด 300MB)</label>
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          {fileUrl ? (
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
              <PlayCircle size={18} className="text-green-600 shrink-0" />
              <p className="text-xs text-slate-600 truncate flex-1">{fileUrl.split('/').pop()}</p>
              <button
                type="button"
                onClick={() => { setFileUrl(''); setForm(f => ({ ...f, videoUrl: '' })); }}
                className="text-slate-400 hover:text-red-500 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-10 flex flex-col items-center gap-2 text-slate-400 hover:border-green-400 hover:text-green-600 transition-all disabled:opacity-50"
            >
              {uploading ? <Loader2 size={28} className="animate-spin" /> : <Upload size={28} />}
              <span className="text-xs font-semibold">
                {uploading ? `กำลังอัปโหลด ${uploadProgress}%` : 'คลิกเพื่อเลือกไฟล์'}
              </span>
            </button>
          )}
          {uploading && (
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-200 rounded-full" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
        </div>

        {/* Title & Desc */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">หัวข้อวิดีโอ (ไม่บังคับ)</label>
          <input value={form.videoTitle} onChange={e => setForm(f => ({ ...f, videoTitle: e.target.value }))} className={inputCls} placeholder="เช่น ดูวิธีเปลี่ยนยางกับเรา" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">คำอธิบาย (ไม่บังคับ)</label>
          <textarea value={form.videoDesc} onChange={e => setForm(f => ({ ...f, videoDesc: e.target.value }))} rows={2} className={inputCls} placeholder="รายละเอียดเพิ่มเติม..." />
        </div>

        {/* Preview */}
        {fileUrl && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">ตัวอย่าง</p>
            <div className="rounded-xl overflow-hidden bg-slate-900 ring-1 ring-slate-200">
              <div className="aspect-video">
                <video src={fileUrl} controls className="w-full h-full" preload="metadata" />
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={isPending || uploading}
        className="w-full py-3.5 bg-gradient-to-br from-green-500 to-green-700 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-green-500/30 text-sm"
      >
        {isPending ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
      </button>
    </div>
  );
}
