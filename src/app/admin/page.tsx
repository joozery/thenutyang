'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, FileText, Package, CalendarCheck, AlertTriangle, Loader2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface DashboardData {
  summary: {
    todayRevenue: number;
    yesterdayRevenue: number;
    revenueTrend: string | null;
    todayBills: number;
    yesterdayBills: number;
    billTrend: number;
    monthRevenue: number;
    pendingBookings: number;
    todayBookings: number;
    totalProducts: number;
    totalStock: number;
  };
  recentInvoices: {
    id: string;
    docNumber: string;
    customerName: string;
    grandTotal: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
  }[];
  lowStock: {
    id: string;
    name: string;
    stock: number;
    category: string;
  }[];
  chartData: { month: string; revenue: number; count: number }[];
  categoryData: { name: string; count: number; stock: number }[];
}

const PIE_COLORS = ['#16a34a','#2563eb','#d97706','#7c3aed','#0891b2'];
const CATEGORY_LABELS: Record<string, string> = {
  touring: 'ยางทัวริ่ง',
  sport: 'ยางสปอร์ต',
  eco: 'ยางประหยัด',
  suv: 'ยาง SUV',
  allseason: 'ยาง All-Season',
};

function fmt(n: number) {
  return n.toLocaleString('th-TH');
}

function getStatusLabel(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    paid:    { label: 'ชำระแล้ว', cls: 'bg-green-50 text-green-700' },
    unpaid:  { label: 'ค้างชำระ',  cls: 'bg-red-50 text-red-600' },
    voided:  { label: 'ยกเลิก',    cls: 'bg-slate-100 text-slate-500' },
    draft:   { label: 'ร่าง',       cls: 'bg-yellow-50 text-yellow-600' },
  };
  return map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-500' };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('โหลดข้อมูลไม่ได้'); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-3" />กำลังโหลดข้อมูล...
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center h-64 text-red-400 gap-2">
      <AlertTriangle size={20} />{error || 'ไม่พบข้อมูล'}
    </div>
  );

  const { summary, recentInvoices, lowStock, chartData, categoryData } = data;

  const summaryCards = [
    {
      title: 'ยอดขายวันนี้',
      value: `฿${fmt(summary.todayRevenue)}`,
      trend: summary.revenueTrend
        ? `${Number(summary.revenueTrend) >= 0 ? '▲' : '▼'} ${Math.abs(Number(summary.revenueTrend))}% จากเมื่อวาน`
        : 'ยังไม่มียอดเมื่อวาน',
      trendUp: Number(summary.revenueTrend ?? 0) >= 0,
      icon: <DollarSign size={18} />,
      iconClass: 'text-indigo-600', iconBg: 'bg-indigo-50',
    },
    {
      title: 'บิลขายวันนี้',
      value: `${summary.todayBills} บิล`,
      trend: `${summary.billTrend >= 0 ? '▲' : '▼'} ${Math.abs(summary.billTrend)} บิล จากเมื่อวาน`,
      trendUp: summary.billTrend >= 0,
      icon: <FileText size={18} />,
      iconClass: 'text-blue-600', iconBg: 'bg-blue-50',
    },
    {
      title: 'ยอดขายเดือนนี้',
      value: `฿${fmt(summary.monthRevenue)}`,
      trend: 'ยอดสะสมเดือนปัจจุบัน',
      trendUp: true, isNeutral: true,
      icon: <TrendingUp size={18} />,
      iconClass: 'text-emerald-600', iconBg: 'bg-emerald-50',
    },
    {
      title: 'การจองรออนุมัติ',
      value: `${summary.pendingBookings} รายการ`,
      trend: `จองใหม่วันนี้ ${summary.todayBookings} ราย`,
      trendUp: false, isNeutral: true,
      icon: <CalendarCheck size={18} />,
      iconClass: 'text-violet-600', iconBg: 'bg-violet-50',
    },
    {
      title: 'สินค้าทั้งหมด',
      value: `${fmt(summary.totalProducts)} SKU`,
      trend: `คงคลัง ${fmt(summary.totalStock)} ชิ้น`,
      trendUp: true, isNeutral: true,
      icon: <Package size={18} />,
      iconClass: 'text-slate-600', iconBg: 'bg-slate-100',
    },
  ];

  const now = new Date();
  const thDate = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
          <div className="text-sm text-slate-500 font-medium mt-1">ข้อมูล ณ วันที่ {thDate}</div>
        </div>
        <button
          onClick={() => { setLoading(true); fetch('/api/admin/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false); }); }}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <Loader2 size={14} /> รีเฟรชข้อมูล
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className={`${card.iconBg} w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.iconClass}`}>
              {card.icon}
            </div>
            <p className="text-xs text-slate-400 font-medium mb-1">{card.title}</p>
            <div className="text-xl font-black text-slate-900 leading-tight">{card.value}</div>
            <div className={`text-xs font-medium mt-1.5 ${card.isNeutral ? 'text-slate-400' : (card.trendUp ? 'text-emerald-600' : 'text-red-500')}`}>
              {card.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800">ยอดขาย 6 เดือนล่าสุด</h3>
            <span className="text-xs text-slate-400">จากใบแจ้งหนี้ที่ชำระแล้ว</span>
          </div>
          {chartData.every(d => d.revenue === 0) ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">ยังไม่มีข้อมูลยอดขาย</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `฿${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => [`฿${fmt(v)}`, 'ยอดขาย']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#colorRev)" dot={{ fill: '#16a34a', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Pie */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-5">สัดส่วนสินค้า</h3>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">ยังไม่มีสินค้า</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="name">
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend formatter={v => CATEGORY_LABELS[v] ?? v} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [v, CATEGORY_LABELS[n as string] ?? n]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800">บิลล่าสุด</h3>
            <a href="/admin/documents" className="text-xs font-semibold text-green-600 hover:text-green-700">ดูทั้งหมด →</a>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">ยังไม่มีบิล</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-xs font-bold text-slate-500 text-left">เลขบิล</th>
                    <th className="pb-3 text-xs font-bold text-slate-500 text-left">ลูกค้า</th>
                    <th className="pb-3 text-xs font-bold text-slate-500 text-right">ยอดรวม</th>
                    <th className="pb-3 text-xs font-bold text-slate-500 text-center">สถานะ</th>
                    <th className="pb-3 text-xs font-bold text-slate-500 text-right">วันที่</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map(inv => {
                    const st = getStatusLabel(inv.status);
                    return (
                      <tr key={inv.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 text-xs text-slate-500 font-mono">{inv.docNumber}</td>
                        <td className="py-3 text-xs font-medium text-slate-700 max-w-[140px] truncate">{inv.customerName}</td>
                        <td className="py-3 text-xs font-bold text-slate-900 text-right">฿{fmt(inv.grandTotal)}</td>
                        <td className="py-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="py-3 text-xs text-slate-400 text-right">
                          {new Date(inv.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              สินค้าใกล้หมด
            </h3>
            <a href="/admin/products" className="text-xs font-semibold text-green-600 hover:text-green-700">จัดการ →</a>
          </div>
          {lowStock.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">✅ สินค้าทุกรายการมีเพียงพอ</div>
          ) : (
            <div className="space-y-3">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${p.stock === 0 ? 'bg-red-500' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{CATEGORY_LABELS[p.category] ?? p.category}</p>
                  </div>
                  <span className={`text-xs font-black shrink-0 ${p.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                    {p.stock === 0 ? 'หมด' : `${p.stock} เส้น`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-400 mt-8 mb-2 flex justify-between">
        <span>© 2024 เดอะนัทยางยนต์ สงวนลิขสิทธิ์ทุกประการ</span>
        <span>เวอร์ชั่น 1.0.0</span>
      </div>
    </div>
  );
}
