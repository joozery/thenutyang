import { Search, Plus, Car, Wrench, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const vehicles = [
  { id: "V001", plate: "กข 1234 กทม", brand: "Toyota", model: "Camry", year: 2020, color: "ขาว", owner: "สมชาย ใจดี", lastService: "เปลี่ยนยาง Michelin", lastDate: "2 วันที่แล้ว", serviceCount: 8 },
  { id: "V002", plate: "กค 5678 กทม", brand: "Honda", model: "Civic", year: 2019, color: "เทา", owner: "วิภาพร มีสุข", lastService: "ตั้งศูนย์-ถ่วงล้อ", lastDate: "1 สัปดาห์", serviceCount: 3 },
  { id: "V003", plate: "งจ 9012 กทม", brand: "Isuzu", model: "D-Max", year: 2021, color: "ดำ", owner: "ประเสริฐ นาคทอง", lastService: "เปลี่ยนยาง Bridgestone", lastDate: "เมื่อวาน", serviceCount: 14 },
  { id: "V004", plate: "ชน 3456 นบ", brand: "Nissan", model: "Almera", year: 2018, color: "เงิน", owner: "นภาพร จันทร์หอม", lastService: "ปะยาง", lastDate: "3 สัปดาห์", serviceCount: 2 },
  { id: "V005", plate: "ดต 7890 กทม", brand: "Mazda", model: "CX-5", year: 2022, color: "น้ำเงิน", owner: "ธนกร ศรีสุวรรณ", lastService: "เปลี่ยนยาง Yokohama", lastDate: "4 วันที่แล้ว", serviceCount: 10 },
  { id: "V006", plate: "ถน 2345 สมท", brand: "Ford", model: "Ranger", year: 2020, color: "ขาว", owner: "ธนกร ศรีสุวรรณ", lastService: "เปลี่ยนน้ำมันเครื่อง", lastDate: "2 สัปดาห์", serviceCount: 5 },
];

export default function VehiclesPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">รถของลูกค้า</h1>
          <p className="text-sm text-slate-500 mt-1">ทั้งหมด 412 คัน</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors w-fit">
          <Plus size={16} /> เพิ่มข้อมูลรถ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "รถทั้งหมด", value: "412", icon: <Car size={20} /> },
          { label: "เข้ารับบริการเดือนนี้", value: "67", icon: <Wrench size={20} /> },
          { label: "รถที่ถึงกำหนดเปลี่ยนยาง", value: "23", icon: <Car size={20} /> },
          { label: "รถที่ไม่ได้เข้า >6 เดือน", value: "89", icon: <Car size={20} /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-500">{s.icon}</div>
            <div>
              <p className="text-xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="ค้นหาทะเบียน, เจ้าของ, ยี่ห้อรถ..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400" />
          </div>
          <select className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-rose-400">
            <option>ยี่ห้อ: ทั้งหมด</option>
            <option>Toyota</option>
            <option>Honda</option>
            <option>Isuzu</option>
            <option>Nissan</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="text-left px-4 py-3">ทะเบียน</th>
                <th className="text-left px-4 py-3">รถ</th>
                <th className="text-left px-4 py-3">เจ้าของ</th>
                <th className="text-left px-4 py-3">บริการล่าสุด</th>
                <th className="text-left px-4 py-3">วันที่ล่าสุด</th>
                <th className="text-center px-4 py-3">ครั้งทั้งหมด</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">{v.plate}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <Car size={15} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{v.brand} {v.model}</p>
                        <p className="text-xs text-slate-400">ปี {v.year} • {v.color}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs">{v.owner[0]}</div>
                      <span className="text-slate-700 font-medium">{v.owner}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{v.lastService}</td>
                  <td className="px-4 py-3.5 text-slate-500">{v.lastDate}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-bold text-slate-800">{v.serviceCount}</span>
                    <span className="text-slate-400 text-xs"> ครั้ง</span>
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
          <span className="text-xs text-slate-400">แสดง 1–6 จาก 412 รายการ</span>
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
