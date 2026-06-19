'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Truck, ShieldCheck, Wrench, Loader2 } from 'lucide-react';

interface TireSizeData {
  widths: string[];
  series: Record<string, string[]>;
  rims: Record<string, string[]>;
}

// ─── Default fallback if DB is empty ────────────────────────────
const DEFAULT_WIDTHS = ['155','165','175','185','195','205','215','225','235','245','255','265','275'];
const DEFAULT_SERIES = ['30','35','40','45','50','55','60','65','70','75'];
const DEFAULT_RIMS   = ['13','14','15','16','17','18','19','20'];

// ─── Car brand/model data ────────────────────────────────────────
const CAR_BRANDS: Record<string, string[]> = {
  'Toyota':   ['Yaris','Yaris Cross','Vios','Corolla Altis','Camry','C-HR','RAV4','Fortuner','Hilux Revo','Innova'],
  'Honda':    ['City','Jazz','Civic','Accord','HR-V','CR-V','BR-V','Pilot'],
  'Isuzu':    ['D-Max','MU-X','D-Max Spark'],
  'Mitsubishi': ['Mirage','Attrage','Xpander','Outlander','Pajero Sport','Triton','Eclipse Cross'],
  'Nissan':   ['Almera','Note','Kicks','X-Trail','Navara','Terra','Sylphy'],
  'Ford':     ['Ranger','Everest','Mustang','Territory'],
  'Mazda':    ['Mazda2','Mazda3','CX-3','CX-5','CX-8','BT-50'],
  'Suzuki':   ['Ciaz','Swift','Vitara','Ertiga','Carry','Celerio'],
  'MG':       ['MG3','MG5','MG ZS','MG HS','MG ZS EV','MG4 EV'],
  'Hyundai':  ['Accent','Elantra','Tucson','Creta','Ioniq 5','Staria'],
  'Kia':      ['Sonet','Seltos','Sportage','Carnival','EV6'],
  'BMW':      ['Series 1','Series 3','Series 5','X1','X3','X5'],
  'Mercedes': ['C-Class','E-Class','GLA','GLC','GLE'],
  'Volvo':    ['XC40','XC60','XC90'],
};

export function HeroSection() {
  const router = useRouter();

  // Tab state
  const [tab, setTab] = useState<'size' | 'car'>('size');

  // Size search state
  const [sizeData, setSizeData] = useState<TireSizeData | null>(null);
  const [loadingSizes, setLoadingSizes] = useState(true);
  const [width, setWidth] = useState('');
  const [series, setSeries] = useState('');
  const [rim, setRim] = useState('');

  // Car search state
  const [carBrand, setCarBrand] = useState('Toyota');
  const [carModel, setCarModel] = useState('');

  // Fetch sizes from DB
  useEffect(() => {
    fetch('/api/tire-sizes')
      .then(r => r.json())
      .then((d: TireSizeData) => {
        setSizeData(d);
        const firstWidth = d.widths[0] ?? DEFAULT_WIDTHS[0];
        const firstSeries = d.series[firstWidth]?.[0] ?? DEFAULT_SERIES[0];
        const firstRim = d.rims[`${firstWidth}_${firstSeries}`]?.[0] ?? DEFAULT_RIMS[0];
        setWidth(firstWidth);
        setSeries(firstSeries);
        setRim(firstRim);
      })
      .catch(() => {
        setWidth(DEFAULT_WIDTHS[4]);
        setSeries(DEFAULT_SERIES[5]);
        setRim(DEFAULT_RIMS[2]);
      })
      .finally(() => setLoadingSizes(false));
  }, []);

  // Update series when width changes
  const onWidthChange = (w: string) => {
    setWidth(w);
    const availSeries = sizeData?.series[w] ?? DEFAULT_SERIES;
    const s = availSeries[0] ?? '';
    setSeries(s);
    const availRims = sizeData?.rims[`${w}_${s}`] ?? DEFAULT_RIMS;
    setRim(availRims[0] ?? '');
  };

  // Update rim when series changes
  const onSeriesChange = (s: string) => {
    setSeries(s);
    const availRims = sizeData?.rims[`${width}_${s}`] ?? DEFAULT_RIMS;
    setRim(availRims[0] ?? '');
  };

  const handleSizeSearch = () => {
    if (!width || !series || !rim) return;
    router.push(`/tires?width=${width}&series=${series}&rim=${rim}`);
  };

  const handleCarSearch = () => {
    if (!carBrand || !carModel) return;
    router.push(`/tires?carbrand=${encodeURIComponent(carBrand)}&carmodel=${encodeURIComponent(carModel)}`);
  };

  const availWidths  = sizeData?.widths  ?? DEFAULT_WIDTHS;
  const availSeries  = (sizeData?.series[width]  ?? DEFAULT_SERIES);
  const availRims    = (sizeData?.rims[`${width}_${series}`] ?? DEFAULT_RIMS);
  const carModels    = CAR_BRANDS[carBrand] ?? [];

  return (
    <section className="relative w-full bg-slate-50 overflow-hidden min-h-[500px] flex items-center pt-8 pb-16 bg-[url('/cover/covergreen.png')] bg-cover bg-center bg-no-repeat">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
              ครบ จบ เรื่อง<span className="text-green-600">ยาง</span>
              <br />
              และ<span className="text-green-600">บริการ</span>รถยนต์
            </h1>
            <p className="text-slate-600 text-lg md:text-xl font-medium">
              จำหน่ายยางรถยนต์คุณภาพจากแบรนด์ชั้นนำ
              <br />
              พร้อมบริการติดตั้ง ตั้งศูนย์ ถ่วงล้อ โดยช่างมืออาชีพ
            </p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {[
                { icon: <Truck className="w-5 h-5" />, label: 'จัดส่งฟรี', sub: 'ทั่วประเทศ' },
                { icon: <ShieldCheck className="w-5 h-5" />, label: 'รับประกันคุณภาพ', sub: 'ยาง บวม แตก' },
                { icon: <Wrench className="w-5 h-5" />, label: 'บริการติดตั้ง', sub: 'โดยช่างมืออาชีพ' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">{f.icon}</div>
                  <span className="text-sm font-semibold text-slate-800">{f.label}<br/>{f.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Search Card */}
          <div className="relative flex justify-center md:justify-end items-center">
            <div className="w-full md:w-[420px] bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-4">ค้นหายางที่ใช่สำหรับคุณ</h3>

              {/* Tab Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-5 gap-1">
                {(['size', 'car'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      tab === t
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t === 'size' ? (
                      <><span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${tab === 'size' ? 'border-green-600' : 'border-slate-400'}`}>{tab === 'size' && <span className="w-1.5 h-1.5 rounded-full bg-green-600 block"/>}</span>ขนาดยาง</>
                    ) : (
                      <><span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${tab === 'car' ? 'border-green-600' : 'border-slate-400'}`}>{tab === 'car' && <span className="w-1.5 h-1.5 rounded-full bg-green-600 block"/>}</span>รุ่นรถ</>
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
                      <select value={width} onChange={e => onWidthChange(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm font-medium">
                        {availWidths.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">ซีรีส์ (Series)</label>
                      <select value={series} onChange={e => onSeriesChange(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm font-medium">
                        {availSeries.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">ขอบล้อ (Rim)</label>
                      <select value={rim} onChange={e => setRim(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm font-medium">
                        {availRims.map(r => <option key={r} value={r}>{r}"</option>)}
                      </select>
                    </div>
                  </div>

                  {width && series && rim && (
                    <p className="text-xs text-slate-400 text-center">
                      ขนาดที่เลือก: <span className="font-bold text-green-600">{width}/{series}R{rim}</span>
                    </p>
                  )}

                  <Button onClick={handleSizeSearch}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl text-base font-bold mt-2 shadow-md shadow-green-200 transition-transform hover:scale-[1.01]">
                    <Search className="w-5 h-5 mr-2" /> ค้นหายาง
                  </Button>
                </div>
              )}

              {/* Tab: Car model */}
              {tab === 'car' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">ยี่ห้อรถ</label>
                    <select value={carBrand} onChange={e => { setCarBrand(e.target.value); setCarModel(''); }}
                      className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm font-medium">
                      {Object.keys(CAR_BRANDS).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">รุ่นรถ</label>
                    <select value={carModel} onChange={e => setCarModel(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm font-medium">
                      <option value="">-- เลือกรุ่นรถ --</option>
                      {carModels.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <Button onClick={handleCarSearch} disabled={!carModel}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-6 rounded-xl text-base font-bold mt-2 shadow-md shadow-green-200 transition-transform hover:scale-[1.01]">
                    <Search className="w-5 h-5 mr-2" /> ค้นหายางสำหรับรถ
                  </Button>

                  <p className="text-[11px] text-slate-400 text-center">*ระบบจะแนะนำยางที่เหมาะสมกับรุ่นรถของคุณ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
