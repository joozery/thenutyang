'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Search, Wrench, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',           icon: Home,        label: 'หน้าแรก' },
  { href: '/tires',      icon: LayoutGrid,  label: 'หมวดหมู่' },
  { href: '/tires?q=1',  icon: Search,      label: 'ค้นหา',   isSearch: true },
  { href: '/services',   icon: Wrench,      label: 'บริการ' },
  { href: '/account',    icon: User,        label: 'บัญชีของฉัน' },
];

export function MobileBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-between px-2 h-[68px]">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = item.isSearch
            ? false
            : item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href.split('?')[0]);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-colors ${
                isActive ? 'text-green-600' : 'text-slate-600 hover:text-green-600'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'fill-green-600 text-green-600' : undefined} />
              <span className={`text-[10px] font-medium leading-none${isActive ? ' font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
