"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export function SalesChart() {
  const data = [
    { name: '3 พ.ค.', value: 40000 },
    { name: '4 พ.ค.', value: 75000 },
    { name: '5 พ.ค.', value: 85000 },
    { name: '6 พ.ค.', value: 70000 },
    { name: '7 พ.ค.', value: 95000 },
    { name: '8 พ.ค.', value: 95000 },
    { name: '9 พ.ค.', value: 130000 },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800">กราฟยอดขาย</h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-md shadow-sm">รายวัน</button>
            <button className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700">รายสัปดาห์</button>
            <button className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700">รายเดือน</button>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => value.toLocaleString()} />
            <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} fill="url(#colorValue)" dot={{ fill: '#fff', stroke: '#4f46e5', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
