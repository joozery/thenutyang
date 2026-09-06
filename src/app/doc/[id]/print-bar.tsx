'use client';

import { Printer, Download } from 'lucide-react';

export function PrintBar({ docNumber, docTypeLabel }: { docNumber: string; docTypeLabel: string }) {
  return (
    <div className="no-print flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-10">
      <span className="text-sm font-semibold text-slate-700">{docNumber}</span>
      <span className="text-slate-300">·</span>
      <span className="text-sm text-slate-500">{docTypeLabel}</span>
      <div className="flex items-center gap-2 ml-2">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors"
        >
          <Printer size={13} /> พิมพ์
        </button>
        <button
          onClick={() => {
            const orig = document.title;
            document.title = docNumber;
            window.print();
            document.title = orig;
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
        >
          <Download size={13} /> บันทึก PDF
        </button>
      </div>
    </div>
  );
}
