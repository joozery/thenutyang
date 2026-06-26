'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface StickyContactProps {
  lineId: string;
  lineLabel: string;
  phoneMain: string;
  phoneMainLabel: string;
  phoneSale: string;
  phoneSaleLabel: string;
}

export function StickyContact({
  lineId,
  lineLabel,
  phoneMain,
  phoneMainLabel,
  phoneSale,
  phoneSaleLabel,
}: StickyContactProps) {
  const [open, setOpen] = useState(false);
  const lineUrl = `https://line.me/R/ti/p/${encodeURIComponent(lineId)}`;

  const contacts = [
    {
      key: 'phone2',
      href: `tel:${phoneSale.replace(/[-\s]/g, '')}`,
      bg: 'bg-slate-900',
      icon: <PhoneIcon className="text-yellow-400" />,
      label: phoneSaleLabel || 'ฝ่ายขาย',
      value: phoneSale,
      delay: 'delay-[0ms]',
    },
    {
      key: 'phone1',
      href: `tel:${phoneMain.replace(/[-\s]/g, '')}`,
      bg: 'bg-slate-900',
      icon: <PhoneIcon className="text-yellow-400" />,
      label: phoneMainLabel || 'โทร',
      value: phoneMain,
      delay: 'delay-[60ms]',
    },
    {
      key: 'line',
      href: lineUrl,
      bg: 'bg-[#06C755]',
      icon: <LineIcon />,
      label: 'LINE',
      value: lineLabel || lineId,
      delay: 'delay-[120ms]',
      external: true,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed right-4 bottom-24 md:bottom-8 z-40 flex flex-col items-end gap-3">

        {/* Contact Items — pop up when open */}
        <div className="flex flex-col items-end gap-2">
          {contacts.map((c) => (
            <a
              key={c.key}
              href={c.href}
              target={c.external ? '_blank' : undefined}
              rel={c.external ? 'noopener noreferrer' : undefined}
              onClick={() => setOpen(false)}
              className={`
                flex items-center gap-3 ${c.bg} text-white rounded-2xl px-4 h-12 shadow-xl
                transition-all duration-300
                ${open
                  ? `opacity-100 translate-y-0 scale-100 ${c.delay}`
                  : 'opacity-0 translate-y-6 scale-90 pointer-events-none'}
              `}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">{c.icon}</div>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-white/60 font-medium">{c.label}</span>
                <span className="text-sm font-bold whitespace-nowrap tracking-wide">{c.value}</span>
              </div>
            </a>
          ))}
        </div>

        {/* FAB Toggle Button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className={`
            w-14 h-14 rounded-full shadow-2xl flex items-center justify-center
            transition-all duration-300 active:scale-90
            ${open
              ? 'bg-slate-700 rotate-0 scale-100'
              : 'bg-[#06C755] scale-100'}
          `}
          aria-label="ติดต่อเรา"
        >
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <PhoneRingIcon />
          )}
        </button>

      </div>
    </>
  );
}

/* ── Icons ── */
function PhoneRingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="white"/>
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-4 h-4 fill-current ${className}`} xmlns="http://www.w3.org/2000/svg">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );
}

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
    </svg>
  );
}
