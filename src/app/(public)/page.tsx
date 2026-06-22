import Link from "next/link";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesBar } from "@/components/home/features-bar";
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
      
      <div className="hidden md:block">
        <FeaturesBar />
      </div>
      <PopularTires />
      
      {/* Promotions Banner Section */}
      <section className="container mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Banner */}
          {main?.published !== false && (
            <div
              className="lg:col-span-2 rounded-2xl overflow-hidden relative bg-cover bg-center bg-no-repeat text-white p-8 md:p-12 min-h-[300px] flex flex-col justify-center"
              style={{ backgroundImage: `url('${main?.bgImage || '/yang/green.png'}')` }}
            >
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black mb-2">{main?.title ?? 'ซื้อ 3 แถม 1'}</h2>
                <p className="text-lg md:text-xl font-medium mb-6 text-green-100">{main?.subtitle}</p>
                {main?.buttonText && (
                  <Link href={main.buttonLink || '/'} className="bg-white text-green-600 font-bold py-2.5 px-8 rounded-full w-fit hover:bg-green-50 transition-colors shadow-sm flex items-center gap-2">
                    {main.buttonText} <span className="text-[10px]">&gt;</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6">
            {/* Promo 1 */}
            {promo1?.published !== false && (
              <div
                className="rounded-2xl bg-cover bg-right text-white p-6 md:p-8 flex-1 relative overflow-hidden flex flex-col justify-center min-h-[160px]"
                style={{ backgroundImage: `url('${promo1?.bgImage || '/cover/31.png'}')` }}
              >
                <div className="relative z-10">
                  <h3 className="text-2xl md:text-3xl font-black mb-1 md:mb-2 text-green-400 drop-shadow-md">{promo1?.title ?? 'ผ่อน 0%'}</h3>
                  <p className="font-medium text-sm md:text-base drop-shadow-md">{promo1?.subtitle}</p>
                  {promo1?.buttonText && (
                    <Link href={promo1.buttonLink || '/'} className="mt-3 md:mt-4 text-xs md:text-sm font-bold bg-white text-green-600 px-4 py-1.5 md:py-2 rounded-full hover:bg-slate-100 transition inline-block w-max">
                      {promo1.buttonText}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Promo 2 */}
            {promo2?.published !== false && (
              <div
                className="rounded-2xl bg-cover bg-right text-white p-6 md:p-8 flex-1 flex flex-col justify-center relative min-h-[160px]"
                style={{ backgroundImage: `url('${promo2?.bgImage || '/ser.png'}')` }}
              >
                <div className="relative z-10">
                  <h3 className="text-2xl md:text-3xl font-black mb-1 md:mb-2 text-white drop-shadow-md">{promo2?.title ?? 'บริการตั้งศูนย์'}</h3>
                  <p className="font-medium text-sm md:text-base drop-shadow-md">{promo2?.subtitle}</p>
                  {promo2?.buttonText && (
                    <Link href={promo2.buttonLink || '/'} className="mt-3 md:mt-4 text-xs md:text-sm font-bold bg-green-600 text-white px-4 py-1.5 md:py-2 rounded-full hover:bg-green-700 transition inline-block w-max">
                      {promo2.buttonText}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

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
