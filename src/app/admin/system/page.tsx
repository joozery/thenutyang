import { Shield, Database, Users, Key, RefreshCw, HardDrive, Clock, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import mongoose from 'mongoose';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SystemPage() {
  await connectDB();

  // Fetch admin users
  const adminUsers = await AdminUser.find().sort({ lastLoginAt: -1 }).limit(5).lean();

  // Aggregate user counts by role
  const rolesAggregation = await AdminUser.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);

  const roleCounts: Record<string, number> = {};
  rolesAggregation.forEach((r: any) => {
    roleCounts[r._id] = r.count;
  });

  const totalUsers = adminUsers.length; // Actually total fetched, but we can do a full count
  const actualTotalUsers = await AdminUser.countDocuments();

  const dbStatus = mongoose.connection.readyState === 1 ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ';
  const isConnected = mongoose.connection.readyState === 1;

  const systemInfo = [
    { label: "เวอร์ชั่นระบบ", value: "v1.2.0", icon: <CheckCircle size={16} className="text-emerald-500" /> },
    { label: "ฐานข้อมูล", value: `MongoDB (${dbStatus})`, icon: isConnected ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-amber-500" /> },
    { label: "การอัปเดตล่าสุด", value: "อัปเดตแล้ว", icon: <CheckCircle size={16} className="text-emerald-500" /> },
    { label: "ผู้ใช้งานทั้งหมด", value: `${actualTotalUsers} บัญชี`, icon: <Users size={16} className="text-blue-500" /> },
  ];

  const roleDefinitions = [
    { role: "superadmin", label: "ผู้ดูแลระบบสูงสุด", perms: "เข้าถึงและจัดการทุกส่วนของระบบได้", color: "bg-red-100 text-red-700" },
    { role: "admin", label: "ผู้ดูแลระบบ", perms: "จัดการข้อมูลทั่วไป ยกเว้นตั้งค่าระบบขั้นสูง", color: "bg-green-100 text-green-700" },
    { role: "manager", label: "ผู้จัดการ", perms: "ดูรายงานและการจัดการสินค้า", color: "bg-purple-100 text-purple-700" },
    { role: "staff", label: "พนักงาน", perms: "ดูข้อมูลลูกค้าและการขาย", color: "bg-blue-100 text-blue-700" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">ตั้งค่าระบบ</h1>
        <p className="text-sm text-slate-500 mt-1">จัดการข้อมูลระบบ, ฐานข้อมูล, และตรวจสอบการทำงาน</p>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><HardDrive size={16} className="text-slate-500" />สถานะระบบ</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemInfo.map((info) => (
            <div key={info.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100/60">
              <div className="flex items-center gap-2 mb-1">{info.icon}<span className="text-xs text-slate-500 font-medium">{info.label}</span></div>
              <p className="text-sm font-bold text-slate-800">{info.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Management Overview */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><Users size={16} className="text-blue-500" />ผู้ดูแลระบบล่าสุด</h2>
            <Link href="/admin/users" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight size={14} /></Link>
          </div>
          <div className="divide-y divide-slate-50 flex-1">
            {adminUsers.map((u: any) => {
              let dateStr = "ยังไม่เคยเข้าสู่ระบบ";
              if (u.lastLoginAt) {
                dateStr = new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(u.lastLoginAt));
              }
              
              const status = u.isActive !== false ? "เปิดใช้งาน" : "ระงับ";

              return (
                <div key={u._id.toString()} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                    {(u.displayName?.[0] || u.username[0] || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{u.displayName || u.username}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email || '@' + u.username}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status === 'เปิดใช้งาน' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{status}</span>
                    <p className="text-[10px] text-slate-400 mt-1">{dateStr}</p>
                  </div>
                </div>
              );
            })}
            {adminUsers.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">ไม่พบข้อมูลผู้ดูแลระบบ</div>
            )}
          </div>
        </div>

        {/* Role Permissions */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><Shield size={16} className="text-purple-500" />สิทธิ์การใช้งานระบบ</h2>
            <button className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1">จัดการ <ChevronRight size={14} /></button>
          </div>
          <div className="divide-y divide-slate-50 flex-1">
            {roleDefinitions.map((r) => {
              const count = roleCounts[r.role] || 0;
              return (
                <button key={r.role} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors text-left">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 ${r.color} w-24 text-center truncate`}>{r.label}</span>
                  <span className="text-xs text-slate-500 flex-1 line-clamp-1">{r.perms}</span>
                  <span className="text-xs font-semibold text-slate-700 shrink-0 bg-slate-100 px-2 py-0.5 rounded-full">{count} บัญชี</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-900 flex items-center gap-2"><RefreshCw size={16} className="text-amber-500" />การบำรุงรักษาระบบ</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { label: "สำรองข้อมูลฐานข้อมูล", desc: "ดาวน์โหลดข้อมูลจาก MongoDB", icon: <Database size={16} />, color: "text-blue-600 bg-blue-50 border-blue-100", action: "ดำเนินการ" },
            { label: "ล้าง Cache ของระบบ", desc: "ช่วยให้ระบบทำงานได้เร็วขึ้นเมื่อมีการเปลี่ยนแปลงข้อมูล", icon: <RefreshCw size={16} />, color: "text-amber-600 bg-amber-50 border-amber-100", action: "ล้างแคช" },
            { label: "ประวัติการทำงาน (Logs)", desc: "ดูประวัติข้อผิดพลาดและการใช้งานระบบทั้งหมด", icon: <Clock size={16} />, color: "text-slate-600 bg-slate-50 border-slate-200", action: "ดูประวัติ" },
            { label: "จัดการ API Keys", desc: "สร้างหรือเพิกถอน API Key สำหรับการเชื่อมต่อภายนอก", icon: <Key size={16} />, color: "text-purple-600 bg-purple-50 border-purple-100", action: "จัดการ" },
          ].map((action) => (
            <div key={action.label} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${action.color}`}>
                {action.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">{action.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{action.desc}</p>
              </div>
              <button className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0">
                {action.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
