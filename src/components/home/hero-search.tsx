'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ChevronDown } from 'lucide-react';
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
        className={`w-full border flex items-center justify-between rounded-lg md:rounded-xl p-3 text-sm font-medium transition-all ${
          disabled 
            ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' 
            : open
              ? 'border-green-500 bg-white ring-2 ring-green-100 text-slate-800'
              : 'border-slate-200 bg-white text-slate-700 hover:border-green-400'
        }`}
      >
        <span className={!value ? 'text-slate-400' : ''}>
          {value ? `${value}${suffix}` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
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
    <div className="w-full bg-white rounded-xl md:rounded-2xl shadow-xl p-5 md:p-6 border border-slate-100 relative z-20">
      <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4">ค้นหายางที่ใช่สำหรับคุณ</h3>

      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-lg md:rounded-xl mb-5 gap-1">
        {(['size', 'brand'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-md md:rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              tab === t
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'size' ? (
              <><span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${tab === 'size' ? 'border-green-600' : 'border-slate-400'}`}>{tab === 'size' && <span className="w-1.5 h-1.5 rounded-full bg-green-600 block"/>}</span>ขนาดยาง</>
            ) : (
              <><span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${tab === 'brand' ? 'border-green-600' : 'border-slate-400'}`}>{tab === 'brand' && <span className="w-1.5 h-1.5 rounded-full bg-green-600 block"/>}</span>ยี่ห้อ/ประเภท</>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Size */}
      {tab === 'size' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">ความกว้างของยาง (Width)</label>
            {loadingSizes ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm h-11"><Loader2 size={14} className="animate-spin"/>กำลังโหลด...</div>
            ) : (
              <CustomSelect 
                value={width} 
                onChange={onWidthChange} 
                options={availWidths} 
                placeholder="-- เลือกความกว้าง --" 
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">ซีรีส์ (Series)</label>
              <CustomSelect 
                value={series} 
                onChange={onSeriesChange} 
                options={availSeries} 
                placeholder="-- เลือกซีรีส์ --" 
                disabled={!width}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">ขอบล้อ (Rim)</label>
              <CustomSelect 
                value={rim} 
                onChange={setRim} 
                options={availRims} 
                placeholder="-- เลือกขอบล้อ --" 
                disabled={!series}
                suffix='"'
              />
            </div>
          </div>

          {width && series && rim && (
            <p className="text-xs text-slate-400 text-center">
              ขนาดที่เลือก: <span className="font-bold text-green-600">{width}/{series}R{rim}</span>
            </p>
          )}

          <Button onClick={handleSizeSearch}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-lg md:rounded-xl text-base font-bold mt-2 shadow-md shadow-green-200 transition-transform hover:scale-[1.01]">
            <Search className="w-5 h-5 mr-2" /> ค้นหายาง
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
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-6 rounded-lg md:rounded-xl text-base font-bold mt-2 shadow-md shadow-green-200 transition-transform hover:scale-[1.01]">
            <Search className="w-5 h-5 mr-2" /> ค้นหายาง
          </Button>

          <p className="text-[11px] text-slate-400 text-center">*ค้นหายางจากยี่ห้อหรือประเภทที่ต้องการ</p>
        </div>
      )}
    </div>
  );
}
