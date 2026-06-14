import { Search, Plus, FileText, Download, Eye, Clock, CheckCircle, XCircle, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const documents = [
  { id: "INV-2024-1023", type: "ใบเสร็จ", customer: "สมชาย ใจดี", date: "9 มิ.ย. 2567", amount: 12360, status: "ชำระแล้ว" },
  { id: "INV-2024-1022", type: "ใบเสร็จ", customer: "ประเสริฐ นาคทอง", date: "8 มิ.ย. 2567", amount: 15200, status: "ชำระแล้ว" },
  { id: "QT-2024-0089", type: "ใบเสนอราคา", customer: "บริษัท ABC จำกัด", date: "8 มิ.ย. 2567", amount: 48000, status: "รอตอบรับ" },
  { id: "INV-2024-1021", type: "ใบเสร็จ", customer: "ธนกร ศรีสุวรรณ", date: "7 มิ.ย. 2567", amount: 9800, status: "ชำระแล้ว" },
  { id: "CR-2024-0012", type: "ใบลดหนี้", customer: "นภาพร จันทร์หอม", date: "7 มิ.ย. 2567", amount: -500, status: "ออกแล้ว" },
  { id: "INV-2024-1020", type: "ใบเสร็จ", customer: "กัลยา รุ่งเรือง", date: "6 มิ.ย. 2567", amount: 6890, status: "ค้างชำระ" },
  { id: "QT-2024-0088", type: "ใบเสนอราคา", customer: "ห้างหุ้นส่วน XYZ", date: "5 มิ.ย. 2567", amount: 32000, status: "หมดอายุ" },
];

const typeStyle: Record<string, string> = {
  "ใบเสร็จ": "bg-blue-100 text-blue-700",
  "ใบเสนอราคา": "bg-purple-100 text-purple-700",
  "ใบลดหนี้": "bg-orange-100 text-orange-700",
};

const statusStyle: Record<string, { color: string; icon: React.ReactNode }> = {
  "ชำระแล้ว": { color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle size={11} /> },
  "รอตอบรับ": { color: "bg-amber-100 text-amber-700", icon: <Clock size={11} /> },
  "ค้างชำระ": { color: "bg-red-100 text-red-600", icon: <XCircle size={11} /> },
  "ออกแล้ว": { color: "bg-slate-100 text-slate-600", icon: <CheckCircle size={11} /> },
  "หมดอายุ": { color: "bg-slate-100 text-slate-400", icon: <XCircle size={11} /> },
};

export default function DocumentsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">บิล / เอกสาร</h1>
          <p className="text-sm text-slate-500 mt-1">เอกสารทั้งหมด 1,284 ฉบับ</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 w-fit">
            ใบเสนอราคา
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors w-fit">
            <Plus size={16} /> สร้างเอกสาร
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "ใบเสร็จเดือนนี้", value: "142", color: "text-slate-900" },
          { label: "ยอดรวมเดือนนี้", value: "฿892K", color: "text-rose-600" },
          { label: "ค้างชำระ", value: "8 บิล", color: "text-red-600" },
          { label: "รอตอบรับ", value: "5 ใบ", color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400" />
          </div>
          <select className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-rose-400">
            <option>ประเภท: ทั้งหมด</option>
            <option>ใบเสร็จ</option>
            <option>ใบเสนอราคา</option>
            <option>ใบลดหนี้</option>
          </select>
          <select className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-rose-400">
            <option>สถานะ: ทั้งหมด</option>
            <option>ชำระแล้ว</option>
            <option>ค้างชำระ</option>
            <option>รอตอบรับ</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="text-left px-4 py-3">เลขที่เอกสาร</th>
                <th className="text-left px-4 py-3">ประเภท</th>
                <th className="text-left px-4 py-3">ลูกค้า</th>
                <th className="text-right px-4 py-3">ยอดเงิน</th>
                <th className="text-left px-4 py-3">วันที่</th>
                <th className="text-center px-4 py-3">สถานะ</th>
                <th className="text-center px-4 py-3">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {documents.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3.5 font-bold text-rose-600 flex items-center gap-2">
                    <FileText size={14} className="text-slate-400 shrink-0" />{d.id}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeStyle[d.type]}`}>{d.type}</span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">{d.customer}</td>
                  <td className={`px-4 py-3.5 text-right font-bold ${d.amount < 0 ? 'text-orange-600' : 'text-slate-800'}`}>
                    {d.amount < 0 ? `-฿${Math.abs(d.amount).toLocaleString()}` : `฿${d.amount.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">{d.date}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[d.status].color}`}>
                      {statusStyle[d.status].icon}{d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="ดู"><Eye size={14} /></button>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="ดาวน์โหลด"><Download size={14} /></button>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><MoreHorizontal size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">แสดง 1–7 จาก 1,284 รายการ</span>
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
