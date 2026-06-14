"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Users, Car, Package,
  ShoppingBag, Warehouse, FileText, DollarSign,
  UserCircle, CalendarDays, BarChart2, Settings,
  Settings2, HeadphonesIcon, ChevronRight, ClipboardList
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

export function AdminSidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { icon: <Home size={18} />, label: "หน้าหลัก", href: "/admin", active: pathname === "/admin" },
    { icon: <ClipboardList size={18} />, label: "การจอง", href: "/admin/bookings", active: pathname.startsWith("/admin/bookings") },
    { icon: <Users size={18} />, label: "ลูกค้า", href: "/admin/customers", active: pathname === "/admin/customers" },
    { icon: <Car size={18} />, label: "รถของลูกค้า", href: "/admin/vehicles", active: pathname === "/admin/vehicles" },
    { icon: <Package size={18} />, label: "สินค้า/สต๊อก", href: "/admin/products", active: pathname.startsWith("/admin/products") },
    { icon: <ShoppingBag size={18} />, label: "จัดซื้อ", href: "/admin/purchasing", active: pathname === "/admin/purchasing" },
    { icon: <Warehouse size={18} />, label: "คลังสินค้า", href: "/admin/warehouse", active: pathname === "/admin/warehouse" },
    { icon: <FileText size={18} />, label: "บิล/เอกสาร", href: "/admin/documents", active: pathname.startsWith("/admin/documents"), hasSub: true },
    { icon: <DollarSign size={18} />, label: "การเงิน", href: "/admin/finance", active: pathname.startsWith("/admin/finance"), hasSub: true },
    { icon: <UserCircle size={18} />, label: "พนักงาน", href: "/admin/staff", active: pathname === "/admin/staff" },
    { icon: <CalendarDays size={18} />, label: "เงินเดือน", href: "/admin/payroll", active: pathname === "/admin/payroll" },
    { icon: <BarChart2 size={18} />, label: "รายงาน", href: "/admin/reports", active: pathname.startsWith("/admin/reports"), hasSub: true },
    { icon: <Settings size={18} />, label: "การตั้งค่า", href: "/admin/settings", active: pathname.startsWith("/admin/settings"), hasSub: true },
    { icon: <Settings2 size={18} />, label: "ตั้งค่าระบบ", href: "/admin/system", active: pathname === "/admin/system" },
  ];

  return (
    <aside 
      className={`${isOpen ? 'w-64' : 'w-20'} 
      bg-[#0f111a] text-slate-300 flex flex-col h-screen sticky top-0 z-40 transition-all duration-300 border-r border-slate-800`}
    >
      {/* Logo Area */}
      <div className={`flex items-center h-16 border-b border-slate-800/60 ${isOpen ? 'px-6' : 'justify-center'}`}>
         {isOpen ? (
           <img src="/logo/logothenun.png" alt="The Nut Yangyont" className="h-7 object-contain" />
         ) : (
           <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-rose-500/20">N</div>
         )}
      </div>

      {/* Menu List */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 sidebar-scroll"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <style>{`
          .sidebar-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className={`text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 mt-2 ${!isOpen && 'text-center'}`}>
          {isOpen ? 'เมนูหลัก' : 'เมนู'}
        </div>
        <ul className="space-y-1.5">
          {menuItems.map((item, idx) => (
            <li key={idx}>
              <Link 
                href={item.href || "#"} 
                title={!isOpen ? item.label : undefined}
                className={`flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium group
                  ${item.active 
                    ? 'bg-rose-500/10 text-rose-500' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  }
                  ${isOpen ? 'px-3' : 'justify-center px-0'}
                `}
              >
                <div className={`${item.active ? 'text-rose-500' : 'text-slate-400 group-hover:text-slate-100'} transition-colors`}>
                  {item.icon}
                </div>
                
                {isOpen && (
                  <>
                    <span className="flex-1 whitespace-nowrap">{item.label}</span>
                    {item.hasSub && (
                      <ChevronRight size={14} className={`${item.active ? 'text-rose-500' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`} />
                    )}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Help Center */}
      <div className="p-3 mt-auto border-t border-slate-800/60">
        <div className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl flex items-center gap-3 border border-slate-700/50 cursor-pointer hover:border-slate-600 transition-colors
          ${isOpen ? 'p-3' : 'p-2 justify-center'}
        `}>
          <div className="bg-rose-500/20 p-2 rounded-lg text-rose-500">
            <HeadphonesIcon size={isOpen ? 18 : 20} />
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-200 whitespace-nowrap">ศูนย์ช่วยเหลือ</div>
              <div className="text-[10px] text-slate-500 whitespace-nowrap mt-0.5">ติดต่อทีมงาน</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
