'use client';

import { Children, useState } from 'react';
import { Printer } from 'lucide-react';

type PaperSize = 'A4' | 'A5';

// A5 (148×210mm) = A4 ย่อด้วยสัดส่วน 1/√2 พอดี — ใช้ transform scale เลย์เอาต์เหมือนเดิมทุกจุด
const A5_SCALE = 0.7071;

// children = 1 หน้าเอกสารปกติ, มากกว่า 1 = หลายหน้าต่อกัน (เช่น เอกสารหลัก + หน้าข้อมูลการรับชำระ)
// แต่ละหน้าจะถูกครอบด้วยกรอบของตัวเอง และตัดขึ้นหน้าใหม่ให้อัตโนมัติตอนพิมพ์จริง
export function PrintPageShell({ children }: { children: React.ReactNode }) {
  const pages = Children.toArray(children);
  const [paper, setPaper] = useState<PaperSize>('A4');
  const isA5 = paper === 'A5';

  return (
    <>
      <style>{`
        @media print {
          @page { size: ${paper}; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; height: auto !important; }
          .no-print { display: none !important; }
          .print-shell-bg { background: none !important; padding: 0 !important; min-height: 0 !important; gap: 0 !important; }
          .print-page { box-shadow: none !important; border-radius: 0 !important; overflow: visible !important; break-after: page; }
          .print-page:last-child { break-after: auto; }
          #print-document { margin: 0 !important; }
          #print-document * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="print-shell-bg min-h-screen bg-slate-100 flex flex-col items-center gap-6 py-6">
        <div className="no-print mb-4 flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-10">
          <span className="text-sm font-semibold text-slate-600">ตัวอย่างก่อนพิมพ์{pages.length > 1 ? ` (${pages.length} หน้า)` : ''}</span>
          {/* เลือกขนาดกระดาษ */}
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
            {(['A4', 'A5'] as PaperSize[]).map(p => (
              <button
                key={p}
                onClick={() => setPaper(p)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  paper === p ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700"
          >
            <Printer size={15} /> พิมพ์เอกสาร
          </button>
        </div>
        {pages.map((page, i) => (
          <div
            key={i}
            className="print-page shadow-2xl rounded-xl overflow-hidden bg-white"
            style={isA5 ? { width: '148mm', height: '210mm' } : undefined}
          >
            <div style={isA5 ? { transform: `scale(${A5_SCALE})`, transformOrigin: 'top left', width: '210mm' } : undefined}>
              {page}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
