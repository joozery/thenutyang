import { Search, Plus, Phone, UserCircle, MoreHorizontal, ChevronLeft, ChevronRight, Shield } from 'lucide-react';

const staff = [
  { id: "EMP-001", name: "สมศักดิ์ ทองดี", role: "ช่างยาง", phone: "081-111-2222", startDate: "1 ม.ค. 2563", status: "ทำงาน", salary: 18000, serviced: 342 },
  { id: "EMP-002", name: "วิชัย มานะดี", role: "ช่างยาง", phone: "089-333-4444", startDate: "15 มี.ค. 2564", status: "ทำงาน", salary: 17000, serviced: 298 },
  { id: "EMP-003", name: "ประทีป สุขใจ", role: "ช่างตั้งศูนย์", phone: "082-555-6666", startDate: "1 มิ.ย. 2562", status: "ทำงาน", salary: 20000, serviced: 512 },
  { id: "EMP-004", name: "อรพิน ศรีนวล", role: "แคชเชียร์", phone: "091-777-8888", startDate: "1 ก.พ. 2565", status: "ทำงาน", salary: 15000, serviced: 0 },
  { id: "EMP-005", name: "สุรชัย พรมแดน", role: "ช่างยาง", phone: "083-999-0000", startDate: "10 ส.ค. 2566", status: "ทำงาน", salary: 16000, serviced: 87 },
  { id: "EMP-006", name: "มาลี วงศ์สวัสดิ์", role: "ธุรการ / บัญชี", phone: "095-123-4567", startDate: "1 เม.ย. 2563", status: "ลาพัก", salary: 18000, serviced: 0 },
];

const roleColor: Record<string, string> = {
  "ช่างยาง": "bg-slate-100 text-slate-600",
  "ช่างตั้งศูนย์": "bg-slate-100 text-slate-600",
  "แคชเชียร์": "bg-slate-100 text-slate-600",
  "ธุรการ / บัญชี": "bg-slate-100 text-slate-600",
};

export default function StaffPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">พนักงาน</h1>
          <p className="text-sm text-slate-500 mt-1">ทั้งหมด {staff.length} คน</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors w-fit">
          <Plus size={16} /> เพิ่มพนักงาน
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "พนักงานทั้งหมด", value: "6" },
          { label: "กำลังทำงาน", value: "5" },
          { label: "ลาพัก", value: "1" },
          { label: "ค่าแรงรวมเดือนนี้", value: "฿104K" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="ค้นหาชื่อพนักงาน..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400" />
          </div>
          <select className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-rose-400">
            <option>ตำแหน่ง: ทั้งหมด</option>
            <option>ช่างยาง</option>
            <option>ช่างตั้งศูนย์</option>
            <option>แคชเชียร์</option>
            <option>ธุรการ</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="text-left px-4 py-3">พนักงาน</th>
                <th className="text-left px-4 py-3">ตำแหน่ง</th>
                <th className="text-left px-4 py-3">เบอร์โทร</th>
                <th className="text-left px-4 py-3">วันเริ่มงาน</th>
                <th className="text-right px-4 py-3">เงินเดือน</th>
                <th className="text-center px-4 py-3">งานที่ทำ</th>
                <th className="text-center px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
                        <UserCircle size={22} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleColor[s.role] ?? 'bg-slate-100 text-slate-600'}`}>{s.role}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1.5 text-slate-600"><Phone size={13} />{s.phone}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">{s.startDate}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-800">฿{s.salary.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-center text-slate-600">{s.serviced > 0 ? `${s.serviced} คัน` : '-'}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.status === 'ทำงาน' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><MoreHorizontal size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">แสดง 1–6 จาก 6 รายการ</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"><ChevronLeft size={14} /></button>
            <button className="w-8 h-8 rounded-lg text-sm font-medium bg-rose-600 text-white">1</button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
