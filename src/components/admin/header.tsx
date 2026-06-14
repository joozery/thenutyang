import { Menu, Search, Bell, MessageSquare, ChevronDown } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

export function AdminHeader({ toggleSidebar }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="text-slate-500 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded-lg active:scale-95"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden md:block w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="ค้นหาลูกค้า, เลขบิล, สินค้า..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-300 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Notifications & Messages */}
        <div className="flex items-center gap-3">
          <button className="relative text-slate-500 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded-lg">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white translate-x-1/2 -translate-y-1/2">5</span>
          </button>
          <button className="text-slate-500 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded-lg">
            <MessageSquare size={20} />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors">
          <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-slate-100 shadow-sm" />
          <div className="hidden md:block">
            <div className="text-sm font-bold text-slate-800 leading-none">ผู้ดูแลระบบ</div>
            <div className="text-[11px] text-slate-500 mt-1 leading-none">Administrator</div>
          </div>
          <ChevronDown size={14} className="text-slate-400 ml-1" />
        </div>
      </div>
    </header>
  );
}
