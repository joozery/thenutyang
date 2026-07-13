'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { BRANDS, CATEGORIES } from '@/lib/tires';

interface TireSizeData {
  widths: string[];
  series: Record<string, string[]>;
  rims: Record<string, string[]>;
  brands?: string[];
}

const DEFAULT_WIDTHS = ['155','165','175','185','195','205','215','225','235','245','255','265','275'];
const DEFAULT_SERIES = ['30','35','40','45','50','55','60','65','70','75'];
const DEFAULT_RIMS   = ['13','14','15','16','17','18','19','20'];

// Custom Select Component for better UI
function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled = false,
  suffix = ''
}: { 
  value: string; 
  onChange: (v: string) => void; 
  options: string[]; 
  placeholder: string; 
  disabled?: boolean;
  suffix?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full h-11 md:h-12 border flex items-center justify-between rounded-lg md:rounded-xl px-2.5 md:px-3 text-[12px] md:text-sm font-medium transition-all ${
          disabled 
            ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' 
            : open
              ? 'border-green-500 bg-white ring-2 ring-green-100 text-slate-800'
              : 'border-slate-200 bg-white text-slate-700 hover:border-green-400'
        }`}
      >
        <span className={`truncate text-left mr-1 ${!value ? 'text-slate-400' : ''}`}>
          {value ? `${value}${suffix}` : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-100 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1">
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-50 transition-colors"
            onClick={() => { onChange(''); setOpen(false); }}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === opt 
                  ? 'bg-green-50 text-green-700 font-semibold' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}{suffix}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<'size' | 'brand'>('size');

  const [sizeData, setSizeData] = useState<TireSizeData | null>(null);
  const [loadingSizes, setLoadingSizes] = useState(true);
  const [width, setWidth] = useState('');
  const [series, setSeries] = useState('');
  const [rim, setRim] = useState('');

  const [searchBrand, setSearchBrand] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [q, setQ] = useState('');

  const handleTextSearch = () => {
    if (!q.trim()) return;
    router.push(`/tires?q=${encodeURIComponent(q.trim())}`);
  };

  useEffect(() => {
    fetch('/api/tire-sizes')
      .then(r => r.json())
      .then((d: TireSizeData) => {
        setSizeData(d);
        setWidth('');
        setSeries('');
        setRim('');
      })
      .catch(() => {
        setWidth('');
        setSeries('');
        setRim('');
      })
      .finally(() => setLoadingSizes(false));
  }, []);

  const onWidthChange = (w: string) => {
    setWidth(w);
    setSeries('');
    setRim('');
  };

  const onSeriesChange = (s: string) => {
    setSeries(s);
    setRim('');
  };

  const handleSizeSearch = () => {
    if (!width || !series || !rim) return;
    router.push(`/tires?width=${width}&series=${series}&rim=${rim}`);
  };

  const handleBrandCategorySearch = () => {
    if (!searchBrand && !searchCategory) return;
    const params = new URLSearchParams();
    if (searchBrand) params.set('brand', searchBrand);
    if (searchCategory) params.set('category', searchCategory);
    router.push(`/tires?${params.toString()}`);
  };

  const availWidths  = sizeData?.widths  ?? DEFAULT_WIDTHS;
  const availSeries  = width ? (sizeData?.series[width] ?? DEFAULT_SERIES) : [];
  const availRims    = (width && series) ? (sizeData?.rims[`${width}_${series}`] ?? DEFAULT_RIMS) : [];

  const categoryOptions = Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v }));

  return (
    <div className="w-full bg-white rounded-xl md:rounded-2xl shadow-2xl relative z-20 flex flex-col">
      <div className="p-5 md:p-6">
        {/* Title (Desktop Only) */}
        <h3 className="hidden md:block text-xl font-bold text-slate-800 mb-4">ค้นหายางสำหรับคุณ</h3>

        {/* Free-text search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleTextSearch(); }}
            placeholder="พิมพ์ค้นหา เช่น 265/60R18 หรือ Michelin"
            className="w-full h-11 md:h-12 pl-10 pr-[4.75rem] rounded-lg md:rounded-xl border border-slate-200 text-[13px] md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
          />
          <button
            type="button"
            onClick={handleTextSearch}
            disabled={!q.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 md:h-9 px-3.5 bg-[#0a5c15] hover:bg-green-800 text-white rounded-md md:rounded-lg text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ค้นหา
          </button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[11px] text-slate-400 shrink-0">หรือเลือกจากตัวเลือกด้านล่าง</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Tab Switcher - Desktop */}
        <div className="hidden md:flex bg-slate-100 p-1 rounded-xl mb-5 gap-1">
          {(['size', 'brand'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                tab === t
                  ? 'bg-green-700 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'size' ? (
                <><span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${tab === 'size' ? 'border-white' : 'border-slate-400'}`}>{tab === 'size' && <span className="w-1.5 h-1.5 rounded-full bg-white block"/>}</span>ตามขนาด</>
              ) : (
                <><span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${tab === 'brand' ? 'border-white' : 'border-slate-400'}`}>{tab === 'brand' && <span className="w-1.5 h-1.5 rounded-full bg-white block"/>}</span>ตามรถยนต์</>
              )}
            </button>
          ))}
        </div>

        {/* Tab Switcher - Mobile */}
        <div className="flex md:hidden border-b-2 border-slate-100 mb-6 relative">
        {(['size', 'brand'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 pb-3 text-[15px] md:text-base font-bold transition-all relative ${
              tab === t ? 'text-[#0a5c15]' : 'text-slate-400'
            }`}
          >
            {t === 'size' ? 'ตามขนาด' : 'ตามรถยนต์'}
            {tab === t && (
              <div className="absolute -bottom-[2px] left-0 w-full h-[3px] bg-[#0a5c15]">
                <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-[#0a5c15] rotate-45" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Size */}
      {tab === 'size' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <div>
              <label className="block text-[11px] md:text-xs font-bold text-slate-800 mb-1.5">
                <span className="md:hidden">ความกว้าง *</span>
                <span className="hidden md:inline">ความกว้าง (Width)</span>
              </label>
              {loadingSizes ? (
                <div className="flex items-center gap-1 text-slate-400 text-xs h-10"><Loader2 size={12} className="animate-spin"/>โหลด...</div>
              ) : (
                <CustomSelect 
                  value={width} 
                  onChange={onWidthChange} 
                  options={availWidths} 
                  placeholder="ความกว้าง" 
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] md:text-xs font-bold text-slate-800 mb-1.5">
                <span className="md:hidden">ซีรีส์ยาง *</span>
                <span className="hidden md:inline">ซีรีส์ (Series)</span>
              </label>
              <CustomSelect 
                value={series} 
                onChange={onSeriesChange} 
                options={availSeries} 
                placeholder="ซีรีส์" 
                disabled={!width}
              />
            </div>
            
            <div>
              <label className="block text-[11px] md:text-xs font-bold text-slate-800 mb-1.5">
                <span className="md:hidden">ขอบล้อ *</span>
                <span className="hidden md:inline">ขอบล้อ (Rim)</span>
              </label>
              <CustomSelect 
                value={rim} 
                onChange={setRim} 
                options={availRims} 
                placeholder="ขอบล้อ" 
                disabled={!series}
              />
            </div>
          </div>

          {width && series && rim && (
            <p className="text-xs text-slate-400 text-center">
              ขนาดที่เลือก: <span className="font-bold text-[#0a5c15]">{width}/{series}R{rim}</span>
            </p>
          )}

          <Button onClick={handleSizeSearch}
            className="w-full bg-[#0a5c15] hover:bg-green-800 text-white py-6 md:py-7 rounded-xl text-lg font-bold mt-2 shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center">
            <span className="md:hidden flex items-center">ค้นหา <ChevronRight className="w-5 h-5 ml-1" /></span>
            <span className="hidden md:flex items-center"><Search className="w-5 h-5 mr-2" /> ค้นหายาง</span>
          </Button>
        </div>
      )}

      {/* Tab: Brand/Category */}
      {tab === 'brand' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">ยี่ห้อยาง</label>
            <CustomSelect 
              value={searchBrand} 
              onChange={setSearchBrand} 
              options={sizeData?.brands ?? BRANDS} 
              placeholder="-- ไม่ระบุยี่ห้อ --" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">ประเภทยาง</label>
            <CustomSelect 
              value={searchCategory} 
              onChange={setSearchCategory} 
              options={Object.keys(CATEGORIES)} 
              placeholder="-- ไม่ระบุประเภท --" 
            />
          </div>

          <Button onClick={handleBrandCategorySearch} disabled={!searchBrand && !searchCategory}
            className="w-full bg-[#0a5c15] hover:bg-green-800 disabled:opacity-50 text-white py-6 md:py-7 rounded-xl text-lg font-bold mt-2 shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center">
            <span className="md:hidden flex items-center">ค้นหา <ChevronRight className="w-5 h-5 ml-1" /></span>
            <span className="hidden md:flex items-center"><Search className="w-5 h-5 mr-2" /> ค้นหายาง</span>
          </Button>

          <p className="text-[11px] text-slate-400 text-center mt-4">*ค้นหายางจากยี่ห้อหรือประเภทที่ต้องการ</p>
        </div>
      )}
      </div>
      {/* Mobile Guide Image Fused into the Card */}
      <div className="md:hidden mt-2 overflow-hidden rounded-b-xl">
        <img src="/search.jpeg" alt="วิธีอ่านรหัสยาง" className="w-full h-auto object-cover" />
      </div>
    </div>
  );
}
