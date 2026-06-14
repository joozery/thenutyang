"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function CategoryChart() {
  const data = [
    { name: 'ยางรถยนต์',    value: 72450,  color: '#4f46e5' }, // indigo
    { name: 'แม็ก & ล้อ',  value: 25600,  color: '#0ea5e9' }, // sky
    { name: 'บริการ',       value: 18300,  color: '#10b981' }, // emerald
    { name: 'น้ำมันเครื่อง',value: 7200,   color: '#f59e0b' }, // amber
    { name: 'อื่นๆ',        value: 4900,   color: '#cbd5e1' }, // slate
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
      <h3 className="font-bold text-slate-800 mb-6">สัดส่วนยอดขาย</h3>
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="w-40 h-40 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={78}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`฿ ${Number(v).toLocaleString()}`]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-slate-500 font-bold">รวม</span>
            <span className="text-lg font-black text-slate-800 leading-tight">128K</span>
            <span className="text-[10px] text-slate-500 font-bold">บาท</span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }}></div>
              <div className="text-xs text-slate-700 font-medium">{item.name}</div>
              <div className="text-[10px] text-slate-400 ml-auto pl-4">{((item.value / 128450) * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
