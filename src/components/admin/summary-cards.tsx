import { DollarSign, TrendingUp, FileText, Users, Circle } from 'lucide-react';

export function SummaryCards() {
  const cards = [
    {
      title: "ยอดขายวันนี้",
      value: "฿ 128,450",
      trend: "▲ 18.5% จากเมื่อวาน",
      trendUp: true,
      icon: <DollarSign size={18} />,
      iconClass: "text-indigo-600",
      iconBg: "bg-indigo-50",
    },
    {
      title: "กำไรขั้นต้นวันนี้",
      value: "฿ 32,650",
      trend: "▲ 14.3% จากเมื่อวาน",
      trendUp: true,
      icon: <TrendingUp size={18} />,
      iconClass: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      title: "บิลขายวันนี้",
      value: "32 บิล",
      trend: "▲ 8 บิล จากเมื่อวาน",
      trendUp: true,
      icon: <FileText size={18} />,
      iconClass: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      title: "ลูกค้าใหม่วันนี้",
      value: "12 ราย",
      trend: "▲ 4 ราย จากเมื่อวาน",
      trendUp: true,
      icon: <Users size={18} />,
      iconClass: "text-violet-600",
      iconBg: "bg-violet-50",
    },
    {
      title: "สินค้าขายดีวันนี้",
      value: "ยาง 185/55R16",
      trend: "ขายแล้ว 18 เส้น",
      trendUp: false,
      icon: <Circle size={18} />,
      iconClass: "text-slate-600",
      iconBg: "bg-slate-100",
      isNeutral: true
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className={`${card.iconBg} w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.iconClass}`}>
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
  );
}
