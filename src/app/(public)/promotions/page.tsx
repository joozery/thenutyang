import { getAllBanners } from "@/lib/banners";
import Link from "next/link";
import { Tag, CalendarRange, ArrowRight, ShieldCheck, CreditCard, Sparkles, MessageCircleQuestion, Settings, Car } from "lucide-react";
import connectDB from "@/lib/mongodb";
import { Promotion } from "@/models/Promotion";

export const metadata = { title: "โปรโมชั่น | เดอะนัททายางยนต์" };
export const dynamic = 'force-dynamic';

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-8 h-8 text-white/80" />,
  ShieldCheck: <ShieldCheck className="w-8 h-8 text-white/80" />,
  CreditCard: <CreditCard className="w-8 h-8 text-white/80" />,
  Tag: <Tag className="w-8 h-8 text-white/80" />,
  Settings: <Settings className="w-8 h-8 text-white/80" />,
  Car: <Car className="w-8 h-8 text-white/80" />
};

// ฟังก์ชันสร้างสีสุ่มสำหรับ Card (Fallback) ถ้าไม่มีรูปภาพ
const GRADIENTS = [
  "from-green-600 to-emerald-800",
  "from-blue-600 to-indigo-800",
  "from-amber-500 to-orange-700",
  "from-rose-500 to-red-700",
  "from-purple-600 to-violet-800",
];

export default async function PromotionsPage() {
  const banners = await getAllBanners();
  const activeBanners = banners.filter(b => b.published);

  await connectDB();
  const promotionsData = await Promotion.find({ published: true }).sort({ order: 1, createdAt: -1 }).lean();
  let staticPromotions = JSON.parse(JSON.stringify(promotionsData));

  // ข้อมูลโปรโมชั่นอื่นๆ (Static) เพื่อความสวยงาม (ถ้าไม่มีใน DB)
  if (staticPromotions.length === 0) {
    staticPromotions = [
    {
      title: "เทิร์นยางเก่า ลดสูงสุด 2,000.-",
      subtitle: "เพียงนำยางเก่า 4 เส้นมาเทิร์นเมื่อซื้อยางใหม่",
      buttonText: "เช็คราคายาง",
      buttonLink: "/tires",
      bgImage: "from-blue-600 to-blue-800",
      icon: <Sparkles className="w-8 h-8 text-blue-200" />,
      validUntil: "ไม่มีวันหมดอายุ"
    },
    {
      title: "ฟรี! ปะยางตลอดอายุการใช้งาน",
      subtitle: "เมื่อซื้อยางครบ 4 เส้นที่ร้าน",
      buttonText: "ดูเงื่อนไขเพิ่มเติม",
      buttonLink: "/services",
      bgImage: "from-amber-500 to-orange-600",
      icon: <ShieldCheck className="w-8 h-8 text-amber-200" />,
      validUntil: "เฉพาะลูกค้าทางร้าน"
    },
    {
      title: "รับบัตรเครดิตทุกธนาคาร",
      subtitle: "ไม่มีชาร์จเพิ่ม พร้อมผ่อน 0% กับบัตรที่ร่วมรายการ",
      buttonText: "สอบถามทาง Line",
      buttonLink: "/contact",
      bgImage: "from-purple-600 to-indigo-700",
      icon: <CreditCard className="w-8 h-8 text-purple-200" />,
      validUntil: "อัปเดต 2567"
    }
  ];
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-[url('/yang/green.png')] bg-cover bg-center pt-16 md:pt-24 pb-32 text-center px-4 relative overflow-hidden">
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-md">โปรโมชั่นสุดคุ้ม</h1>
          <p className="text-green-50 max-w-xl mx-auto text-lg md:text-xl font-light drop-shadow">
            อัปเดตโปรโมชั่นใหม่ล่าสุด เพื่อรถที่คุณรักและกระเป๋าตังค์ของคุณ
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* 1. Dynamic Banners from DB */}
          {activeBanners.map((banner, i) => (
            <div key={banner.id} className="group rounded-2xl overflow-hidden bg-white shadow-lg shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col border border-slate-100">
              <div 
                className={`h-48 bg-cover bg-center relative ${!banner.bgImage ? 'bg-gradient-to-br ' + GRADIENTS[i % GRADIENTS.length] : ''}`}
                style={banner.bgImage ? { backgroundImage: `url('${banner.bgImage}')` } : {}}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <div className="absolute bottom-4 left-5 right-5">
                  <span className="inline-block px-2.5 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full mb-2 tracking-wider">
                    HOT PROMO
                  </span>
                  <h3 className="text-xl font-black text-white leading-tight drop-shadow-md">{banner.title}</h3>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="text-slate-600 mb-5 flex-1 text-sm">{banner.subtitle || 'สอบถามรายละเอียดเพิ่มเติมได้ที่ร้าน'}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <CalendarRange className="w-3.5 h-3.5" />
                    อัปเดตล่าสุด
                  </div>
                  <Link 
                    href={banner.buttonLink || '/'} 
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors shadow-md"
                  >
                    {banner.buttonText || 'ดูรายละเอียด'} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* 2. Static / Evergreen Promotions */}
          {staticPromotions.map((promo, i) => (
            <div key={`static-${i}`} className="group rounded-2xl overflow-hidden bg-white shadow-lg shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col border border-slate-100">
              <div className={`h-32 bg-gradient-to-br ${promo.bgImage} relative p-5 flex flex-col justify-end`}>
                <div className="absolute top-4 right-4 opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                  {ICON_MAP[promo.icon as string] || promo.icon}
                </div>
                <h3 className="text-lg md:text-xl font-black text-white leading-tight drop-shadow-md relative z-10 w-10/12">{promo.title}</h3>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="text-slate-600 mb-5 flex-1 text-sm">{promo.subtitle}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <CalendarRange className="w-3.5 h-3.5" />
                    {promo.validUntil}
                  </div>
                  <Link 
                    href={promo.buttonLink} 
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    {promo.buttonText} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

        </div>

        {/* Contact CTA */}
        <div className="mt-12 relative rounded-2xl overflow-hidden bg-gradient-to-r from-green-600 to-emerald-800 shadow-lg shadow-green-900/20">
          {/* Background pattern/circles */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-green-400 opacity-20 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 px-6 py-10 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-5">
              <div className="w-14 h-14 shrink-0 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <MessageCircleQuestion className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 drop-shadow-sm">ต้องการสอบถามเพิ่มเติม?</h2>
                <p className="text-green-50 max-w-lg text-sm md:text-base opacity-90">
                  หากคุณมีข้อสงสัยเกี่ยวกับโปรโมชั่น หรือต้องการให้เราแนะนำยางที่เหมาะสมที่สุดสำหรับรถของคุณ ทักไลน์มาคุยกับเราได้เลยครับ
                </p>
              </div>
            </div>
            
            <div className="shrink-0">
              <a href="https://lin.ee/your-line-id" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-[#00B900] font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-lg shadow-black/10 text-lg hover:-translate-y-1">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <title>LINE</title>
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                แอดไลน์สอบถาม
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
