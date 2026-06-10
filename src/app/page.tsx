import Link from "next/link";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesBar } from "@/components/home/features-bar";
import { PopularTires } from "@/components/home/popular-tires";
import { Testimonials } from "@/components/home/testimonials";
import { News } from "@/components/home/news";
import { Disc, Settings, Wrench, Droplet, Battery, ClipboardList, Check } from "lucide-react";

export default function Home() {
  return (
    <>
      <HeroSection />
      
      {/* Search / Filter Section */}
      <section className="bg-slate-100 py-6 border-b border-slate-200 relative z-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row bg-white rounded-2xl md:rounded-full p-2 md:p-2 shadow-sm max-w-4xl mx-auto gap-2 md:gap-0">
            <select className="flex-1 px-4 py-3 md:py-2 bg-transparent border-none focus:outline-none text-slate-700 font-medium rounded-xl md:rounded-none bg-slate-50 md:bg-transparent">
              <option>ค้นหาจากขนาดยาง</option>
            </select>
            <div className="hidden md:block w-px bg-slate-200 mx-2"></div>
            
            <select className="flex-1 px-4 py-3 md:py-2 bg-transparent border-none focus:outline-none text-slate-700 font-medium rounded-xl md:rounded-none bg-slate-50 md:bg-transparent">
              <option>ค้นหาจากยี่ห้อรถยนต์</option>
            </select>
            <div className="hidden md:block w-px bg-slate-200 mx-2"></div>

            <select className="flex-1 px-4 py-3 md:py-2 bg-transparent border-none focus:outline-none text-slate-700 font-medium rounded-xl md:rounded-none bg-slate-50 md:bg-transparent">
              <option>ค้นหาจากยี่ห้อยาง</option>
            </select>
            
            <button className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 md:py-2 rounded-xl md:rounded-full font-bold transition-colors w-full md:w-auto mt-2 md:mt-0">
              ค้นหาเลย
            </button>
          </div>
        </div>
      </section>

      <FeaturesBar />
      <PopularTires />
      
      {/* Promotions Banner Section */}
      <section className="container mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl overflow-hidden relative bg-[url('/yang/31.png')] bg-cover bg-center bg-no-repeat text-white p-8 md:p-12 min-h-[300px] flex flex-col justify-center">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-2">ซื้อ 3 แถม 1</h2>
              <p className="text-lg md:text-xl font-medium mb-6 text-rose-100">เฉพาะรุ่นที่ร่วมรายการ</p>
              <button className="bg-white text-rose-600 font-bold py-2.5 px-8 rounded-full w-fit hover:bg-rose-50 transition-colors shadow-sm flex items-center gap-2">ช้อปเลย <span className="text-[10px]">&gt;</span></button>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            {/* Promo 1: 0% */}
            <div className="rounded-2xl bg-[url('/yang/percent.png')] bg-cover bg-right text-white p-6 md:p-8 flex-1 relative overflow-hidden flex flex-col justify-center min-h-[160px]">
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-black mb-1 md:mb-2 text-rose-500 drop-shadow-md">ผ่อน 0%</h3>
                <p className="font-medium text-sm md:text-base drop-shadow-md">สูงสุด 10 เดือน</p>
                <button className="mt-3 md:mt-4 text-xs md:text-sm font-bold bg-white text-rose-600 px-4 py-1.5 md:py-2 rounded-full hover:bg-slate-100 transition inline-block w-max">
                  ดูรายละเอียด
                </button>
              </div>
            </div>

            {/* Promo 2: Free Alignment */}
            <div className="rounded-2xl bg-[url('/yang/500.png')] bg-cover bg-right text-white p-6 md:p-8 flex-1 flex flex-col justify-center relative min-h-[160px]">
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-black mb-1 md:mb-2 text-white drop-shadow-md">บริการตั้งศูนย์</h3>
                <p className="font-medium text-sm md:text-base drop-shadow-md">เริ่มต้น 500.-</p>
                <button className="mt-3 md:mt-4 text-xs md:text-sm font-bold bg-rose-600 text-white px-4 py-1.5 md:py-2 rounded-full hover:bg-rose-700 transition inline-block w-max">
                  จองคิวรับบริการ
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="relative mb-8 text-center md:text-left inline-block">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 pb-2">บริการของเรา</h2>
            <div className="absolute -bottom-1 left-0 w-12 h-1 bg-rose-600 rounded-full hidden md:block"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: "เปลี่ยนยาง", desc: "มาตรฐาน ปลอดภัย", iconNode: <Disc className="w-8 h-8" /> },
              { icon: "ตั้งศูนย์ - ถ่วงล้อ", desc: "แม่นยำ ด้วยเครื่องมือทันสมัย", iconNode: <Settings className="w-8 h-8" /> },
              { icon: "ปะยาง - ซ่อมยาง", desc: "รวดเร็ว ปลอดภัย", iconNode: <Wrench className="w-8 h-8" /> },
              { icon: "เปลี่ยนถ่ายน้ำมันเครื่อง", desc: "น้ำมันเครื่องคุณภาพสูง", iconNode: <Droplet className="w-8 h-8" /> },
              { icon: "แบตเตอรี่", desc: "แบตเตอรี่คุณภาพ", iconNode: <Battery className="w-8 h-8" /> },
              { icon: "ตรวจเช็คสภาพรถ", desc: "ฟรีเช็ค 30 รายการ", iconNode: <ClipboardList className="w-8 h-8" /> },
            ].map((service, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow hover:border-rose-200 group cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4 group-hover:bg-rose-100 transition-colors">
                  {service.iconNode}
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">{service.icon}</h4>
                <p className="text-xs text-slate-500">{service.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <button className="bg-rose-600 text-white font-bold py-3 px-8 rounded-full hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200">ดูบริการทั้งหมด</button>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="bg-white py-12 border-y border-slate-100">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">แบรนด์ยางชั้นนำที่เราจำหน่าย</h2>
            <button className="text-rose-600 font-medium text-sm hover:underline">ดูทั้งหมด →</button>
          </div>
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 md:gap-4">
            <img src="/brand/michelin-7-logo-svgrepo-com.svg" alt="Michelin" className="h-12 md:h-20 w-auto object-contain scale-125" />
            <img src="/brand/bridgestone-26989.svg" alt="Bridgestone" className="h-12 md:h-20 w-auto object-contain scale-125" />
            <img src="/brand/yokohama-logo.svg" alt="Yokohama" className="h-4 md:h-6 w-auto object-contain" />
            <img src="/brand/dunlop-sport.svg" alt="Dunlop" className="h-5 md:h-7 w-auto object-contain" />
            <img src="/brand/goodyear-tire-1.svg" alt="Goodyear" className="h-4 md:h-6 w-auto object-contain" />
            <img src="/brand/continental-2-1.svg" alt="Continental" className="h-5 md:h-7 w-auto object-contain" />
            <img src="/brand/pirelli-2.svg" alt="Pirelli" className="h-10 md:h-16 w-auto object-contain" />
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-[url('/cover/coverwhy.png')] bg-cover bg-center py-12 md:py-16 text-white relative overflow-hidden min-h-[350px] flex items-center">
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="flex justify-end">
            <div className="max-w-xl w-full">
              <h2 className="text-2xl md:text-3xl font-bold mb-1">ทำไมต้องเลือก</h2>
              <h2 className="text-3xl md:text-4xl font-black text-rose-500 mb-6">เดอะนัททายางยนต์</h2>
              
              <ul className="space-y-4">
                {[
                  "ยางแท้ 100% จากตัวแทนจำหน่ายอย่างเป็นทางการ",
                  "ราคาดีที่สุด เช็คราคาทุกวัน",
                  "ทีมช่างมืออาชีพ ประสบการณ์มากกว่า 10 ปี",
                  "เครื่องมือทันสมัย ได้มาตรฐาน",
                  "บริการรวดเร็ว ใส่ใจทุกรายละเอียด"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-sm">
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
      <News />
    </>
  );
}
