'use client';

import { useState, useTransition } from 'react';
import { saveHomepageSettings } from '@/app/actions/homepage-settings';
import type { HomepageSettingsData } from '@/lib/homepage-settings';
import { CheckCircle, PlayCircle, Eye, EyeOff } from 'lucide-react';

function youtubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  const long = url.match(/(?:v=|\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (long) return `https://www.youtube.com/embed/${long[1]}`;
  return null;
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 bg-white transition-all';

export function HomepageSettingsClient({ settings }: { settings: HomepageSettingsData }) {
  const [form, setForm] = useState(settings);
  const [toast, setToast] = useState('');
  const [isPending, startTransition] = useTransition();

  const embedUrl = youtubeEmbedUrl(form.videoUrl);

  function handleSave() {
    startTransition(async () => {
      const res = await saveHomepageSettings(form);
      if (res.ok) {
        setToast('บันทึกแล้ว');
        setTimeout(() => setToast(''), 2500);
      }
    });
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-lg shadow-xl flex items-center gap-2">
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      {/* Video Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <PlayCircle size={20} className="text-red-500" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">วิดีโอหน้าแรก</h2>
            <p className="text-xs text-slate-400">รองรับ YouTube URL</p>
          </div>
          {/* Published toggle */}
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, videoPublished: !f.videoPublished }))}
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
              form.videoPublished
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-400'
            }`}
          >
            {form.videoPublished ? <Eye size={14} /> : <EyeOff size={14} />}
            {form.videoPublished ? 'แสดงอยู่' : 'ซ่อนอยู่'}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">YouTube URL</label>
          <input
            value={form.videoUrl}
            onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
            className={inputCls}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {form.videoUrl && !embedUrl && (
            <p className="text-xs text-red-500">URL ไม่ถูกต้อง — รองรับเฉพาะ YouTube เท่านั้น</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">หัวข้อวิดีโอ (ไม่บังคับ)</label>
          <input
            value={form.videoTitle}
            onChange={e => setForm(f => ({ ...f, videoTitle: e.target.value }))}
            className={inputCls}
            placeholder="เช่น ดูวิธีเปลี่ยนยางกับเรา"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">คำอธิบาย (ไม่บังคับ)</label>
          <textarea
            value={form.videoDesc}
            onChange={e => setForm(f => ({ ...f, videoDesc: e.target.value }))}
            rows={2}
            className={inputCls}
            placeholder="รายละเอียดเพิ่มเติม..."
          />
        </div>

        {/* Preview */}
        {embedUrl && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">ตัวอย่าง</p>
            <div className="rounded-xl overflow-hidden bg-slate-900 ring-1 ring-slate-200">
              <div className="aspect-video">
                <iframe
                  src={`${embedUrl}?rel=0&modestbranding=1`}
                  title="preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-3.5 bg-gradient-to-br from-green-500 to-green-700 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-green-500/30 text-sm"
      >
        {isPending ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
      </button>
    </div>
  );
}
