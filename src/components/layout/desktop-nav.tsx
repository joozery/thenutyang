'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DesktopNav() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'หน้าหลัก', href: '/' },
    { name: 'ยางรถยนต์', href: '/tires' },
    { name: 'โปรโมชั่น', href: '/promotions' },
    { name: 'บริการของเรา', href: '/services' },
    { name: 'ติดต่อเรา', href: '/contact' },
  ];

  return (
    <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-700">
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
