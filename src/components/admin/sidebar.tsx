"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Users, Car, Package,
  ShoppingBag, Warehouse, FileText, DollarSign,
  UserCircle, UserCircle2, CalendarDays, BarChart2, Settings,
  Settings2, HeadphonesIcon, ChevronRight, ClipboardList, ShieldCheck, Tag,
  CalendarClock, CalendarOff, Layout, QrCode, Sparkles
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

export function AdminSidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  const menuGroups = [
    {
      title: "ภาพรวม",
      items: [
        { icon: <Home size={20} />, label: "หน้าหลัก", href: "/admin", active: pathname === "/admin" },
        { icon: <BarChart2 size={20} />, label: "รายงาน", href: "/admin/reports", active: pathname.startsWith("/admin/reports"), hasSub: true },
      ]
    },
    {
      title: "ระบบหน้าร้าน",
      items: [
        { icon: <ClipboardList size={20} />, label: "การจอง", href: "/admin/bookings", active: pathname.startsWith("/admin/bookings") },
        { icon: <QrCode size={20} />, label: "การชำระเงิน", href: "/admin/payments", active: pathname.startsWith("/admin/payments") },
        { icon: <Users size={20} />, label: "ลูกค้า", href: "/admin/customers", active: pathname === "/admin/customers" },
        { icon: <Car size={20} />, label: "ยี่ห้อ/รุ่นรถ", href: "/admin/car-data", active: pathname.startsWith("/admin/car-data") },
        { icon: <FileText size={20} />, label: "บิล/เอกสาร", href: "/admin/documents", active: pathname.startsWith("/admin/documents"), hasSub: true },
      ]
    },
    {
      title: "การตลาด & หน้าเว็บ",
      items: [
        { icon: <Layout size={20} />, label: "แบนเนอร์หลัก", href: "/admin/banners", active: pathname.startsWith("/admin/banners") },
        { icon: <Sparkles size={20} />, label: "โปรโมชั่น", href: "/admin/promotions", active: pathname.startsWith("/admin/promotions") },
        { icon: <Settings size={20} />, label: "บริการหลังการขาย", href: "/admin/services", active: pathname.startsWith("/admin/services") },
      ]
    },
    {
      title: "สินค้าคงคลัง",
      items: [
        { icon: <Package size={20} />, label: "สินค้า/สต๊อก", href: "/admin/products", active: pathname.startsWith("/admin/products") },
        { icon: <Tag size={20} />, label: "แบรนด์", href: "/admin/brands", active: pathname.startsWith("/admin/brands") },
        { icon: <ShoppingBag size={20} />, label: "จัดซื้อ", href: "/admin/purchasing", active: pathname === "/admin/purchasing" },
        { icon: <Warehouse size={20} />, label: "คลังสินค้า", href: "/admin/warehouse", active: pathname === "/admin/warehouse" },
      ]
    },
    {
      title: "บุคคล & การเงิน",
      items: [
        { icon: <DollarSign size={20} />, label: "การเงิน", href: "/admin/finance", active: pathname.startsWith("/admin/finance"), hasSub: true },
        { icon: <UserCircle size={20} />, label: "พนักงาน", href: "/admin/staff", active: pathname === "/admin/staff" },
        { icon: <CalendarClock size={20} />, label: "ลงเวลา", href: "/admin/attendance", active: pathname === "/admin/attendance" },
        { icon: <CalendarOff size={20} />, label: "การลา", href: "/admin/leave", active: pathname === "/admin/leave" },
        { icon: <CalendarDays size={20} />, label: "เงินเดือน", href: "/admin/payroll", active: pathname === "/admin/payroll" },
      ]
    },
    {
      title: "การตั้งค่า",
      items: [
        { icon: <Settings size={20} />, label: "ตั้งค่าทั่วไป", href: "/admin/settings", active: pathname === "/admin/settings" },
        { icon: <Settings2 size={20} />, label: "ตั้งค่าหน้าติดต่อ", href: "/admin/settings/contact", active: pathname === "/admin/settings/contact" },
        { icon: <ShieldCheck size={20} />, label: "จัดการ Admin", href: "/admin/users", active: pathname.startsWith("/admin/users") },
        { icon: <UserCircle2 size={20} />, label: "โปรไฟล์ของฉัน", href: "/admin/profile", active: pathname.startsWith("/admin/profile") },
      ]
    }
  ];

  return (
    <aside 
      className={`${isOpen ? 'w-[260px]' : 'w-24'} 
      bg-[#090b11] text-slate-300 flex flex-col h-screen sticky top-0 z-40 transition-all duration-300 border-r border-white/5 shadow-2xl`}
    >
      {/* Logo Area */}
      <div className={`flex items-center justify-center h-20 shrink-0 border-b border-white/[0.05] bg-black/20 ${isOpen ? 'px-6' : 'px-2'}`}>
         {isOpen ? (
           <Link href="/admin" className="relative group cursor-pointer w-full flex justify-center items-center">
             {/* Glow effect */}
             <div className="absolute -inset-4 bg-green-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <img src="/เดอะนัท1.png" alt="The Nut Yangyont" className="w-full max-w-[160px] object-contain relative z-10 transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
           </Link>
         ) : (
           <Link href="/admin" className="relative group cursor-pointer flex justify-center items-center">
             <div className="absolute -inset-2 bg-green-500/30 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <img src="/เดอะนัท1.png" alt="The Nut" className="w-12 object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
           </Link>
         )}
      </div>

      {/* Menu List */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-4 space-y-1 sidebar-scroll"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <style>{`
          .sidebar-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div className="space-y-6 mt-4">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <div className={`text-[11px] font-bold text-slate-500/70 uppercase tracking-widest mb-3 ${!isOpen && 'text-center hidden'}`}>
                {isOpen ? group.title : ''}
              </div>
              
              <ul className="space-y-1.5">
                {group.items.map((item, idx) => (
                  <li key={idx}>
                    <Link 
                      href={item.href || "#"} 
                      title={!isOpen ? item.label : undefined}
                      className={`flex items-center gap-3.5 py-3 rounded-lg transition-all duration-300 text-[14px] font-medium group relative
                        ${item.active 
                          ? 'bg-gradient-to-r from-green-500/15 to-transparent text-green-400' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:translate-x-1'
                        }
                        ${isOpen ? 'px-4' : 'justify-center px-0'}
                      `}
                    >
                      {/* Active Indicator Line */}
                      {item.active && isOpen && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                      )}
                      
                      {/* Active Indicator Dot (Collapsed) */}
                      {item.active && !isOpen && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                      )}

                      <div className={`
                        ${item.active ? 'text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'text-slate-400 group-hover:text-slate-200'} 
                        transition-all duration-300
                        ${!isOpen && item.active ? 'scale-110' : ''}
                      `}>
                        {item.icon}
                      </div>
                      
                      {isOpen && (
                        <>
                          <span className="flex-1 whitespace-nowrap tracking-wide">{item.label}</span>
                          {item.hasSub && (
                            <ChevronRight size={16} className={`${item.active ? 'text-green-500' : 'text-slate-600 group-hover:text-slate-400'} transition-colors`} />
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Help Center */}
      <div className="p-4 mt-auto">
        <div className={`bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-md rounded-xl flex items-center gap-3.5 border border-white/5 cursor-pointer hover:border-green-500/30 hover:bg-slate-800/60 transition-all duration-300 group
          ${isOpen ? 'p-4' : 'p-3 justify-center'}
        `}>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 p-2.5 rounded-lg text-green-400 group-hover:scale-110 group-hover:text-green-300 transition-all duration-300 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]">
            <HeadphonesIcon size={isOpen ? 22 : 24} />
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-slate-200 whitespace-nowrap group-hover:text-white transition-colors">ศูนย์ช่วยเหลือ</div>
              <div className="text-xs text-slate-500 whitespace-nowrap mt-0.5 group-hover:text-slate-400 transition-colors">ติดต่อทีมงาน</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
