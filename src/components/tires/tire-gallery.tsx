'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export function TireGallery({
  images,
  alt,
  badge,
  discount,
}: {
  images: string[];
  alt: string;
  badge?: string;
  discount?: number;
}) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = useCallback(() => setCurrent(c => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent(c => (c + 1) % images.length), [images.length]);

  // คีย์ลัดตอน popup เปิด: Esc ปิด, ลูกศรเลื่อนรูป
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, prev, next]);

  const src = images[current] ?? '/yang.png';

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="bg-white rounded-2xl border border-slate-100 p-8 flex items-center justify-center min-h-[360px] relative">
        {badge && (
          <span className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10">{badge}</span>
        )}
        {!!discount && discount > 0 && (
          <span className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">ลด {discount}%</span>
        )}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="group relative cursor-zoom-in focus:outline-none"
          title="คลิกเพื่อดูรูปขนาดใหญ่"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-72 w-auto object-contain transition-transform group-hover:scale-[1.03]" />
          <span className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-slate-900/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={15} />
          </span>
        </button>

        {images.length > 1 && (
          <>
            <button type="button" onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center transition-colors">
              <ChevronLeft size={17} />
            </button>
            <button type="button" onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center transition-colors">
              <ChevronRight size={17} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              type="button"
              onClick={() => setCurrent(idx)}
              className={`shrink-0 w-16 h-16 rounded-xl border-2 bg-white p-1.5 flex items-center justify-center transition-all ${
                idx === current ? 'border-green-500 shadow-sm' : 'border-slate-100 hover:border-slate-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${alt} รูปที่ ${idx + 1}`} className="max-h-full max-w-full object-contain" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox popup */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm" onClick={() => setLightbox(false)} />

          <button type="button" onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
            <X size={22} />
          </button>

          {images.length > 1 && (
            <>
              <button type="button" onClick={prev}
                className="absolute left-3 md:left-6 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                <ChevronLeft size={24} />
              </button>
              <button type="button" onClick={next}
                className="absolute right-3 md:right-6 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className="relative z-[5] max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-3 pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="max-w-full max-h-[78vh] object-contain rounded-lg" />
            <span className="text-white/70 text-sm font-medium">
              {alt}{images.length > 1 && ` · ${current + 1}/${images.length}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
