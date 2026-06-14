import { Search, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Package, MoreHorizontal } from 'lucide-react';

const stockMovements = [
  { date: "9 มิ.ย.", type: "in", item: "Michelin Energy XM2+ 195/65R15", qty: 20, ref: "PO-2024-089", by: "สมศักดิ์" },
  { date: "9 มิ.ย.", type: "out", item: "Bridgestone Ecopia EP300 205/55R16", qty: 4, ref: "INV-2024-1023", by: "ระบบ POS" },
  { date: "8 มิ.ย.", type: "out", item: "Maxxis MA-P5 185/70R14", qty: 8, ref: "INV-2024-1022", by: "ระบบ POS" },
  { date: "8 มิ.ย.", type: "in", item: "Yokohama BluEarth AE01 185/65R15", qty: 12, ref: "PO-2024-087", by: "สมศักดิ์" },
  { date: "7 มิ.ย.", type: "out", item: "Goodyear Assurance 195/65R15", qty: 4, ref: "INV-2024-1021", by: "ระบบ POS" },
  { date: "7 มิ.ย.", type: "out", item: "Continental ComfortContact CC7 205/65R16", qty: 4, ref: "INV-2024-1020", by: "ระบบ POS" },
];

const lowStockItems = [
  { name: "Dunlop SP Sport LM705 215/60R16", stock: 6, min: 8, brand: "Dunlop" },
  { name: "Continental ComfortContact CC7 205/65R16", stock: 4, min: 8, brand: "Continental" },
  { name: "Pirelli Cinturato P1 195/55R15", stock: 5, min: 6, brand: "Pirelli" },
];

export default function WarehousePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">คลังสินค้า</h1>
          <p className="text-sm text-slate-500 mt-1">ติดตามการเคลื่อนไหวสต๊อก</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-emerald-600 hover:bg-emerald-50 w-fit">
            <ArrowDownCircle size={16} /> รับสินค้าเข้า
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-rose-600 hover:bg-rose-50 w-fit">
            <ArrowUpCircle size={16} /> เบิกสินค้าออก
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "มูลค่าสต๊อกรวม", value: "฿482,400" },
          { label: "สินค้าใกล้หมด", value: "3 รายการ" },
          { label: "รับเข้าวันนี้", value: "20 ชิ้น" },
          { label: "เบิกออกวันนี้", value: "12 ชิ้น" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Movement Log */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">ประวัติการเคลื่อนไหว</h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="ค้นหา..." className="pl-8 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-rose-400 w-48" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-4 py-3">วันที่</th>
                  <th className="text-left px-4 py-3">ประเภท</th>
                  <th className="text-left px-4 py-3">สินค้า</th>
                  <th className="text-center px-4 py-3">จำนวน</th>
                  <th className="text-left px-4 py-3">อ้างอิง</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stockMovements.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{m.date}</td>
                    <td className="px-4 py-3.5">
                      {m.type === 'in'
                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full"><ArrowDownCircle size={11} />รับเข้า</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-100 px-2 py-1 rounded-full"><ArrowUpCircle size={11} />เบิกออก</span>
                      }
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800 text-xs leading-snug">{m.item}</p>
                      <p className="text-xs text-slate-400">โดย {m.by}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-800">{m.qty}</td>
                    <td className="px-4 py-3.5 text-xs text-rose-500 font-medium">{m.ref}</td>
                    <td className="px-4 py-3.5">
                      <button className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><MoreHorizontal size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="font-bold text-slate-900">สินค้าใกล้หมด</h2>
            </div>
            <div className="p-4 space-y-3">
              {lowStockItems.map((item) => (
                <div key={item.name} className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{item.name}</p>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full shrink-0">{item.stock} เหลือ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-amber-200 rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(item.stock / item.min) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-400">ขั้นต่ำ {item.min}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Package size={15} />สรุปสต๊อกวันนี้</h3>
            <div className="space-y-2.5">
              {[
                { label: "รับเข้าทั้งหมด", value: "+32 ชิ้น", color: "text-emerald-600" },
                { label: "เบิกออกทั้งหมด", value: "-16 ชิ้น", color: "text-rose-600" },
                { label: "คงเหลือสุทธิ", value: "+16 ชิ้น", color: "text-slate-900" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
