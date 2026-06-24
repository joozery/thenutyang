'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import Link from 'next/link';

interface AdminUser {
  displayName: string;
  username: string;
  role: string;
  avatar: string;
}

interface HeaderProps {
  toggleSidebar: () => void;
  adminUser: AdminUser;
}

function getRoleLabel(role: string) {
  if (role === 'super') return 'Super Admin';
  return 'Administrator';
}

export function AdminHeader({ toggleSidebar, adminUser }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-slate-500 hover:text-green-600 transition-colors p-2 hover:bg-green-50 rounded-lg active:scale-95"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <form action="/admin/customers" method="GET" className="relative hidden md:block w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            name="q"
            placeholder="ค้นหาลูกค้า, รหัส, เบอร์โทร..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all placeholder:text-slate-400"
          />
        </form>

        {/* Notifications */}
        <div className="relative flex items-center gap-3" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative transition-colors p-2 rounded-lg ${showNotifications ? 'bg-green-50 text-green-600' : 'text-slate-500 hover:text-green-600 hover:bg-green-50'}`}
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 bg-green-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white translate-x-1/2 -translate-y-1/2">1</span>
          </button>

          {showNotifications && (
            <div className="absolute top-[calc(100%+12px)] -right-2 md:-right-4 w-[280px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
              <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white">
                <h3 className="font-bold text-slate-800 text-xs">การแจ้งเตือน</h3>
                <span className="text-[10px] text-slate-500 cursor-pointer hover:text-green-600 font-medium">อ่านทั้งหมด</span>
              </div>
              <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-50">
                {/* Mock Notification Item 1 */}
                <Link href="/admin/payments" onClick={() => setShowNotifications(false)} className="flex gap-2.5 p-3 hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                    <span className="font-black text-[11px]">฿</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">มีสลิปมัดจำใหม่</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">ลูกค้ายื่นหลักฐานการโอนเงินมัดจำ</p>
                    <p className="text-[9px] text-slate-400 mt-1">ไม่กี่นาทีที่ผ่านมา</p>
                  </div>
                </Link>
                {/* Mock Notification Item 2 */}
                <Link href="/admin/bookings" onClick={() => setShowNotifications(false)} className="flex gap-2.5 p-3 hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <span className="font-black text-[11px]">N</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">รายการจองใหม่เข้า</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">มีลูกค้าระบุข้อมูลจองยางเข้ามาใหม่</p>
                    <p className="text-[9px] text-slate-400 mt-1">2 ชั่วโมงที่แล้ว</p>
                  </div>
                </Link>
              </div>
              <div className="p-2 border-t border-slate-100 text-center bg-slate-50/50">
                <Link href="/admin/payments" onClick={() => setShowNotifications(false)} className="text-[10px] font-bold text-slate-500 hover:text-green-600 transition-colors">
                  ดูการแจ้งเตือนทั้งหมด
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

        {/* Profile — link to profile page */}
        <Link href="/admin/profile" className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors">
          {adminUser.avatar ? (
            <img
              src={adminUser.avatar}
              alt={adminUser.displayName}
              className="w-9 h-9 rounded-full object-cover border-2 border-slate-100 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-sm border-2 border-green-100">
              {adminUser.displayName[0]?.toUpperCase() || <User size={16} />}
            </div>
          )}
          <div className="hidden md:block">
            <div className="text-sm font-bold text-slate-800 leading-none">{adminUser.displayName}</div>
            <div className="text-[11px] text-slate-500 mt-1 leading-none">{getRoleLabel(adminUser.role)}</div>
          </div>
          <ChevronDown size={14} className="text-slate-400 ml-1" />
        </Link>

        <form action={logout}>
          <button
            type="submit"
            title="ออกจากระบบ"
            className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
