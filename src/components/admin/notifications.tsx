import { AlertCircle, Calendar, DollarSign, Droplet, UserMinus } from 'lucide-react';

export function Notifications() {
  const notifications = [
    {
      title: "สต๊อกยาง 205/55R16 ใกล้หมด",
      desc: "เหลือ 4 เส้น",
      time: "5 นาทีที่แล้ว",
      icon: <AlertCircle size={15} className="text-amber-600" />,
      bg: "bg-amber-50"
    },
    {
      title: "ครบกำหนดนัดลูกค้า 3 รายการ",
      desc: "วันนี้",
      time: "15 นาทีที่แล้ว",
      icon: <Calendar size={15} className="text-indigo-600" />,
      bg: "bg-indigo-50"
    },
    {
      title: "มีบิลค้างชำระ 2 รายการ",
      desc: "ยอดรวม ฿ 6,450",
      time: "1 ชั่วโมงที่แล้ว",
      icon: <DollarSign size={15} className="text-red-500" />,
      bg: "bg-red-50"
    },
    {
      title: "ใกล้ครบกำหนดเปลี่ยนน้ำมันเครื่อง",
      desc: "2 คัน",
      time: "2 ชั่วโมงที่แล้ว",
      icon: <Droplet size={15} className="text-sky-600" />,
      bg: "bg-sky-50"
    },
    {
      title: "พนักงานขอลาหยุด 1 รายการ",
      desc: "รอการอนุมัติ",
      time: "3 ชั่วโมงที่แล้ว",
      icon: <UserMinus size={15} className="text-violet-600" />,
      bg: "bg-violet-50"
    }
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800">การแจ้งเตือน</h3>
        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">ดูทั้งหมด →</button>
      </div>
      <div className="flex-1 flex flex-col gap-3.5">
        {notifications.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className={`${item.bg} p-2 rounded-lg shrink-0`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-800">{item.title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
            </div>
            <div className="text-[10px] text-slate-400 shrink-0">{item.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
