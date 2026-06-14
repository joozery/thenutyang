import { ShoppingCart, UserPlus, PackagePlus, Download, BarChart2 } from 'lucide-react';

export function RecentInvoices() {
  const invoices = [
    { id: "INV670509-001", customer: "คุณวรวิทย์ แสงทอง",              amount: "฿ 8,950",  status: "ชำระแล้ว",  time: "09:42 น.", isPaid: true },
    { id: "INV670509-002", customer: "คุณสุภาภรณ์ ใจดี",               amount: "฿ 12,650", status: "ชำระแล้ว",  time: "09:15 น.", isPaid: true },
    { id: "INV670509-003", customer: "คุณธนพล มณีโชติ",                amount: "฿ 5,600",  status: "ชำระแล้ว",  time: "08:56 น.", isPaid: true },
    { id: "INV670509-004", customer: "บริษัท เอส.พี. การขนส่ง จำกัด", amount: "฿ 15,800", status: "ค้างชำระ",  time: "08:33 น.", isPaid: false },
    { id: "INV670509-005", customer: "คุณกฤษฎา พัฒนสุข",               amount: "฿ 3,450",  status: "ชำระแล้ว",  time: "08:12 น.", isPaid: true },
  ];

  const quickActions = [
    { icon: <ShoppingCart size={18} />, label: "เปิดบิลขาย\n(POS)", primary: true },
    { icon: <UserPlus size={18} />,    label: "เพิ่มลูกค้า\nใหม่",  primary: false },
    { icon: <PackagePlus size={18} />, label: "เพิ่มสินค้า",       primary: false },
    { icon: <Download size={18} />,    label: "รับสินค้า\nเข้า",    primary: false },
    { icon: <BarChart2 size={18} />,   label: "รายงาน\nยอดขาย",    primary: false },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800">บิลขายล่าสุด</h3>
        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">ดูทั้งหมด →</button>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-3 text-xs font-bold text-slate-500">เลขบิล</th>
              <th className="pb-3 text-xs font-bold text-slate-500">ลูกค้า</th>
              <th className="pb-3 text-xs font-bold text-slate-500 text-right">ยอดรวม</th>
              <th className="pb-3 text-xs font-bold text-slate-500 text-center">สถานะ</th>
              <th className="pb-3 text-xs font-bold text-slate-500 text-right">เวลา</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, idx) => (
              <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="py-3 text-xs text-slate-500 font-mono">{inv.id}</td>
                <td className="py-3 text-xs font-medium text-slate-700">{inv.customer}</td>
                <td className="py-3 text-xs font-bold text-slate-900 text-right">{inv.amount}</td>
                <td className="py-3 text-center">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    inv.isPaid
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="py-3 text-xs text-slate-400 text-right">{inv.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-4">
        {quickActions.map((action, idx) => (
          <button key={idx} className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 transition-colors text-center
            ${action.primary
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {action.icon}
            <span className="text-[10px] font-bold leading-tight whitespace-pre-line">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
