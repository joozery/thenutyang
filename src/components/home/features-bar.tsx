import { CheckCircle2, BadgeDollarSign, CreditCard, Truck, RefreshCw } from "lucide-react";

export function FeaturesBar() {
  const features = [
    { icon: <CheckCircle2 className="w-7 h-7" />, title: "ยางแท้ 100%", desc: "รับประกันจากบริษัท" },
    { icon: <BadgeDollarSign className="w-7 h-7" />, title: "ราคาดีที่สุด", desc: "เช็คให้ชัวร์ทุกวัน" },
    { icon: <CreditCard className="w-7 h-7" />, title: "ผ่อน 0%", desc: "สูงสุด 10 เดือน" },
    { icon: <Truck className="w-7 h-7" />, title: "บริการนอกสถานที่", desc: "ถึงบ้านคุณ" },
    { icon: <RefreshCw className="w-7 h-7" />, title: "คืนสินค้าภายใน", desc: "7 วัน" },
  ];

  return (
    <section className="w-full relative z-10 -mt-8 md:-mt-12 mb-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-slate-100 p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 divide-x divide-slate-100">
            {features.map((feature, idx) => (
              <div key={idx} className={`flex items-center gap-4 ${idx !== 0 ? 'pl-6' : ''}`}>
                <div className="text-green-600 shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{feature.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
