'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, CircleDot, Disc3, Wrench, Disc, Zap, Droplets } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PRODUCT_CATEGORIES: { name: string; href: string; icon: LucideIcon }[] = [
  { name: 'ยาง',           href: '/tires',       icon: CircleDot },
  { name: 'ล้อแม็ก',       href: '/wheels',      icon: Disc3 },
  { name: 'ของแต่ง',       href: '/accessories', icon: Wrench },
  { name: 'เบรค',          href: '/brakes',      icon: Disc },
  { name: 'โช๊ค',          href: '/shock',       icon: Zap },
  { name: 'น้ำมันเครื่อง', href: '/oil',         icon: Droplets },
];

export function DesktopNav() {
  const pathname = usePathname();

  const isProductActive = PRODUCT_CATEGORIES.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + '/')
  );

  const navLinks = [
    { name: 'หน้าหลัก', href: '/' },
    { name: 'โปรโมชั่น', href: '/promotions' },
    { name: 'บริการของเรา', href: '/services' },
    { name: 'ติดต่อเรา', href: '/contact' },
  ];

  return (
    <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-700">
      {/* หมวดหมู่สินค้า dropdown */}
      <div className="relative group">
        <button
          className={`flex items-center gap-1 py-1 border-b-2 transition ${
            isProductActive
              ? 'text-green-600 border-green-600 font-bold'
              : 'border-transparent hover:text-green-600 hover:border-green-200'
          }`}
        >
          สินค้า
          <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
        </button>

        {/* Dropdown */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-3 w-64">
            <div className="grid grid-cols-2 gap-1">
              {PRODUCT_CATEGORIES.map((cat) => {
                const isActive = pathname === cat.href || pathname.startsWith(cat.href + '/');
                return (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-green-50 text-green-700'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-green-600'
                    }`}
                  >
                    <cat.icon className="w-4 h-4 shrink-0" />
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {navLinks.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`transition py-1 border-b-2 ${
              isActive
                ? 'text-green-600 border-green-600 font-bold'
                : 'border-transparent hover:text-green-600 hover:border-green-200'
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
