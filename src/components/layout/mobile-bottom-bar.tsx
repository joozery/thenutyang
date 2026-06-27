'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Search, Wrench, User, X, CircleDot, Disc3, Disc, Zap, Droplets } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const PRODUCT_CATEGORIES: { name: string; href: string; icon: LucideIcon }[] = [
  { name: 'ยาง',           href: '/tires',       icon: CircleDot },
  { name: 'ล้อแม็ก',       href: '/wheels',      icon: Disc3 },
  { name: 'ของแต่ง',       href: '/accessories', icon: Wrench },
  { name: 'เบรค',          href: '/brakes',      icon: Disc },
  { name: 'โช๊ค',          href: '/shock',       icon: Zap },
  { name: 'น้ำมันเครื่อง', href: '/oil',         icon: Droplets },
];

export function MobileBottomBar() {
  const pathname = usePathname();
  const [showCategories, setShowCategories] = useState(false);

  const isProductActive = PRODUCT_CATEGORIES.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + '/')
  );

  return (
    <>
      {/* Category Sheet */}
      {showCategories && (
        <div className="fixed bottom-16 left-0 right-0 z-[80] lg:hidden bg-white rounded-t-2xl shadow-2xl border-t border-slate-100">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-800">หมวดหมู่สินค้า</span>
              <button
                onClick={() => setShowCategories(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 p-4 pb-6">
              {PRODUCT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = pathname === cat.href || pathname.startsWith(cat.href + '/');
                return (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    onClick={() => setShowCategories(false)}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 border-2 transition-colors ${
                      isActive
                        ? 'bg-green-50 border-green-400 text-green-700'
                        : 'bg-slate-50 border-transparent text-slate-600 active:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                    <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
        </div>
      )}

      {/* Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-2 h-16">

          <Link
            href="/"
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors ${
              pathname === '/' ? 'text-green-600' : 'text-slate-500'
            }`}
          >
            <Home size={22} strokeWidth={pathname === '/' ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">หน้าแรก</span>
          </Link>

          <button
            onClick={() => setShowCategories((v) => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors ${
              isProductActive || showCategories ? 'text-green-600' : 'text-slate-500'
            }`}
          >
            <LayoutGrid size={22} strokeWidth={isProductActive || showCategories ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">หมวดหมู่</span>
          </button>

          <Link
            href="/tires"
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors ${
              pathname === '/tires' ? 'text-green-600' : 'text-slate-500'
            }`}
          >
            <Search size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">ค้นหา</span>
          </Link>

          <Link
            href="/services"
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors ${
              pathname.startsWith('/services') ? 'text-green-600' : 'text-slate-500'
            }`}
          >
            <Wrench size={22} strokeWidth={pathname.startsWith('/services') ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">บริการ</span>
          </Link>

          <Link
            href="/account"
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors ${
              pathname.startsWith('/account') ? 'text-green-600' : 'text-slate-500'
            }`}
          >
            <User size={22} strokeWidth={pathname.startsWith('/account') ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">บัญชีของฉัน</span>
          </Link>

        </div>
      </nav>
    </>
  );
}
