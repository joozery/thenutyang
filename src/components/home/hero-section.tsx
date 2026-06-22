'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Truck, ShieldCheck, Wrench, Loader2 } from 'lucide-react';

interface TireSizeData {
  widths: string[];
  series: Record<string, string[]>;
  rims: Record<string, string[]>;
}

// ─── Default fallback if DB is empty ────────────────────────────
const DEFAULT_WIDTHS = ['155','165','175','185','195','205','215','225','235','245','255','265','275'];
const DEFAULT_SERIES = ['30','35','40','45','50','55','60','65','70','75'];
const DEFAULT_RIMS   = ['13','14','15','16','17','18','19','20'];

import { BRANDS, CATEGORIES } from '@/lib/tires';

import { HeroSearch } from './hero-search';

export function HeroSection() {
  return (
    <>
      <section className="relative w-full bg-slate-900 overflow-hidden min-h-[400px] md:min-h-[500px] flex items-center pt-8 pb-40 md:pb-16 bg-[url('/cover/covergreen.png')] bg-cover bg-[position:80%_center] md:bg-center bg-no-repeat">
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20 z-0 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left Content */}
            <div className="flex flex-col gap-4 md:gap-6 w-full md:max-w-xl pb-0">
              
              {/* Top Text constrained to left on mobile to avoid tire */}
              <div className="w-[65%] sm:w-[70%] md:w-full flex flex-col gap-3">
                <div className="bg-green-900/80 text-green-400 px-2.5 py-1 rounded-full w-fit text-[10px] md:text-sm font-bold border border-green-500/20">
                  ครบ จบ ในที่เดียว
                </div>
                <h1 className="text-[24px] sm:text-3xl md:text-6xl font-black text-white leading-[1.15] tracking-tight">
                  ครบ จบ เรื่อง<span className="text-green-500">ยาง</span>
                  <br />
                  และ<span className="text-white">บริการ</span>รถยนต์
                </h1>
                <p className="text-slate-300 text-[10px] sm:text-sm md:text-xl font-medium leading-relaxed">
                  จำหน่ายยางรถยนต์คุณภาพจากแบรนด์ชั้นนำ
                  <br />
                  พร้อมบริการติดตั้ง ตั้งศูนย์ ถ่วงล้อ 
                  <br className="md:hidden" />
                  โดยช่างมืออาชีพ
                </p>
              </div>

              {/* Features spanning full width */}
              <div className="grid grid-cols-3 gap-1 md:gap-4 mt-1 md:mt-4 w-full">
                {[
                  { icon: <Truck className="w-3 h-3 md:w-5 md:h-5" />, label: 'จัดส่งฟรี', sub: 'ทั่วประเทศ' },
                  { icon: <ShieldCheck className="w-3 h-3 md:w-5 md:h-5" />, label: 'รับประกันทุกยาง', sub: 'ยาง บวม แตก' },
                  { icon: <Wrench className="w-3 h-3 md:w-5 md:h-5" />, label: 'บริการติดตั้ง', sub: 'โดยช่างมืออาชีพ' },
                ].map(f => (
                  <div key={f.label} className="flex flex-row items-center gap-1.5 sm:gap-3">
                    <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 shrink-0">
                      {f.icon}
                    </div>
                    <span className="text-[9px] md:text-sm font-semibold text-slate-200 leading-tight">
                      {f.label}<br/><span className="text-slate-400 text-[8px] md:text-xs font-normal">{f.sub}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Desktop Only */}
            <div className="hidden lg:flex justify-end items-center">
              <div className="w-full md:w-[420px]">
                <HeroSearch />
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Mobile Search Card */}
      <div className="lg:hidden container mx-auto px-4 relative z-20 -mt-32 mb-8">
        <HeroSearch />
      </div>
    </>
  );
}
