'use client';

import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

export function Testimonials() {
  const reviews = [
    {
      id: 1,
      name: "คุณธนพล พ.",
      initial: "ธ",
      location: "ลูกค้าจาก กรุงเทพฯ",
      review: "บริการดี รวดเร็ว พนักงานอธิบายละเอียด ราคาดีกว่าที่อื่น แนะนำเลยครับ",
      color: "bg-blue-100 text-blue-700"
    },
    {
      id: 2,
      name: "คุณวรรณิดา ป.",
      initial: "ว",
      location: "ลูกค้าจาก เชียงใหม่",
      review: "ยางคุณภาพดี จัดส่งไว ติดตั้งฟรีถึงบ้าน ประทับใจมากครับ",
      color: "bg-rose-100 text-rose-700"
    },
    {
      id: 3,
      name: "คุณอภิวัชร์ ว.",
      initial: "อ",
      location: "ลูกค้าจาก ชลบุรี",
      review: "ผ่อน 0% นาน 4 เดือน ช่วยให้ตัดสินใจง่ายขึ้น แถมบริการหลังการขายดีมากค่ะ",
      color: "bg-emerald-100 text-emerald-700"
    },
    {
      id: 4,
      name: "คุณสมชาย ท.",
      initial: "ส",
      location: "ลูกค้าจาก ระยอง",
      review: "ร้านกว้างขวาง มีที่นั่งรอสบาย เปลี่ยนยางเร็วมาก ช่างให้คำแนะนำดีครับ",
      color: "bg-purple-100 text-purple-700"
    },
    {
      id: 5,
      name: "คุณกิตติยา ส.",
      initial: "ก",
      location: "ลูกค้าจาก กรุงเทพฯ",
      review: "ราคาคุ้มค่า มีโปรโมชั่นเยอะ แถมยังมีบริการเช็คลมยางและสลับยางฟรีด้วย",
      color: "bg-amber-100 text-amber-700"
    }
  ];

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-slate-50 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-green-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="relative inline-block">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">เสียงจากลูกค้าของเรา</h2>
            <div className="w-16 h-1.5 bg-[#00B900] rounded-sm mt-3"></div>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-8 pt-2 hide-scrollbar" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reviews.map((item) => (
              <div key={item.id} className="relative bg-white p-6 rounded-md shadow-md shadow-slate-200/50 border border-slate-100 flex flex-col h-full min-w-[280px] md:min-w-[340px] shrink-0 snap-start hover:-translate-y-1 hover:shadow-lg hover:border-green-200 transition-all duration-300 overflow-hidden group cursor-default">
                <Quote className="absolute -top-2 -right-2 w-16 h-16 text-slate-50 opacity-60 rotate-12 group-hover:scale-110 group-hover:-rotate-12 group-hover:text-green-50 transition-all duration-500 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex gap-1 mb-4 text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                
                <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6 flex-1 font-medium italic">
                  "{item.review}"
                </p>
                
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center font-black text-lg shadow-sm ${item.color}`}>
                    {item.initial}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.location}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
        
        {/* Mobile controls */}
        <div className="flex justify-center gap-3 mt-2 md:hidden">
          <button 
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 active:bg-green-50 active:text-green-600 transition-colors shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 active:bg-green-50 active:text-green-600 transition-colors shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
