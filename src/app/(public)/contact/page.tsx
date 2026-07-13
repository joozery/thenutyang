import { MapPin, Phone, Mail, Clock, ShieldCheck, Truck, Percent, Wrench, ExternalLink, Store } from 'lucide-react';
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

const FacebookIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Facebook</title>
    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
  </svg>
);

const InstagramIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Instagram</title>
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
  </svg>
);

const TikTokIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>TikTok</title>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const ShopeeIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Shopee</title>
    <path d="M12 0c-2.317 0-4.213 2.069-4.297 4.653H3.398L2.25 24h19.5L20.602 4.653h-4.305C16.213 2.069 14.317 0 12 0zm0 1.5c1.47 0 2.72 1.386 2.797 3.153H9.203C9.28 3.386 10.53 1.5 12 1.5zm.036 6.541c1.412 0 2.706.489 3.35.907l-.65 1.31c-.888-.474-1.817-.775-2.7-.775-1.06 0-1.765.492-1.765 1.242 0 .782.71 1.079 2.024 1.499 1.844.575 3.278 1.28 3.278 3.062 0 1.876-1.559 3.024-3.573 3.024-1.5 0-2.94-.556-3.795-1.213l.727-1.285c.735.548 1.909 1.065 3.068 1.065 1.19 0 1.996-.562 1.996-1.5 0-.85-.723-1.19-2.166-1.647-1.828-.57-3.104-1.264-3.104-2.945 0-1.653 1.406-2.744 3.31-2.744z"/>
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

  const lineHref = settings?.lineUrl || `https://line.me/R/ti/p/${settings?.lineId?.replace('@', '%40') || ''}`;

  // customIcon = โลโก้ที่แอดมินอัปโหลดเอง — ถ้ามีให้ใช้แทนไอคอนมาตรฐาน
  const socials = [
    { name: 'LINE',      url: lineHref,                customIcon: settings?.lineIcon,      icon: <LineIcon className="w-5 h-5" />,               bg: 'bg-[#00B900]' },
    { name: 'Facebook',  url: settings?.facebookUrl,   customIcon: settings?.facebookIcon,  icon: <FacebookIcon className="w-[18px] h-[18px]" />,  bg: 'bg-[#1877F2]' },
    { name: 'Instagram', url: settings?.instagramUrl,  customIcon: settings?.instagramIcon, icon: <InstagramIcon className="w-[18px] h-[18px]" />, bg: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]' },
    { name: 'TikTok',    url: settings?.tiktokUrl,     customIcon: settings?.tiktokIcon,    icon: <TikTokIcon className="w-[18px] h-[18px]" />,    bg: 'bg-black' },
    { name: 'Shopee',    url: settings?.shopeeUrl,     customIcon: settings?.shopeeIcon,    icon: <ShopeeIcon className="w-[18px] h-[18px]" />,    bg: 'bg-[#EE4D2D]' },
    { name: 'ไทยมาร์ท',  url: settings?.thaimartUrl,   customIcon: settings?.thaimartIcon,  icon: <Store size={18} strokeWidth={2} />,             bg: 'bg-emerald-600' },
  ].filter(s => !!s.url);

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
                        <a href={`tel:${(settings?.phoneMain || '0999999999').replace(/-/g, '')}`} className="hover:text-blue-600 hover:underline underline-offset-2 transition-colors">
                          {settings?.phoneMain || '099-999-9999'}
                        </a> {settings?.phoneMainLabel && `(${settings.phoneMainLabel})`}<br />
                        <a href={`tel:${(settings?.phoneSale || '0888888888').replace(/-/g, '')}`} className="hover:text-blue-600 hover:underline underline-offset-2 transition-colors">
                          {settings?.phoneSale || '088-888-8888'}
                        </a> {settings?.phoneSaleLabel && `(${settings.phoneSaleLabel})`}
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
                        <a href={lineHref} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2">
                          {settings?.lineId || '@thenuttire'}
                        </a> <span className="text-slate-400 font-normal">{settings?.lineLabel && `(${settings.lineLabel})`}</span>
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

                  {/* Social Links */}
                  {socials.length > 0 && (
                    <div className="pt-2">
                      <h4 className="font-bold text-slate-900 text-[15px] mb-3">ติดตามเราได้ที่</h4>
                      <div className="flex flex-wrap gap-2.5">
                        {socials.map(s => (
                          <a
                            key={s.name}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={s.name}
                            className={`w-10 h-10 rounded-lg ${s.customIcon ? 'bg-white border border-slate-200' : `${s.bg} text-white`} flex items-center justify-center shadow-sm hover:scale-110 hover:shadow-md transition-all overflow-hidden`}
                          >
                            {s.customIcon ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.customIcon} alt={s.name} className="w-7 h-7 object-contain" />
                            ) : s.icon}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
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
                <a href={lineHref} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#00B900] text-white px-6 py-3 rounded-md font-bold text-sm shadow-lg shadow-[#00B900]/20 hover:bg-[#009900] transition-colors whitespace-nowrap">
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
