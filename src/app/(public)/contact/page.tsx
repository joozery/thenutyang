import { MapPin, Phone, Mail, Clock, ShieldCheck, Truck, Percent, Wrench, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import connectDB from '@/lib/mongodb';
import ContactSettings from '@/models/ContactSettings';

export const dynamic = 'force-dynamic';

const LineIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>LINE</title>
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

export const metadata = {
  title: 'ติดต่อเรา | THE NUT TIRE เดอะนัทยางยนต์',
  description: 'ติดต่อ THE NUT TIRE เดอะนัทยางยนต์ สอบถามราคายาง นัดหมายเปลี่ยนยาง หรือปรึกษาปัญหาเรื่องรถยนต์',
};

async function getSettings() {
  try {
    await connectDB();
    let settings = await ContactSettings.findOne({}).lean();
    if (!settings) {
      const doc = await ContactSettings.create({});
      settings = doc.toJSON();
    }
    return settings as any;
  } catch (error) {
    console.error('Error fetching contact settings:', error);
    return null;
  }
}

export default async function ContactPage() {
  const settings = await getSettings();
  
  const addressLines = settings?.address ? settings.address.split('\\n').map((line: string) => line.trim()) : [
    'เดอะนัทยางยนต์ (THE NUT TIRE)',
    'ถนน... ตำบล... อำเภอ...',
    'จังหวัด... 12345'
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-100/50 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-36 lg:pt-28 lg:pb-48 overflow-hidden bg-[#0A0D14]">
        {/* Abstract Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-green-500/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px]" />
        </div>
        
        {/* Tire Background Image (Right side) */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-[50%] lg:w-[60%] opacity-30 md:opacity-100 pointer-events-none">
          {/* If yang.png exists, it will show nicely on the right. Fallback is handled by the color. */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D14] via-[#0A0D14]/80 to-transparent z-10 hidden md:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] to-transparent z-10 md:hidden" />
          <img src={settings?.heroImage || '/yang.png'} alt="Tires background" className="w-full h-full object-cover object-right" />
        </div>

        <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight">
              {settings?.heroTitle || 'ติดต่อเรา'}
            </h1>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#00E050] mb-6 tracking-tight drop-shadow-[0_0_15px_rgba(0,224,80,0.3)]">
              {settings?.heroSubtitle || 'THE NUT TIRE'}
            </h2>
            <p className="text-base md:text-lg text-slate-300 max-w-xl font-medium leading-relaxed whitespace-pre-line">
              {settings?.heroDesc || 'สอบถามข้อมูลเพิ่มเติม จองคิวเปลี่ยนยาง\nหรือปรึกษาปัญหาเรื่องรถยนต์ เราพร้อมดูแลคุณ'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content - Overlapping Card */}
      <section className="relative z-30 -mt-24 md:-mt-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="bg-white rounded-xl shadow-2xl shadow-slate-200/50 p-6 md:p-8 lg:p-10 border border-slate-100">
            
            {/* Top Row: Contact Info & Map */}
            <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-12 mb-8">
              
              {/* Left: Contact Info */}
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-6">ช่องทางการติดต่อ</h3>
                
                <div className="space-y-6">
                  {/* Location */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <MapPin size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-[15px] mb-0.5">ที่ตั้งร้าน</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        {addressLines.map((line: string, i: number) => (
                          <span key={i}>
                            {line}
                            {i < addressLines.length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Phone size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-[15px] mb-0.5">เบอร์โทรศัพท์</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        {settings?.phoneMain || '099-999-9999'} {settings?.phoneMainLabel && `(${settings.phoneMainLabel})`}<br />
                        {settings?.phoneSale || '088-888-8888'} {settings?.phoneSaleLabel && `(${settings.phoneSaleLabel})`}
                      </p>
                    </div>
                  </div>

                  {/* LINE */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00B900]/10 text-[#00B900] flex items-center justify-center shrink-0">
                      <LineIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-[15px] mb-0.5">LINE Official</h4>
                      <p className="text-[#00B900] text-sm font-semibold">
                        {settings?.lineId || '@thenuttire'} <span className="text-slate-400 font-normal">{settings?.lineLabel && `(${settings.lineLabel})`}</span>
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Mail size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-[15px] mb-0.5">อีเมล</h4>
                      <p className="text-slate-500 text-sm">
                        {settings?.email || 'contact@thenuttire.com'}
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <Clock size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-[15px] mb-0.5">เวลาเปิดทำการ</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        {settings?.workingDays || 'จันทร์ - อาทิตย์'}<br />
                        {settings?.workingHours || '08:00 - 18:00 น.'}
                        {settings?.workingDays2 && (
                          <>
                            <br />
                            <span className="mt-1 inline-block">{settings.workingDays2}</span><br />
                            {settings?.workingHours2}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Map */}
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 min-h-[360px] shadow-inner group">
                <div className="absolute top-4 left-4 z-20">
                  <a href={settings?.googleMapUrl || "https://www.google.com/maps"} target="_blank" rel="noopener noreferrer" className="bg-white/90 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-white hover:text-green-600 transition-colors">
                    เปิดใน Google Maps <ExternalLink size={14} />
                  </a>
                </div>
                
                <iframe 
                  src={settings?.googleMapUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15502.830635414603!2d100.510000!3d13.730000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQzJzQ4LjAiTiAxMDDCsDMwJzM2LjAiRQ!5e0!3m2!1sth!2sth!4v1620000000000!5m2!1sth!2sth"} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  className="absolute inset-0 grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                />

                <div className="absolute bottom-4 right-4 z-20">
                  <a href={settings?.googleMapUrl || "https://www.google.com/maps"} target="_blank" rel="noopener noreferrer" className="bg-[#1A1C23] text-white px-5 py-2.5 rounded-md font-bold text-sm shadow-xl hover:bg-green-600 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                    <MapPin size={16} /> นำทางไปร้าน
                  </a>
                </div>
              </div>
            </div>

            {/* Features Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-8">
              <div className="bg-slate-50 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-3 border border-slate-100 hover:border-green-100 hover:bg-green-50/50 transition-colors">
                <div className="text-green-500 shrink-0"><Truck size={28} strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7" /></div>
                <div>
                  <div className="text-[13px] md:text-sm font-bold text-slate-800 leading-tight">จัดส่งฟรี</div>
                  <div className="text-[10px] md:text-[11px] text-slate-500 mt-0.5">ทั่วประเทศ</div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-3 border border-slate-100 hover:border-green-100 hover:bg-green-50/50 transition-colors">
                <div className="text-green-500 shrink-0"><ShieldCheck size={28} strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7" /></div>
                <div>
                  <div className="text-[13px] md:text-sm font-bold text-slate-800 leading-tight">รับประกันยางแท้</div>
                  <div className="text-[10px] md:text-[11px] text-slate-500 mt-0.5">ทุกเส้น 100%</div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-3 border border-slate-100 hover:border-green-100 hover:bg-green-50/50 transition-colors">
                <div className="text-green-500 shrink-0"><Percent size={28} strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7" /></div>
                <div>
                  <div className="text-[13px] md:text-sm font-bold text-slate-800 leading-tight">ผ่อน 0%</div>
                  <div className="text-[10px] md:text-[11px] text-slate-500 mt-0.5">สูงสุด 4 เดือน</div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-3 border border-slate-100 hover:border-green-100 hover:bg-green-50/50 transition-colors">
                <div className="text-green-500 shrink-0"><Wrench size={28} strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7" /></div>
                <div>
                  <div className="text-[13px] md:text-sm font-bold text-slate-800 leading-tight">บริการหลังการขาย</div>
                  <div className="text-[10px] md:text-[11px] text-slate-500 mt-0.5">ดูแลตลอดอายุการใช้งาน</div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-6 relative overflow-hidden bg-[#0A0D14] rounded-lg p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Decorative background image inside the dark bar */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                 <img src={settings?.heroImage || '/yang.png'} alt="" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-[#0A0D14]/80" />
              </div>
              
              <div className="relative z-10 flex items-center gap-4 text-white w-full md:w-auto justify-center md:justify-start">
                <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center shrink-0">
                   <Phone size={24} fill="currentColor" />
                </div>
                <div>
                  <h4 className="font-bold text-lg leading-tight">สอบถามข้อมูลเพิ่มเติม</h4>
                  <p className="text-xs text-slate-400 mt-0.5">เราพร้อมให้บริการ และดูแลคุณ</p>
                </div>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row w-full md:w-auto gap-3">
                <a href={`https://line.me/R/ti/p/${settings?.lineId?.replace('@', '%40') || ''}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#00B900] text-white px-6 py-3 rounded-md font-bold text-sm shadow-lg shadow-[#00B900]/20 hover:bg-[#009900] transition-colors whitespace-nowrap">
                  <LineIcon className="w-5 h-5" /> แชทกับเราใน LINE
                </a>
                <a href={`tel:${settings?.phoneMain?.replace(/-/g, '') || '0999999999'}`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-transparent border border-slate-600 text-white px-6 py-3 rounded-md font-bold text-sm hover:bg-white hover:text-[#0A0D14] transition-all whitespace-nowrap">
                  <Phone size={18} /> โทรหาเรา
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
