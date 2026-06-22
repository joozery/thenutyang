'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronRight } from 'lucide-react';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="lg:hidden text-slate-700 ml-1">
        <Menu className="w-7 h-7 md:w-6 md:h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[280px] bg-white z-[70] transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between border-b">
            <span className="font-black text-green-700 text-lg">THENUTTIRE</span>
            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:text-slate-800">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="flex flex-col">
              {[
                { name: 'หน้าหลัก', href: '/' },
                { name: 'ยางรถยนต์', href: '/tires' },
                { name: 'โปรโมชั่น', href: '/promotions' },
                { name: 'บริการของเรา', href: '/services' },
                { name: 'ติดต่อเรา', href: '/contact' },
              ].map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    onClick={() => setIsOpen(false)} 
                    className={`flex items-center justify-between px-6 py-4 border-b border-slate-50 font-medium hover:bg-slate-50 ${
                      isActive ? 'text-green-600 bg-green-50/50' : 'text-slate-700'
                    }`}
                  >
                    {link.name} <ChevronRight className={`w-4 h-4 ${isActive ? 'text-green-600' : 'text-slate-400'}`} />
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="p-6 bg-slate-50 mt-auto">
            <p className="text-xs text-slate-500 mb-2">ติดต่อสอบถาม</p>
            <p className="font-bold text-green-700">02-123-4567</p>
          </div>
        </div>
      </div>
    </>
  );
}
