import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export function OnsiteServices() {
  return (
    <section className="bg-[#0f1115] py-16 relative overflow-hidden border-t border-[#1a1f24]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 blur-[120px] pointer-events-none" />

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
          
          <h2 className="text-xl md:text-3xl font-black text-white tracking-wide flex gap-2">
            บริการ <span className="text-green-500">นอกสถานที่</span>
          </h2>

          {/* Tech lines right */}
          <div className="flex items-center gap-1 opacity-80">
            <div className="w-1.5 md:w-2 h-1 bg-green-500 -skew-x-12" />
            <div className="w-1.5 md:w-2 h-1 bg-green-500 -skew-x-12" />
            <div className="w-1.5 md:w-2 h-1 bg-green-500 -skew-x-12" />
            <div className="w-8 md:w-16 h-px bg-gradient-to-r from-green-500 to-transparent" />
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-5xl mx-auto">
          
          {/* Card 1: ปะยางนอกสถานที่ */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#161a1d] border border-[#23292e] hover:border-green-500/50 transition-colors group min-h-[200px] md:min-h-[320px] flex flex-col justify-end shadow-lg">
            <div 
              className="absolute inset-0 bg-cover bg-right opacity-60 group-hover:scale-105 transition-transform duration-700"
              style={{ backgroundImage: "url('/cover/31.png')" }} 
            />
            {/* Gradient overlay: Dark on left, fading to transparent on right */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111318] via-[#111318]/90 to-transparent" />
            
            <div className="relative z-10 p-4 md:p-10 w-full md:w-3/4">
              <h3 className="text-[16px] leading-[1.2] md:text-4xl font-black text-white mb-2 md:leading-tight drop-shadow-md">
                ปะยาง<br className="hidden md:block"/>นอกสถานที่
              </h3>
              
              <ul className="space-y-1.5 md:space-y-3 mb-4 md:mb-8 mt-2 md:mt-6">
                {['รวดเร็ว', 'สะดวก', 'ถึงที่คุณ'].map((text, i) => (
                  <li key={i} className="flex items-center gap-1.5 md:gap-3">
                    <div className="w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                      <CheckCircle2 className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white" />
                    </div>
                    <span className="text-slate-100 font-medium drop-shadow-sm text-[10px] md:text-base">{text}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center bg-green-500 hover:bg-green-400 text-white font-bold px-4 md:px-8 py-1.5 md:py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] hover:-translate-y-0.5 w-max text-[10px] md:text-sm"
              >
                เรียกบริการ
              </Link>
            </div>
          </div>

          {/* Card 2: เปลี่ยนยางนอกสถานที่ */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#161a1d] border border-[#23292e] hover:border-green-500/50 transition-colors group min-h-[200px] md:min-h-[320px] flex flex-col justify-end shadow-lg">
            <div 
              className="absolute inset-0 bg-cover bg-right opacity-60 group-hover:scale-105 transition-transform duration-700"
              style={{ backgroundImage: "url('/serve.png')" }} 
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111318] via-[#111318]/90 to-transparent" />
            
            <div className="relative z-10 p-4 md:p-10 w-full md:w-3/4">
              <h3 className="text-[16px] leading-[1.2] md:text-4xl font-black text-white mb-2 md:leading-tight drop-shadow-md">
                เปลี่ยนยาง<br className="hidden md:block"/>นอกสถานที่
              </h3>
              
              <ul className="space-y-1.5 md:space-y-3 mb-4 md:mb-8 mt-2 md:mt-6">
                {['รวดเร็ว', 'สะดวก', 'ถึงที่คุณ'].map((text, i) => (
                  <li key={i} className="flex items-center gap-1.5 md:gap-3">
                    <div className="w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                      <CheckCircle2 className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white" />
                    </div>
                    <span className="text-slate-100 font-medium drop-shadow-sm text-[10px] md:text-base">{text}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center bg-green-500 hover:bg-green-400 text-white font-bold px-4 md:px-8 py-1.5 md:py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] hover:-translate-y-0.5 w-max text-[10px] md:text-sm"
              >
                เรียกบริการ
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
