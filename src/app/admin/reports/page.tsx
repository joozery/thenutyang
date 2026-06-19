import { BarChart2, TrendingUp, Download, Calendar, Users, Package, DollarSign, Car } from 'lucide-react';

const monthlySales = [
  { month: "ม.ค.", revenue: 620000, orders: 89 },
  { month: "ก.พ.", revenue: 540000, orders: 76 },
  { month: "มี.ค.", revenue: 710000, orders: 102 },
  { month: "เม.ย.", revenue: 680000, orders: 95 },
  { month: "พ.ค.", revenue: 750000, orders: 108 },
  { month: "มิ.ย.", revenue: 892000, orders: 124 },
];

const topProducts = [
  { name: "Maxxis MA-P5 185/70R14", sold: 210, revenue: 396900 },
  { name: "Michelin Energy XM2+ 195/65R15", sold: 142, revenue: 410380 },
  { name: "Goodyear Assurance 195/65R15", sold: 119, revenue: 320110 },
  { name: "Bridgestone Ecopia EP300 205/55R16", sold: 98, revenue: 322420 },
  { name: "Yokohama BluEarth AE01 185/65R15", sold: 87, revenue: 216630 },
];

const maxRevenue = Math.max(...monthlySales.map(m => m.revenue));

export default function ReportsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">รายงาน</h1>
          <p className="text-sm text-slate-500 mt-1">ภาพรวมธุรกิจ ปี 2567</p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400">
            <option>6 เดือนล่าสุด</option>
            <option>ปีนี้</option>
            <option>ปีที่แล้ว</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 w-fit">
            <Download size={15} /> ส่งออกรายงาน
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "รายได้รวม (YTD)", value: "฿4.19M", change: "+22%", icon: <DollarSign size={18} /> },
          { label: "บิลทั้งหมด", value: "594", change: "+18%", icon: <BarChart2 size={18} /> },
          { label: "ลูกค้าใหม่", value: "89", change: "+12%", icon: <Users size={18} /> },
          { label: "ยางที่ขาย", value: "1,248 เส้น", change: "+28%", icon: <Package size={18} /> },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500">{kpi.icon}</div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{kpi.change}</span>
            </div>
            <p className="text-xl font-black text-slate-900 mb-0.5">{kpi.value}</p>
            <p className="text-xs text-slate-400">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bar Chart (CSS-only) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-900">รายได้รายเดือน</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>รายได้
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {monthlySales.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600">฿{(m.revenue/1000).toFixed(0)}K</span>
                <div className="w-full bg-green-100 rounded-t-lg relative overflow-hidden" style={{ height: `${(m.revenue / maxRevenue) * 120}px` }}>
                  <div className="absolute inset-0 bg-green-500 rounded-t-lg" />
                </div>
                <span className="text-xs text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-bold text-slate-900 mb-4">สินค้าขายดี</h2>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className={`text-xs font-black w-5 shrink-0 mt-0.5 ${i === 0 ? 'text-amber-500' : 'text-slate-400'}`}>#{i+1}</span>
                    <p className="text-xs font-medium text-slate-700 leading-snug">{p.name}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-800 shrink-0">{p.sold} เส้น</span>
                </div>
                <div className="ml-7 w-full bg-slate-100 rounded-full h-1">
                  <div className="bg-green-500 h-1 rounded-full" style={{ width: `${(p.sold / topProducts[0].sold) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "รายงานยอดขาย", icon: <TrendingUp size={20} /> },
          { label: "รายงานสต๊อก", icon: <Package size={20} /> },
          { label: "รายงานลูกค้า", icon: <Users size={20} /> },
          { label: "รายงานรถเข้าบริการ", icon: <Car size={20} /> },
        ].map((r) => (
          <button key={r.label} className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col items-center gap-3 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-slate-500">{r.icon}</div>
            <span className="text-sm font-semibold text-slate-700 text-center leading-snug">{r.label}</span>
            <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Download size={11} />ดาวน์โหลด</span>
          </button>
        ))}
      </div>
    </div>
  );
}
