import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';

const transactions = [
  { date: "9 มิ.ย.", desc: "รับเงินจาก สมชาย ใจดี", ref: "INV-2024-1023", type: "in", amount: 12360 },
  { date: "9 มิ.ย.", desc: "รับเงินจาก ประเสริฐ นาคทอง", ref: "INV-2024-1022", type: "in", amount: 15200 },
  { date: "9 มิ.ย.", desc: "จ่ายค่าสินค้า มิชลิน ประเทศไทย", ref: "PO-2024-089", type: "out", amount: 52000 },
  { date: "8 มิ.ย.", desc: "รับเงินจาก ธนกร ศรีสุวรรณ", ref: "INV-2024-1021", type: "in", amount: 9800 },
  { date: "7 มิ.ย.", desc: "ค่าน้ำค่าไฟ", ref: "EXP-0089", type: "out", amount: 4200 },
  { date: "7 มิ.ย.", desc: "รับเงินจาก กัลยา รุ่งเรือง", ref: "INV-2024-1020", type: "in", amount: 6890 },
  { date: "6 มิ.ย.", desc: "ค่าเช่าที่", ref: "EXP-0088", type: "out", amount: 18000 },
];

export default function FinancePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">การเงิน</h1>
          <p className="text-sm text-slate-500 mt-1">ภาพรวมการเงิน — มิถุนายน 2567</p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-rose-400">
            <option>เดือนนี้</option>
            <option>เดือนที่แล้ว</option>
            <option>3 เดือนล่าสุด</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors w-fit">
            บันทึกรายการ
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">รายรับรวม</span>
            <div className="bg-slate-100 p-2 rounded-xl text-slate-500"><TrendingUp size={18} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 mb-1">฿892,450</p>
          <p className="text-slate-400 text-xs flex items-center gap-1"><ArrowUpRight size={12} className="text-emerald-500" />+18.4% จากเดือนที่แล้ว</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">รายจ่ายรวม</span>
            <div className="bg-slate-100 p-2 rounded-xl text-slate-500"><TrendingDown size={18} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 mb-1">฿612,800</p>
          <p className="text-slate-400 text-xs flex items-center gap-1"><ArrowDownRight size={12} />+8.2% จากเดือนที่แล้ว</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">กำไรสุทธิ</span>
            <div className="bg-rose-50 p-2 rounded-xl text-rose-600"><DollarSign size={18} /></div>
          </div>
          <p className="text-3xl font-black text-rose-600 mb-1">฿279,650</p>
          <p className="text-slate-400 text-xs flex items-center gap-1"><ArrowUpRight size={12} className="text-emerald-500" />+31.3% จากเดือนที่แล้ว</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">รายการล่าสุด</h2>
            <button className="text-sm text-rose-600 font-medium hover:underline">ดูทั้งหมด</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-4 py-3">วันที่</th>
                  <th className="text-left px-4 py-3">รายการ</th>
                  <th className="text-right px-4 py-3">จำนวนเงิน</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === 'in' ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                          {t.type === 'in' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-xs leading-snug">{t.desc}</p>
                          <p className="text-xs text-slate-400">{t.ref}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 text-right font-bold ${t.type === 'in' ? 'text-slate-800' : 'text-slate-500'}`}>
                      {t.type === 'in' ? '+' : '-'}฿{t.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <button className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><MoreHorizontal size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Income Breakdown */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">รายรับตามหมวด</h3>
            <div className="space-y-3">
              {[
                { label: "ขายยาง", amount: 642000, pct: 72 },
                { label: "ค่าบริการ", amount: 198000, pct: 22 },
                { label: "อุปกรณ์เสริม", amount: 52450, pct: 6 },
              ].map((cat) => (
                <div key={cat.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{cat.label}</span>
                    <span className="font-bold text-slate-800">฿{cat.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${cat.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">รายจ่ายตามหมวด</h3>
            <div className="space-y-3">
              {[
                { label: "ต้นทุนสินค้า", amount: 498000, pct: 81, color: "bg-slate-700" },
                { label: "ค่าแรง", amount: 68000, pct: 11, color: "bg-slate-400" },
                { label: "ค่าใช้จ่ายทั่วไป", amount: 46800, pct: 8, color: "bg-slate-300" },
              ].map((cat) => (
                <div key={cat.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{cat.label}</span>
                    <span className="font-bold text-slate-800">฿{cat.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`${cat.color} h-1.5 rounded-full`} style={{ width: `${cat.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
