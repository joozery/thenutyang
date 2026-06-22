'use client';

import { Printer, X } from 'lucide-react';
import { DocumentTemplate, type DocumentTemplateProps } from './document-template';

export function DocumentPrintModal({ onClose, ...templateProps }: DocumentTemplateProps & { onClose: () => void }) {
  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-document { display: block !important; position: fixed; inset: 0; z-index: 9999; background: white; }
          #print-document * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 flex flex-col items-center w-full max-h-[95vh]">
          <div className="flex items-center gap-3 mb-3 bg-white/10 backdrop-blur px-4 py-2 rounded-xl border border-white/20">
            <span className="text-white text-sm font-semibold">ตัวอย่างก่อนพิมพ์</span>
            <div className="w-px h-4 bg-white/30" />
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700"
            >
              <Printer size={15} /> พิมพ์เอกสาร
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[85vh] rounded-xl shadow-2xl">
            <DocumentTemplate {...templateProps} />
          </div>
        </div>
      </div>
    </>
  );
}
