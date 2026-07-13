'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Save, ShieldCheck, FileText, CheckCircle, AlertCircle, X, ExternalLink } from 'lucide-react';
import { updateLegalPage, type LegalKey, type LegalPageRow } from '@/app/actions/legal';

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] text-sm font-bold text-white ${type === 'success' ? 'bg-slate-900' : 'bg-red-500'}`}>
      {type === 'success' ? <CheckCircle size={20} className="text-green-400" /> : <AlertCircle size={20} />}
      {msg}
      <button onClick={onClose} className="ml-3 opacity-70 hover:opacity-100 bg-white/10 p-1 rounded-lg"><X size={16} /></button>
    </div>
  );
}

export function LegalSettingsClient({ privacy, terms }: { privacy: LegalPageRow; terms: LegalPageRow }) {
  const [tab, setTab] = useState<LegalKey>('privacy');
  const [pages, setPages] = useState<Record<LegalKey, { title: string; content: string }>>({
    privacy: { title: privacy.title, content: privacy.content },
    terms:   { title: terms.title,   content: terms.content },
  });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const current = pages[tab];
  const set = (field: 'title' | 'content', value: string) =>
    setPages(prev => ({ ...prev, [tab]: { ...prev[tab], [field]: value } }));

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateLegalPage(tab, pages[tab]);
      if (res.ok) showToast('บันทึกเรียบร้อยแล้ว');
      else showToast(res.error, 'error');
    });
  };

  const TABS: { key: LegalKey; label: string; icon: React.ReactNode; publicPath: string }[] = [
    { key: 'privacy', label: 'ความเป็นส่วนตัว',      icon: <ShieldCheck size={15} />, publicPath: '/privacy' },
    { key: 'terms',   label: 'เงื่อนไขการใช้บริการ', icon: <FileText size={15} />,    publicPath: '/terms' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">นโยบายและเงื่อนไข</h1>
          <p className="text-sm text-slate-500 mt-1">
            แก้ไขเนื้อหาหน้า "ความเป็นส่วนตัว" และ "เงื่อนไขการใช้บริการ" ที่แสดงตรง footer หน้าเว็บ
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isPending ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-3 pt-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-colors border-b-2 ${
                tab === t.key ? 'border-green-600 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
          <Link
            href={TABS.find(t => t.key === tab)!.publicPath}
            target="_blank"
            className="ml-auto flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold text-slate-400 hover:text-green-600 transition-colors"
          >
            ดูหน้าเว็บจริง <ExternalLink size={12} />
          </Link>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">ชื่อหน้า</label>
            <input
              value={current.title}
              onChange={e => set('title', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm font-bold"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">เนื้อหา</label>
            <textarea
              value={current.content}
              onChange={e => set('content', e.target.value)}
              rows={24}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all text-sm leading-relaxed"
              placeholder="พิมพ์เนื้อหา... ขึ้นบรรทัดใหม่ได้ตามต้องการ จะแสดงบนหน้าเว็บตามที่พิมพ์"
            />
            <p className="text-xs text-slate-400 mt-2">ขึ้นบรรทัดใหม่และเว้นวรรคจะแสดงตามที่พิมพ์ · ใช้ • หรือเลขข้อ เพื่อทำรายการ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
