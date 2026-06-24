import { Check, ShieldCheck, RefreshCw, AlertCircle, Settings, Wind, CheckCircle2, Wrench } from 'lucide-react';

const ICON_MAP: any = {
  ShieldCheck: <ShieldCheck className="w-8 h-8" />,
  RefreshCw: <RefreshCw className="w-8 h-8" />,
  Wrench: <Wrench className="w-8 h-8" />,
  Settings: <Settings className="w-8 h-8" />,
  Wind: <Wind className="w-8 h-8" />,
  CheckCircle2: <CheckCircle2 className="w-8 h-8" />,
  AlertCircle: <AlertCircle className="w-8 h-8" />,
};

const COLOR_MAP: any = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600' },
  green: { bg: 'bg-green-50', text: 'text-green-600' },
};

const DEFAULT_SERVICES = [
  {
    title: "รับประกันยาง",
    subtitle: "2 ปีเต็ม",
    description: ["รับประกันเคลมฟรีทุกกรณี ตามเงื่อนไขของยี่ห้อนั้นๆกำหนด", "รับประกัน 2 ปี กรณีเกิดจากการผลิต กรณีบวมบนยาง (แก้มไม่เกี่ยว)"],
    icon: "ShieldCheck",
    color: "blue",
    isBestSeller: true,
  },
  {
    title: "สลับยางฟรี",
    subtitle: "ทุก 10,000 กม.",
    description: ["สลับยางฟรีทุกๆ 10,000 กิโลเมตร หรือทุกๆ 6 เดือน", "ไม่จำกัดจำนวนครั้ง ตลอดอายุการใช้งาน"],
    icon: "RefreshCw",
    color: "orange",
    isBestSeller: false,
  },
  {
    title: "ปะยางฟรี",
    subtitle: "ตลอดอายุการใช้งาน",
    description: ["ปะยางแบบแทงไหม/แทงหนอนรถยนต์ ไม่จำกัดจำนวนครั้ง (แจ้งช่างว่าปะฟรี)", "หากไม่แจ้ง จะเป็นการถอดปะสตรีมร้อน มีค่าบริการ 200-400 บาท"],
    icon: "Wrench",
    color: "purple",
    isBestSeller: false,
  },
  {
    title: "จุ๊บลม ถ่วงล้อ ตั้งศูนย์",
    subtitle: "รับประกัน 3 เดือน",
    description: ["จุ๊บลมยาง: หากมีปัญหาเปลี่ยนตัวใหม่ทันที", "ถ่วงล้อ: หากพวงมาลัยสั่น ถ่วงล้อใหม่ฟรี", "ตั้งศูนย์: หากดึงหรือพวงมาลัยไม่ตรง ตั้งศูนย์ใหม่ฟรี"],
    icon: "Settings",
    color: "red",
    isBestSeller: false,
  },
  {
    title: "ลมไนโตรเจนฟรี",
    subtitle: "ตลอดอายุการใช้งาน",
    description: ["เติมลมไนโตรเจนให้ฟรี ตลอดอายุการใช้งาน ไม่จำกัดจำนวนครั้ง", "ช่วยรักษาแรงดันลมยางให้คงที่ และยืดอายุการใช้งานของยาง"],
    icon: "Wind",
    color: "green",
    isBestSeller: false,
  }
];

export function AfterSales({ services = [] }: { services?: any[] }) {
  const displayServices = services && services.length > 0 ? services : DEFAULT_SERVICES;

  return (
    <section className="bg-slate-50 py-16 md:py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-green-100/40 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-green-600 font-bold tracking-[0.2em] text-sm mb-3">AFTER SALES SERVICE</p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">บริการหลังการขาย ที่คุณอุ่นใจได้</h2>
          <p className="text-slate-500 font-medium md:text-lg mb-6">เราดูแลคุณมากกว่าการขาย พร้อมอยู่เคียงข้างตลอดอายุการใช้งาน</p>
          <div className="w-16 h-1 bg-green-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1400px] mx-auto">
          {/* Left Panel */}
          <div className="lg:col-span-4 bg-slate-900 rounded-3xl p-8 md:p-10 text-white flex flex-col relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-[url('/serve.png')] bg-cover bg-center opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/20"></div>
            
            <div className="relative z-10 flex-1">
              <h3 className="text-3xl font-black mb-3 leading-tight">ดูแลครบ จบในที่เดียว</h3>
              <p className="text-slate-400 font-medium mb-10 leading-relaxed text-sm">ทุกบริการออกแบบมาเพื่อให้คุณ<br/>ขับขี่อย่างมั่นใจในทุกเส้นทาง</p>
              
              <div className="w-12 h-0.5 bg-green-500 mb-10"></div>

              <ul className="space-y-5">
                <li className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full border border-green-500 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="font-medium text-slate-200">มาตรฐานศูนย์บริการมืออาชีพ</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full border border-green-500 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="font-medium text-slate-200">ช่างผู้เชี่ยวชาญ ดูแลด้วยใจ</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full border border-green-500 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="font-medium text-slate-200">สะดวก รวดเร็ว ใกล้คุณ</span>
                </li>
              </ul>
            </div>

            {/* Decorative tire at bottom */}
            <div className="relative z-10 mt-12 -mx-10 -mb-10">
              <img src="/hero-tire-transparent.png" alt="Tire" className="w-full object-cover translate-y-8 scale-110 opacity-80 mix-blend-screen drop-shadow-2xl" />
            </div>
          </div>

          {/* Right Panel (Dynamic Cards) */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-6 gap-4">
            {displayServices.map((service, idx) => {
              const isWide = idx >= 3;
              const IconComp = ICON_MAP[service.icon] || <ShieldCheck className="w-8 h-8" />;
              const colors = COLOR_MAP[service.color] || COLOR_MAP.green;
              
              return (
                <div key={idx} className={`bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden ${isWide ? 'md:col-span-3 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6' : 'md:col-span-2 flex flex-col items-center text-center'}`}>
                  {service.isBestSeller && (
                    <div className="absolute top-4 right-4 bg-green-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider z-10">BEST SELLER</div>
                  )}
                  
                  <div className={[
                    'w-16 h-16 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform',
                    isWide ? '' : 'mb-4',
                    colors.bg,
                    colors.text
                  ].filter(Boolean).join(' ')}>
                    <div className={colors.text}>
                      {IconComp}
                    </div>
                  </div>
                  
                  <div className={isWide ? 'flex-1' : 'w-full'}>
                    <h4 className="text-lg font-black text-slate-900 mb-1">{service.title}</h4>
                    <p className={`${colors.text} font-bold text-sm mb-3`}>{service.subtitle}</p>
                    
                    {!isWide && <div className="w-full h-px bg-slate-100 mb-4"></div>}
                    
                    <div className="flex flex-col gap-2">
                      {service.description.map((desc: string, i: number) => {
                        // Very simple bold parser for legacy compatibility
                        const parts = desc.split(':');
                        if (parts.length > 1 && isWide) {
                          return (
                            <p key={i} className="text-[12px] text-slate-500 font-medium leading-relaxed">
                              <strong className="text-slate-800">{parts[0]}:</strong>{parts.slice(1).join(':')}
                            </p>
                          );
                        }
                        return (
                          <p key={i} className="text-[12px] text-slate-500 font-medium leading-relaxed">{desc}</p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
