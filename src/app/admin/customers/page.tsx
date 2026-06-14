import { Search, Plus, Phone, Car, FileText, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const customers = [
  { id: "C001", name: "สมชาย ใจดี", phone: "081-234-5678", cars: 2, totalBills: 12, totalSpent: 48500, lastVisit: "2 วันที่แล้ว", tag: "VIP" },
  { id: "C002", name: "วิภาพร มีสุข", phone: "089-876-5432", cars: 1, totalBills: 5, totalSpent: 15200, lastVisit: "1 สัปดาห์", tag: "ปกติ" },
  { id: "C003", name: "ประเสริฐ นาคทอง", phone: "062-111-2233", cars: 3, totalBills: 28, totalSpent: 112000, lastVisit: "เมื่อวาน", tag: "VIP" },
  { id: "C004", name: "นภาพร จันทร์หอม", phone: "095-555-6677", cars: 1, totalBills: 3, totalSpent: 8900, lastVisit: "3 สัปดาห์", tag: "ปกติ" },
  { id: "C005", name: "ธนกร ศรีสุวรรณ", phone: "083-999-1122", cars: 2, totalBills: 18, totalSpent: 67400, lastVisit: "4 วันที่แล้ว", tag: "VIP" },
  { id: "C006", name: "กัลยา รุ่งเรือง", phone: "091-777-8899", cars: 1, totalBills: 7, totalSpent: 22300, lastVisit: "2 สัปดาห์", tag: "ปกติ" },
  { id: "C007", name: "ชัยวัฒน์ พรมดี", phone: "086-333-4455", cars: 2, totalBills: 9, totalSpent: 31200, lastVisit: "5 วันที่แล้ว", tag: "ปกติ" },
  { id: "C008", name: "มาลี สุขสบาย", phone: "080-222-3344", cars: 1, totalBills: 2, totalSpent: 5800, lastVisit: "1 เดือน", tag: "ใหม่" },
];

const tagColor: Record<string, string> = {
  VIP: "bg-rose-50 text-rose-600",
  ปกติ: "bg-slate-100 text-slate-500",
  ใหม่: "bg-slate-100 text-slate-600",
};

export default function CustomersPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">ลูกค้า</h1>
          <p className="text-sm text-slate-500 mt-1">ทั้งหมด 284 ราย</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors w-fit">
          <Plus size={16} /> เพิ่มลูกค้าใหม่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "ลูกค้าทั้งหมด", value: "284", sub: "+12 เดือนนี้" },
          { label: "ลูกค้า VIP", value: "48", sub: "ยอดซื้อ >50,000 บาท" },
          { label: "ลูกค้าใหม่", value: "23", sub: "เดือนนี้" },
          { label: "ยอดขายเฉลี่ย/ราย", value: "฿8,420", sub: "ต่อครั้ง" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400 font-medium mb-1">{s.label}</p>
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="ค้นหาชื่อ, เบอร์โทร..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400" />
          </div>
          <select className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-rose-400">
            <option>ประเภทลูกค้า: ทั้งหมด</option>
            <option>VIP</option>
            <option>ปกติ</option>
            <option>ใหม่</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="text-left px-4 py-3">ลูกค้า</th>
                <th className="text-left px-4 py-3">เบอร์โทร</th>
                <th className="text-center px-4 py-3">รถ</th>
                <th className="text-center px-4 py-3">บิลทั้งหมด</th>
                <th className="text-right px-4 py-3">ยอดซื้อรวม</th>
                <th className="text-left px-4 py-3">ซื้อล่าสุด</th>
                <th className="text-center px-4 py-3">ประเภท</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm shrink-0">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1.5 text-slate-600"><Phone size={13} />{c.phone}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="flex items-center justify-center gap-1 text-slate-600"><Car size={13} />{c.cars}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="flex items-center justify-center gap-1 text-slate-600"><FileText size={13} />{c.totalBills}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-800">฿{c.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-slate-500">{c.lastVisit}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tagColor[c.tag]}`}>{c.tag}</span>
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
          <span className="text-xs text-slate-400">แสดง 1–8 จาก 284 รายการ</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"><ChevronLeft size={14} /></button>
            {[1,2,3].map(n => <button key={n} className={`w-8 h-8 rounded-lg text-sm font-medium ${n===1?'bg-rose-600 text-white':'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{n}</button>)}
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
