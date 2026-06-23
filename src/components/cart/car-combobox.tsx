'use client';

import { useEffect, useRef, useState } from 'react';

type Option = { id: string; label: string };

export function CarCombobox({
  name,
  options,
  placeholder,
  value,
  onChange,
}: {
  name: string;
  options: Option[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const trimmed = value.trim();
  const filtered = trimmed
    ? options.filter((o) => o.label.toLowerCase().includes(trimmed.toLowerCase()))
    : options;
  const exactMatch = options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());
  const showOtherRow = trimmed.length > 0 && !exactMatch;

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
      />
      {open && (filtered.length > 0 || showOtherRow) && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onChange(o.label); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 hover:text-green-700 transition-colors"
            >
              {o.label}
            </button>
          ))}
          {showOtherRow && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full text-left px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors border-t border-slate-100"
            >
              ไม่มีในรายการ — ใช้ &quot;{trimmed}&quot; ตามที่กรอก
            </button>
          )}
        </div>
      )}
    </div>
  );
}
