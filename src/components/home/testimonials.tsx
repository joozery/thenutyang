import { Star } from "lucide-react";

export function Testimonials() {
  const reviews = [
    {
      id: 1,
      name: "คุณธนพล พ.",
      location: "ลูกค้าจาก กรุงเทพฯ",
      review: "บริการดี รวดเร็ว พนักงานอธิบายละเอียด ราคาดีกว่าที่อื่น แนะนำเลยครับ",
      avatar: "https://placehold.co/100x100/e2e8f0/64748b?text=U"
    },
    {
      id: 2,
      name: "คุณวรรณิดา ป.",
      location: "ลูกค้าจาก เชียงใหม่",
      review: "ยางคุณภาพดี จัดส่งไว ติดตั้งฟรีถึงบ้าน ประทับใจมากครับ",
      avatar: "https://placehold.co/100x100/e2e8f0/64748b?text=U"
    },
    {
      id: 3,
      name: "คุณอภิวัชร์ ว.",
      location: "ลูกค้าจาก ชลบุรี",
      review: "ผ่อน 0% นาน 10 เดือน ช่วยให้ตัดสินใจง่ายขึ้น แถมบริการหลังการขายดีมากค่ะ",
      avatar: "https://placehold.co/100x100/e2e8f0/64748b?text=U"
    }
  ];

  return (
    <section className="bg-slate-50 py-16">
      <div className="container mx-auto px-4 md:px-8">
        <div className="relative mb-8 text-center md:text-left inline-block">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 pb-2">เสียงจากลูกค้าของเรา</h2>
          <div className="absolute -bottom-1 left-0 w-12 h-1 bg-rose-600 rounded-full hidden md:block"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((item) => (
            <div key={item.id} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
              <div className="flex gap-1 mb-4 text-rose-500">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-8 flex-1">
                "{item.review}"
              </p>
              <div className="flex items-center gap-4">
                <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                  <p className="text-xs text-slate-500">{item.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-8">
          <button className="w-2.5 h-2.5 rounded-full bg-rose-600"></button>
          <button className="w-2.5 h-2.5 rounded-full bg-slate-300 hover:bg-slate-400 transition-colors"></button>
          <button className="w-2.5 h-2.5 rounded-full bg-slate-300 hover:bg-slate-400 transition-colors"></button>
        </div>
      </div>
    </section>
  );
}
