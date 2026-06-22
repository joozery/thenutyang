'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

export function PickerModal<T>({
  title, placeholder, items, filterFn, renderItem, onSelect, onClose, footer,
}: {
  title: string;
  placeholder: string;
  items: T[];
  filterFn: (item: T, query: string) => boolean;
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? items.filter((i) => filterFn(i, q)) : items).slice(0, 50);
  }, [items, query, filterFn]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-900 text-sm">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">ไม่พบข้อมูล</div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={idx} type="button" onClick={() => onSelect(item)}
                className="w-full text-left px-5 py-3 hover:bg-green-50 border-b border-slate-50 last:border-0 transition-colors"
              >
                {renderItem(item)}
              </button>
            ))
          )}
        </div>
        {footer && <div className="border-t border-slate-100 p-3 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
