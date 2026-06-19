import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";

export function PopularTires() {
  const tires = [
    {
      id: 1,
      brand: "MICHELIN",
      model: "Primacy 4",
      size: "205/55R16",
      price: 3590,
      oldPrice: 4200,
      badge: "ขายดี",
      image: "/yang.png"
    },
    {
      id: 2,
      brand: "BRIDGESTONE",
      model: "Turanza T005A",
      size: "205/55R16",
      price: 3250,
      oldPrice: 4000,
      badge: "",
      image: "/yang.png"
    },
    {
      id: 3,
      brand: "YOKOHAMA",
      model: "BluEarth-GT AE51",
      size: "205/55R16",
      price: 2850,
      oldPrice: 3500,
      badge: "",
      image: "/yang.png"
    },
    {
      id: 4,
      brand: "DUNLOP",
      model: "SP Sport LM705",
      size: "205/55R16",
      price: 2690,
      oldPrice: 3400,
      badge: "ลด 15%",
      image: "/yang.png"
    }
  ];

  const getBrandLogo = (brandName: string) => {
    const logos: Record<string, string> = {
      "MICHELIN": "/brand/michelin-7-logo-svgrepo-com.svg",
      "BRIDGESTONE": "/brand/bridgestone-26989.svg",
      "YOKOHAMA": "/brand/yokohama-logo.svg",
      "DUNLOP": "/brand/dunlop-sport.svg",
      "GOODYEAR": "/brand/goodyear-tire-1.svg",
      "Continental": "/brand/continental-2-1.svg",
      "PIRELLI": "/brand/pirelli-2.svg",
    };
    return logos[brandName] || "";
  };

  return (
    <section className="w-full py-16 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-100 pb-4">
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 pb-2">ยางรถยนต์ยอดนิยม</h2>
            <div className="absolute -bottom-4 left-0 w-12 h-1 bg-green-600 rounded-full"></div>
          </div>
          
          <div className="flex overflow-x-auto gap-2 pb-2 w-full md:w-auto hide-scrollbar">
            <button className="px-5 py-1.5 rounded-full border border-green-600 bg-green-50 text-green-600 font-medium text-sm whitespace-nowrap">ยอดนิยม</button>
            <button className="px-5 py-1.5 text-slate-600 hover:text-slate-900 font-medium text-sm whitespace-nowrap">ขอบ 15 นิ้ว</button>
            <button className="px-5 py-1.5 text-slate-600 hover:text-slate-900 font-medium text-sm whitespace-nowrap">ขอบ 16 นิ้ว</button>
            <button className="px-5 py-1.5 text-slate-600 hover:text-slate-900 font-medium text-sm whitespace-nowrap">ขอบ 17 นิ้ว</button>
            <button className="px-5 py-1.5 text-slate-600 hover:text-slate-900 font-medium text-sm whitespace-nowrap">ขอบ 18 นิ้วขึ้นไป</button>
          </div>
          
          <button className="text-green-600 font-medium text-sm hover:underline hidden md:flex items-center gap-1 whitespace-nowrap">ดูทั้งหมด <span className="text-[10px]">&gt;</span></button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {tires.map((tire) => (
            <div key={tire.id} className="border border-slate-100 rounded-2xl p-3 md:p-5 hover:shadow-lg transition-shadow bg-white flex flex-col group min-h-[280px] md:min-h-[320px]">
              
              {/* Top Section: Image */}
              <div className="relative w-full h-28 md:h-40 flex items-center justify-center shrink-0 mb-3 md:mb-5">
                {tire.badge && (
                  <div className="absolute top-0 left-0 bg-green-600 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full z-10 shadow-sm">
                    {tire.badge}
                  </div>
                )}
                <img src={tire.image} alt={tire.model} className="h-full w-auto object-contain group-hover:scale-110 transition-transform duration-300" />
              </div>
              
              {/* Info Section */}
              <div className="flex-1 flex flex-col justify-start">
                <div className="h-4 md:h-6 mb-1.5 md:mb-2 flex items-center justify-start overflow-hidden">
                  <img 
                    src={getBrandLogo(tire.brand)} 
                    alt={tire.brand} 
                    className={`h-full w-auto object-contain ${["MICHELIN", "BRIDGESTONE", "PIRELLI"].includes(tire.brand) ? "scale-[1.8] md:scale-[2] origin-left" : "scale-100 md:scale-110 origin-left"}`} 
                  />
                </div>
                <h3 className="font-bold text-slate-800 text-[12px] md:text-base leading-tight mb-1 truncate" title={tire.model}>{tire.model}</h3>
                <p className="text-[10px] md:text-xs text-slate-400 mb-3">{tire.size}</p>
              </div>

              {/* Bottom Section: Price & Buttons */}
              <div className="mt-auto">
                <div className="flex flex-col md:flex-row md:items-end gap-0.5 md:gap-2 mb-3">
                  <span className="text-[14px] md:text-xl font-black text-green-600 leading-none">฿ {tire.price.toLocaleString()}</span>
                  {tire.oldPrice && (
                    <span className="text-[9px] md:text-[11px] text-slate-400 line-through leading-none md:mb-0.5">฿ {tire.oldPrice.toLocaleString()}</span>
                  )}
                </div>
                
                <div className="flex gap-1.5 md:gap-2">
                  <Link href={`/tires/${tire.id}`} className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[10px] md:text-xs py-2 shadow-sm transition-colors flex items-center justify-center">ดูรายละเอียด</Link>
                  <Link href={`/booking?tireId=${tire.id}`} className="w-8 md:w-9 flex items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 shrink-0 transition-colors">
                    <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
