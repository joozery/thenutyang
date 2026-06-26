import Link from "next/link";
import { HeroSection } from "@/components/home/hero-section";

import { PopularTires } from "@/components/home/popular-tires";
import { Testimonials } from "@/components/home/testimonials";
import { Disc, Settings, Wrench, Droplet, Battery, ClipboardList, Check, ShieldCheck, RefreshCw, AlertCircle, Wind, CheckCircle2 } from "lucide-react";
import { getAllBanners } from "@/lib/banners";
import { AfterSales } from "@/components/home/after-sales";
import connectDB from "@/lib/mongodb";
import { Service } from "@/models/Service";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const banners = await getAllBanners();
  const main   = banners.find(b => b.slot === 'main');
  const promo1 = banners.find(b => b.slot === 'promo1');
  const promo2 = banners.find(b => b.slot === 'promo2');

  await connectDB();
  const servicesData = await Service.find().sort({ order: 1, createdAt: -1 }).lean();
  // We need to stringify and parse to convert MongoDB ObjectIds to strings for passing to Client Components (if any) or just rendering cleanly
  const services = JSON.parse(JSON.stringify(servicesData));

  return (
    <>
      <HeroSection />
      

      <PopularTires />
      
      {/* Promotions Banner Section — single card */}
      {main?.published !== false && (
        <section className="container mx-auto px-4 md:px-8 py-8">
          <div
            className="relative w-full min-h-[260px] md:min-h-[340px] rounded-3xl overflow-hidden bg-cover bg-center flex items-center"
            style={{ backgroundImage: `url('${main?.bgImage || '/yang/green.png'}')` }}
          >
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

            {/* Accent glow */}
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-green-500/20 blur-3xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 px-8 md:px-14 py-10 max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/40 text-green-300 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                โปรโมชั่นพิเศษ
              </div>

              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3 drop-shadow-lg">
                {main?.title ?? 'ซื้อ 3 แถม 1'}
              </h2>

              {main?.subtitle && (
                <p className="text-green-100/90 text-sm md:text-base font-medium mb-6 leading-relaxed">
                  {main.subtitle}
                </p>
              )}

              {main?.buttonText && (
                <Link
                  href={main.buttonLink || '/'}
                  className="inline-flex items-center gap-2.5 bg-green-500 hover:bg-green-400 text-white font-bold px-7 py-3 rounded-full transition-all duration-200 shadow-lg shadow-green-500/30 hover:shadow-green-400/40 hover:-translate-y-0.5 text-sm md:text-base"
                >
                  {main.buttonText}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}


      <AfterSales services={services} />

      {/* Brands Section */}
      <section className="bg-white py-12 border-y border-slate-100">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">แบรนด์ยางชั้นนำที่เราจำหน่าย</h2>
            <Link href="/tires" className="text-green-600 font-medium text-sm hover:underline">ดูทั้งหมด →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:flex lg:justify-between items-center gap-4">
            {[
              { src: "/brand/michelin-7-logo-svgrepo-com.svg", alt: "Michelin", className: "scale-150" },
              { src: "/brand/bridgestone-26989.svg", alt: "Bridgestone", className: "scale-150" },
              { src: "/brand/yokohama-logo.svg", alt: "Yokohama", className: "scale-90" },
              { src: "/brand/dunlop-sport.svg", alt: "Dunlop", className: "scale-100" },
              { src: "/brand/goodyear-tire-1.svg", alt: "Goodyear", className: "scale-100" },
              { src: "/brand/continental-2-1.svg", alt: "Continental", className: "scale-100" },
              { src: "/brand/pirelli-2.svg", alt: "Pirelli", className: "scale-125" },
            ].map((brand, idx) => (
              <Link href={`/tires?brand=${brand.alt}`} key={idx} className="bg-white border border-slate-100 hover:border-green-300 hover:shadow-md transition-all rounded-lg h-24 lg:h-28 w-full lg:w-32 flex items-center justify-center p-4 overflow-hidden group cursor-pointer block">
                <img src={brand.src} alt={brand.alt} className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 ${brand.className}`} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-[url('/why.png')] bg-cover bg-center py-12 md:py-16 text-white relative overflow-hidden min-h-[350px] flex items-center">
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="flex justify-end">
            <div className="max-w-xl w-full">
              <h2 className="text-2xl md:text-3xl font-bold mb-1">ทำไมต้องเลือก</h2>
              <h2 className="text-3xl md:text-4xl font-black text-green-500 mb-6">เดอะนัททายางยนต์</h2>
              
              <ul className="space-y-4">
                {[
                  "ยางแท้ 100% จากตัวแทนจำหน่ายอย่างเป็นทางการ",
                  "ราคาดีที่สุด เช็คราคาทุกวัน",
                  "ทีมช่างมืออาชีพ ประสบการณ์มากกว่า 10 ปี",
                  "เครื่องมือทันสมัย ได้มาตรฐาน",
                  "บริการรวดเร็ว ใส่ใจทุกรายละเอียด"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                    <span className="text-slate-200 text-sm md:text-base font-light">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />
    </>
  );
}
