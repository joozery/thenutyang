import Link from 'next/link';

const SERVICES = [
  {
    title: "ยาง",
    subtitle: "มียางให้เลือกหลากหลายแบรนด์",
    icon: "/services/tire.svg", // We will use inline SVG or lucide icons if we don't have SVGs, but inline is better for custom
    id: "tire"
  },
  {
    title: "ตั้งศูนย์",
    subtitle: "ตั้งศูนย์มาตรฐาน รถวิ่งตรง ไม่กินยาง",
    icon: "alignment",
    id: "alignment"
  },
  {
    title: "ถ่วงล้อ",
    subtitle: "ถ่วงล้อมาตรฐาน ด้วยเครื่องทันสมัย",
    icon: "balancing",
    id: "balancing"
  },
  {
    title: "ลมไนโตรเจน",
    subtitle: "รักษาแรงดันลมยาง นุ่มนวล ปลอดภัย",
    icon: "n2",
    id: "nitrogen"
  },
  {
    title: "ถอดใส่ยาง",
    subtitle: "ถอดใส่ยางด้วยเครื่องมาตรฐาน ไม่ทำลายขอบล้อ",
    icon: "mounting",
    id: "mounting"
  },
  {
    title: "ปะยาง",
    subtitle: "ปะยางด้วยวัสดุคุณภาพ มาตรฐานโรงงาน",
    icon: "repair",
    id: "repair"
  },
  {
    title: "เปลี่ยนโช้ค",
    subtitle: "ใช้โช้คคุณภาพสูง นุ่มนวลทุกการขับขี่",
    icon: "shock",
    id: "shock"
  },
  {
    title: "รับเทิร์นยาง",
    subtitle: "รับเทิร์นยางเก่า แลกเป็นส่วนลดพิเศษ",
    icon: "trade-in",
    id: "trade-in"
  }
];

export function OurServices() {
  return (
    <section className="bg-[#0f1115] py-16 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-green-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-green-500/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex items-center justify-center gap-3 md:gap-4 mb-10 md:mb-12">
          {/* Tech lines left */}
          <div className="flex items-center gap-1 opacity-80">
            <div className="w-8 md:w-16 h-px bg-gradient-to-l from-green-500 to-transparent" />
            <div className="w-1.5 md:w-2 h-1 bg-green-500 -skew-x-12" />
            <div className="w-1.5 md:w-2 h-1 bg-green-500 -skew-x-12" />
            <div className="w-1.5 md:w-2 h-1 bg-green-500 -skew-x-12" />
          </div>
          
          <h2 className="text-xl md:text-3xl font-black text-white tracking-wide">
            บริการของเรา
          </h2>

          {/* Tech lines right */}
          <div className="flex items-center gap-1 opacity-80">
            <div className="w-1.5 md:w-2 h-1 bg-green-500 -skew-x-12" />
            <div className="w-1.5 md:w-2 h-1 bg-green-500 -skew-x-12" />
            <div className="w-1.5 md:w-2 h-1 bg-green-500 -skew-x-12" />
            <div className="w-8 md:w-16 h-px bg-gradient-to-r from-green-500 to-transparent" />
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
          {SERVICES.map((service, idx) => (
            <div 
              key={idx}
              className="w-full"
            >
              <div className="bg-[#161a1d]/80 backdrop-blur-sm border border-[#23292e] hover:border-green-500/50 rounded-2xl p-4 md:p-5 h-full flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] group">
                
                {/* Icon Placeholder - Replace with actual SVGs or images later */}
                <div className="w-12 h-12 md:w-14 md:h-14 mb-3 md:mb-4 text-slate-300 group-hover:text-green-400 transition-colors flex items-center justify-center">
                   {/* Temporary icon logic based on id */}
                   {service.id === 'tire' && (
                     <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                       <circle cx="12" cy="12" r="10" />
                       <circle cx="12" cy="12" r="4" />
                       <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                     </svg>
                   )}
                   {service.id === 'alignment' && (
                     <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                       <path d="M4 6h16M4 18h16M6 4v16M18 4v16M12 8v8M8 12h8" />
                     </svg>
                   )}
                   {service.id === 'balancing' && (
                     <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                       <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
                       <circle cx="12" cy="12" r="2" />
                       <path d="M12 14v4M12 6v4M6 12h4M14 12h4" />
                     </svg>
                   )}
                   {service.id === 'nitrogen' && (
                     <div className="w-12 h-12 rounded-full border-2 border-green-500 flex items-center justify-center text-green-500 font-bold text-lg font-mono">
                       N₂
                     </div>
                   )}
                   {service.id === 'mounting' && (
                     <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                       <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                       <path d="M12 6v12M6 12h12" />
                       <path d="M15 9l-6 6M9 9l6 6" />
                     </svg>
                   )}
                   {service.id === 'repair' && (
                     <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                       <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                       <path d="M8 12h8M12 8v8" strokeDasharray="2 2" />
                     </svg>
                   )}
                   {service.id === 'shock' && (
                     <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                       <path d="M8 2h8M8 22h8M12 2v20" />
                       <path d="M9 5h6M9 9h6M9 13h6M9 17h6" />
                     </svg>
                   )}
                   {service.id === 'trade-in' && (
                     <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                       <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                       <path d="M3 3v5h5" />
                     </svg>
                   )}
                </div>

                <h3 className="text-white font-bold text-sm mb-2">{service.title}</h3>
                <p className="text-slate-400 text-[10px] leading-relaxed mb-4 flex-1">
                  {service.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
