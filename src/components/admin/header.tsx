'use client';

import { Menu, Search, Bell, MessageSquare, ChevronDown, LogOut, User } from 'lucide-react';
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
        <div className="flex items-center gap-3">
          <Link href="/admin/notifications" className="relative text-slate-500 hover:text-green-600 transition-colors p-2 hover:bg-green-50 rounded-lg">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 bg-green-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white translate-x-1/2 -translate-y-1/2">1</span>
          </Link>
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
