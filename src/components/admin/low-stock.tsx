export function LowStock() {
  const items = [
    { name: "ยาง 205/55R16",           brand: "Michelin Primacy 4",  stock: 4,  reorder: 10, unit: "เส้น", img: "/cover/cover.png" },
    { name: "ยาง 195/65R15",           brand: "Bridgestone T005A",   stock: 6,  reorder: 10, unit: "เส้น", img: "/cover/bridgestone.png" },
    { name: "ยาง 265/60R18",           brand: "Bridgestone HT684",   stock: 3,  reorder: 5,  unit: "เส้น", img: "/cover/bridgestone.png" },
    { name: "แม็ก Lenso Jager Craft",  brand: "18x9.0 6H139.7",      stock: 2,  reorder: 4,  unit: "วง",   img: "/yang/31.png" },
    { name: "น้ำมันเครื่อง Mobil 1",   brand: "5W-30",               stock: 4,  reorder: 10, unit: "ลิตร", img: "/yang/percent.png" },
  ];

  const getStockColor = (stock: number, reorder: number) => {
    const pct = stock / reorder;
    if (pct <= 0.3) return 'text-red-600 bg-red-50';
    if (pct <= 0.6) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800">สต๊อกใกล้หมด</h3>
        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">ดูทั้งหมด →</button>
      </div>
      
      <div className="flex-1 flex flex-col gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <img src={item.img} alt={item.name} className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{item.brand}</div>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${getStockColor(item.stock, item.reorder)}`}>
                {item.stock} {item.unit}
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5">/ {item.reorder} {item.unit}</div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full py-2.5 mt-4 text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
        จัดการสต๊อกสินค้า
      </button>
    </div>
  );
}
