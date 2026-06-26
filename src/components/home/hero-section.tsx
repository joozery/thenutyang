'use client';

import { CreditCard, Truck, ShieldCheck, Wrench } from 'lucide-react';
import { HeroSearch } from './hero-search';

const FEATURES = [
  { icon: Truck,       label: 'จัดส่งฟรี',       sub: 'ทั่วประเทศ' },
  { icon: ShieldCheck, label: 'รับประกันทุกเส้น', sub: 'เปลี่ยนฟรี 1 ปี' },
  { icon: Wrench,      label: 'บริการติดตั้ง',    sub: 'โดยช่างมืออาชีพ' },
  { icon: CreditCard,  label: 'ผ่อน 0%',          sub: 'สูงสุด 10 เดือน' },
];


export function HeroSection() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative w-full overflow-hidden min-h-[460px] md:min-h-[540px] flex items-center pb-36 md:pb-0 bg-[url('/newcover.jpeg')] bg-cover bg-[position:75%_center] md:bg-center bg-no-repeat">

        {/* Overlay มือถือเท่านั้น */}
        <div className="absolute inset-0 bg-black/50 lg:hidden pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 relative z-10 w-full py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* ── Left copy ── */}
            <div className="flex flex-col gap-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-3.5 py-1.5 rounded-full w-fit text-xs font-bold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                ครบ จบ ในที่เดียว
              </div>

              {/* Headline */}
              <h1 className="text-[30px] sm:text-4xl md:text-[58px] font-black text-white leading-[1.1] tracking-tight">
                ครบ จบ เรื่อง<span className="text-green-400">ยาง</span>
                <br />
                และ<span className="text-white">บริการ</span>รถยนต์
              </h1>

              {/* Subtitle */}
              <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-sm">
                จำหน่ายยางรถยนต์คุณภาพจากแบรนด์ชั้นนำ
                พร้อมบริการติดตั้ง ตั้งศูนย์ ถ่วงล้อ โดยช่างมืออาชีพ
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
                {FEATURES.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-green-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-white text-[11px] font-semibold leading-tight">{label}</p>
                      <p className="text-slate-400 text-[9px] mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Search card (desktop) ── */}
            <div className="hidden lg:flex justify-end items-center">
              <div className="w-[420px]">
                <HeroSearch />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Mobile: Search card ─── */}
      <div className="lg:hidden container mx-auto px-4 relative z-20 -mt-24 mb-6">
        <HeroSearch />
      </div>

    </>
  );
}
