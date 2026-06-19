import { Shield, Database, Users, Key, RefreshCw, HardDrive, Clock, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

const users = [
  { name: "สมชาย แอดมิน", email: "admin@thenutyang.com", role: "ผู้ดูแลระบบ", lastLogin: "วันนี้ 09:14", status: "ออนไลน์" },
  { name: "อรพิน ศรีนวล", email: "arpin@thenutyang.com", role: "แคชเชียร์", lastLogin: "วันนี้ 08:30", status: "ออนไลน์" },
  { name: "สมศักดิ์ ทองดี", email: "somsak@thenutyang.com", role: "ช่าง", lastLogin: "เมื่อวาน 17:45", status: "ออฟไลน์" },
];

const systemInfo = [
  { label: "เวอร์ชั่นระบบ", value: "v1.0.0", icon: <CheckCircle size={16} className="text-emerald-500" /> },
  { label: "ฐานข้อมูล", value: "PostgreSQL 15.2", icon: <CheckCircle size={16} className="text-emerald-500" /> },
  { label: "สำรองข้อมูลล่าสุด", value: "วันนี้ 02:00 น.", icon: <CheckCircle size={16} className="text-emerald-500" /> },
  { label: "พื้นที่ใช้งาน", value: "2.4 GB / 10 GB", icon: <AlertTriangle size={16} className="text-amber-500" /> },
];

export default function SystemPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">ตั้งค่าระบบ</h1>
        <p className="text-sm text-slate-500 mt-1">จัดการผู้ใช้งาน, สิทธิ์, ฐานข้อมูล</p>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><HardDrive size={16} />สถานะระบบ</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemInfo.map((info) => (
            <div key={info.label} className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">{info.icon}<span className="text-xs text-slate-400">{info.label}</span></div>
              <p className="text-sm font-bold text-slate-800">{info.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Management */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><Users size={16} />ผู้ใช้งานระบบ</h2>
            <button className="text-sm text-green-600 font-medium hover:underline">+ เพิ่มผู้ใช้</button>
          </div>
          <div className="divide-y divide-slate-50">
            {users.map((u) => (
              <div key={u.email} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm shrink-0">{u.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.status === 'ออนไลน์' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.status}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{u.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Permissions */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><Shield size={16} />สิทธิ์การใช้งาน</h2>
            <button className="text-sm text-green-600 font-medium hover:underline">จัดการ</button>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { role: "ผู้ดูแลระบบ", perms: "เข้าถึงทุกส่วน", users: 1, color: "bg-green-100 text-green-700" },
              { role: "ผู้จัดการ", perms: "ยกเว้นตั้งค่าระบบ", users: 0, color: "bg-purple-100 text-purple-700" },
              { role: "แคชเชียร์", perms: "POS, บิล, ลูกค้า", users: 1, color: "bg-blue-100 text-blue-700" },
              { role: "ช่าง", perms: "ดูรถ, ดูสินค้า", users: 3, color: "bg-emerald-100 text-emerald-700" },
            ].map((r) => (
              <button key={r.role} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${r.color}`}>{r.role}</span>
                <span className="text-xs text-slate-400 flex-1">{r.perms}</span>
                <span className="text-xs text-slate-500 font-medium shrink-0">{r.users} คน</span>
                <ChevronRight size={14} className="text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">การดำเนินการระบบ</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { label: "สำรองข้อมูลทันที", desc: "สำรองข้อมูลทั้งหมดลง Cloud", icon: <Database size={16} />, color: "text-blue-600", action: "ดำเนินการ" },
            { label: "ล้าง Cache", desc: "ล้างข้อมูลชั่วคราวในระบบ", icon: <RefreshCw size={16} />, color: "text-amber-600", action: "ล้าง" },
            { label: "ประวัติการเข้าใช้งาน", desc: "ดูประวัติการ Login และกิจกรรมทั้งหมด", icon: <Clock size={16} />, color: "text-slate-500", action: "ดูประวัติ" },
            { label: "รีเซ็ตรหัสผ่าน API", desc: "สร้าง API Key ใหม่สำหรับการเชื่อมต่อ", icon: <Key size={16} />, color: "text-purple-600", action: "รีเซ็ต" },
          ].map((action) => (
            <div key={action.label} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className={`w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center ${action.color} shrink-0`}>
                {action.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">{action.label}</p>
                <p className="text-xs text-slate-400">{action.desc}</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors shrink-0">
                {action.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
