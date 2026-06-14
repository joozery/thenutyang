import { CalendarDays, Download, CheckCircle, Clock, MoreHorizontal } from 'lucide-react';

const payrollItems = [
  { name: "สมศักดิ์ ทองดี", role: "ช่างยาง", base: 18000, ot: 2400, bonus: 1000, deduct: 900, net: 20500, status: "จ่ายแล้ว" },
  { name: "วิชัย มานะดี", role: "ช่างยาง", base: 17000, ot: 1600, bonus: 500, deduct: 850, net: 18250, status: "จ่ายแล้ว" },
  { name: "ประทีป สุขใจ", role: "ช่างตั้งศูนย์", base: 20000, ot: 3200, bonus: 2000, deduct: 1000, net: 24200, status: "จ่ายแล้ว" },
  { name: "อรพิน ศรีนวล", role: "แคชเชียร์", base: 15000, ot: 0, bonus: 0, deduct: 750, net: 14250, status: "รอจ่าย" },
  { name: "สุรชัย พรมแดน", role: "ช่างยาง", base: 16000, ot: 800, bonus: 0, deduct: 800, net: 16000, status: "รอจ่าย" },
  { name: "มาลี วงศ์สวัสดิ์", role: "ธุรการ / บัญชี", base: 18000, ot: 0, bonus: 0, deduct: 3600, net: 14400, status: "รอจ่าย" },
];

export default function PayrollPage() {
  const totalNet = payrollItems.reduce((s, e) => s + e.net, 0);
  const paid = payrollItems.filter(e => e.status === 'จ่ายแล้ว').length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">เงินเดือน</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><CalendarDays size={13} />รอบเงินเดือน — มิถุนายน 2567</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 w-fit">
            <Download size={15} /> ส่งออก
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors w-fit">
            จ่ายเงินเดือนทั้งหมด
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "เงินเดือนรวม", value: `฿${totalNet.toLocaleString()}`, color: "text-slate-900" },
          { label: "จ่ายแล้ว", value: `${paid} คน`, color: "text-emerald-600" },
          { label: "รอจ่าย", value: `${payrollItems.length - paid} คน`, color: "text-amber-600" },
          { label: "OT รวม", value: `฿${payrollItems.reduce((s,e)=>s+e.ot,0).toLocaleString()}`, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">รายละเอียดเงินเดือน</h2>
          <select className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-rose-400">
            <option>มิถุนายน 2567</option>
            <option>พฤษภาคม 2567</option>
            <option>เมษายน 2567</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="text-left px-4 py-3">พนักงาน</th>
                <th className="text-right px-4 py-3">เงินเดือนพื้นฐาน</th>
                <th className="text-right px-4 py-3">OT</th>
                <th className="text-right px-4 py-3">โบนัส</th>
                <th className="text-right px-4 py-3 text-red-400">หัก</th>
                <th className="text-right px-4 py-3">รับสุทธิ</th>
                <th className="text-center px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payrollItems.map((e) => (
                <tr key={e.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm shrink-0">{e.name[0]}</div>
                      <div>
                        <p className="font-semibold text-slate-800">{e.name}</p>
                        <p className="text-xs text-slate-400">{e.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-600">฿{e.base.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right text-blue-600 font-medium">{e.ot > 0 ? `+฿${e.ot.toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3.5 text-right text-emerald-600 font-medium">{e.bonus > 0 ? `+฿${e.bonus.toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3.5 text-right text-red-500">-฿{e.deduct.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right font-black text-slate-900">฿{e.net.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${e.status === 'จ่ายแล้ว' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {e.status === 'จ่ายแล้ว' ? <CheckCircle size={11} /> : <Clock size={11} />}{e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><MoreHorizontal size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="px-4 py-3.5 font-bold text-slate-700">รวมทั้งสิ้น</td>
                <td className="px-4 py-3.5 text-right font-bold text-slate-700">฿{payrollItems.reduce((s,e)=>s+e.base,0).toLocaleString()}</td>
                <td className="px-4 py-3.5 text-right font-bold text-blue-600">+฿{payrollItems.reduce((s,e)=>s+e.ot,0).toLocaleString()}</td>
                <td className="px-4 py-3.5 text-right font-bold text-emerald-600">+฿{payrollItems.reduce((s,e)=>s+e.bonus,0).toLocaleString()}</td>
                <td className="px-4 py-3.5 text-right font-bold text-red-500">-฿{payrollItems.reduce((s,e)=>s+e.deduct,0).toLocaleString()}</td>
                <td className="px-4 py-3.5 text-right font-black text-slate-900 text-base">฿{totalNet.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
