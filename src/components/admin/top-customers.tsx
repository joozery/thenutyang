export function TopCustomers() {
  const customers = [
    { rank: 1, name: "บริษัท เอส.พี. การขนส่ง จำกัด", amount: "฿ 78,650" },
    { rank: 2, name: "คุณวรวิทย์ แสงทอง",               amount: "฿ 45,230" },
    { rank: 3, name: "คุณกฤษฎา พัฒนสุข",                amount: "฿ 32,450" },
    { rank: 4, name: "บริษัท ทรัพย์ไพศาล คาร์แคร์ จำกัด", amount: "฿ 28,900" },
    { rank: 5, name: "คุณธนพล มณีโชติ",                 amount: "฿ 18,750" },
  ];

  const rankColors = ['bg-amber-400', 'bg-slate-400', 'bg-orange-400', 'bg-slate-200', 'bg-slate-200'];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800">ลูกค้ายอดซื้อสูงสุด</h3>
        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">ดูทั้งหมด →</button>
      </div>
      
      <div className="flex-1 flex flex-col gap-3">
        {customers.map((cust, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className={`${rankColors[idx]} w-6 h-6 rounded-full flex items-center justify-center shrink-0`}>
              <span className="text-[10px] font-black text-white">{cust.rank}</span>
            </div>
            <div className="flex-1 text-xs font-medium text-slate-700 truncate">{cust.name}</div>
            <div className="text-xs font-bold text-slate-900 shrink-0">{cust.amount}</div>
          </div>
        ))}
      </div>

      <button className="w-full py-2.5 mt-5 text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
        ดูรายงานลูกค้า
      </button>
    </div>
  );
}
