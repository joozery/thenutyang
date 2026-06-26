'use client';

import { Star, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useRef, useEffect, useState } from "react";

type GoogleReview = {
  author_name: string;
  profile_photo_url: string;
  rating: number;
  text: string;
  relative_time_description: string;
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
];

export function Testimonials() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [rating, setRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/google-reviews')
      .then(r => r.json())
      .then(d => {
        setReviews(d.reviews ?? []);
        setRating(d.rating ?? 0);
        setTotal(d.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="bg-slate-50 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-green-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">เสียงจากลูกค้าของเรา</h2>
            <div className="w-16 h-1.5 bg-[#00B900] rounded-sm mt-3" />
            {/* Google rating summary */}
            {!loading && total > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <img src="/brand/google-icon.svg" alt="Google" className="w-4 h-4" onError={e => (e.currentTarget.style.display = 'none')} />
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                  ))}
                </div>
                <span className="text-sm font-bold text-slate-700">{rating.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({total.toLocaleString()} รีวิว) · Google Maps</span>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=thenut+tire`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-green-600 transition-colors"
            >
              <MapPin size={13} /> ดูบน Google Maps
            </a>
            <button onClick={() => scroll('left')} className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors shadow-sm">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => scroll('right')} className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors shadow-sm">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
          {loading ? (
            <div className="flex gap-4 md:gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="min-w-[280px] md:min-w-[340px] h-44 bg-white rounded-xl border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">ยังไม่มีรีวิวจาก Google Maps</p>
          ) : (
            <div
              ref={scrollContainerRef}
              className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-8 pt-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {reviews.map((r, idx) => (
                <div key={idx} className="relative bg-white p-6 rounded-xl shadow-md shadow-slate-200/50 border border-slate-100 flex flex-col min-w-[280px] md:min-w-[340px] shrink-0 snap-start hover:-translate-y-1 hover:shadow-lg hover:border-green-200 transition-all duration-300 group">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-100'}`} />
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="text-slate-700 text-sm leading-relaxed mb-5 flex-1 line-clamp-4">
                    "{r.text || '—'}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    {r.profile_photo_url ? (
                      <img src={r.profile_photo_url} alt={r.author_name} className="w-10 h-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-base shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                        {r.author_name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{r.author_name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{r.relative_time_description} · Google</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile scroll buttons */}
        <div className="flex justify-center gap-3 mt-2 md:hidden">
          <button onClick={() => scroll('left')} className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 active:bg-green-50 transition-colors shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scroll('right')} className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 active:bg-green-50 transition-colors shadow-sm">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
