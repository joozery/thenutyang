'use client';

import { Printer } from 'lucide-react';

export function PrintPageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; height: auto !important; }
          .no-print { display: none !important; }
          .print-shell-bg { background: none !important; padding: 0 !important; min-height: 0 !important; }
          .print-shell-frame { box-shadow: none !important; border-radius: 0 !important; overflow: visible !important; }
          #print-document { margin: 0 !important; }
          #print-document * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="print-shell-bg min-h-screen bg-slate-100 flex flex-col items-center py-6">
        <div className="no-print mb-4 flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-10">
          <span className="text-sm font-semibold text-slate-600">ตัวอย่างก่อนพิมพ์</span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700"
          >
            <Printer size={15} /> พิมพ์เอกสาร
          </button>
        </div>
        <div className="print-shell-frame shadow-2xl rounded-xl overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
}
