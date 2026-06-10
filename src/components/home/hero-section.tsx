import { Button } from "@/components/ui/button";
import { Search, Truck, ShieldCheck, Wrench } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full bg-slate-50 overflow-hidden min-h-[500px] flex items-center pt-8 pb-16 bg-[url('/cover/cover.png')] bg-cover bg-center bg-no-repeat">
      
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
              ครบ จบ เรื่อง<span className="text-rose-600">ยาง</span>
              <br />
              และ<span className="text-rose-600">บริการ</span>รถยนต์
            </h1>
            
            <p className="text-slate-600 text-lg md:text-xl font-medium">
              จำหน่ายยางรถยนต์คุณภาพจากแบรนด์ชั้นนำ
              <br />
              พร้อมบริการติดตั้ง ตั้งศูนย์ ถ่วงล้อ โดยช่างมืออาชีพ
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-slate-800">จัดส่งฟรี<br/>ทั่วประเทศ</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-slate-800">รับประกันคุณภาพ<br/>ยาง บวม แตก</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-slate-800">บริการติดตั้ง<br/>โดยช่างมืออาชีพ</span>
              </div>
            </div>
            
            <div className="mt-4">
              <Button className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-6 rounded-full text-lg font-bold shadow-lg shadow-rose-600/30 transition-transform hover:scale-105">
                ค้นหายางสำหรับรถของคุณ <span className="ml-2">→</span>
              </Button>
            </div>
          </div>
          
          {/* Right Content */}
          <div className="relative flex justify-center md:justify-end items-center min-h-[450px]">
            {/* Search Card Overlay */}
            <div className="w-[100%] md:w-[400px] bg-white rounded-2xl shadow-xl p-6 border border-slate-100 relative z-20">
              <h3 className="text-xl font-bold text-slate-800 mb-4">ค้นหายางที่ใช่สำหรับคุณ</h3>
              
              <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                <button className="flex-1 bg-white text-rose-600 font-semibold py-2 rounded-md shadow-sm text-sm flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-rose-600 flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-rose-600"></span></span>
                  ค้นหาจากขนาดยาง
                </button>
                <button className="flex-1 text-slate-500 font-medium py-2 rounded-md text-sm hover:text-slate-700 flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-slate-300"></span>
                  ค้นหาจากรุ่นรถ
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">ความกว้างของยาง</label>
                  <select className="w-full border border-slate-200 rounded-lg p-3 text-slate-700 bg-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500">
                    <option>205</option>
                    <option>215</option>
                    <option>225</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">ซีรีส์</label>
                    <select className="w-full border border-slate-200 rounded-lg p-3 text-slate-700 bg-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500">
                      <option>55</option>
                      <option>60</option>
                      <option>65</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">ขอบล้อ</label>
                    <select className="w-full border border-slate-200 rounded-lg p-3 text-slate-700 bg-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500">
                      <option>16</option>
                      <option>17</option>
                      <option>18</option>
                    </select>
                  </div>
                </div>
                
                <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white py-6 rounded-lg text-md font-bold mt-2 shadow-md shadow-rose-200">
                  <Search className="w-5 h-5 mr-2" /> ค้นหายาง
                </Button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
