import Link from "next/link";

export function News() {
  const articles = [
    {
      id: 1,
      title: "วิธีดูแลยางรถยนต์ ให้ใช้งานได้นาน และปลอดภัย",
      date: "12 พ.ค. 2567",
      category: "เกร็ดความรู้",
      image: "/news/news1.png"
    },
    {
      id: 2,
      title: "ตัวเลขบนแก้มยางบอกอะไรบ้าง มาดูกัน!",
      date: "8 พ.ค. 2567",
      category: "ความรู้เรื่องยาง",
      image: "/news/news2.png"
    },
    {
      id: 3,
      title: "รวมโปรโมชั่นยางและบริการ ประจำเดือนพฤษภาคม",
      date: "1 พ.ค. 2567",
      category: "โปรโมชั่น",
      image: "/news/news3.png"
    },
    {
      id: 4,
      title: "สัญญาณเตือน! ยางเสื่อมสภาพ ต้องเปลี่ยนเมื่อไหร่?",
      date: "25 เม.ย. 2567",
      category: "ความรู้เรื่องยาง",
      image: "/news/news4.png"
    }
  ];

  return (
    <section className="bg-slate-50 py-16 border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-end mb-8">
          <div className="relative inline-block">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 pb-2">บทความ & ข่าวสาร</h2>
            <div className="absolute -bottom-1 left-0 w-12 h-1 bg-rose-600 rounded-full hidden md:block"></div>
          </div>
          <Link href="/news" className="text-rose-600 font-bold text-sm hover:underline flex items-center gap-1">
            ดูทั้งหมด <span className="text-[10px]">&gt;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow group cursor-pointer flex flex-col h-full">
              <div className="relative h-48 overflow-hidden bg-slate-200">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-rose-600 text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 shadow-sm">
                  {item.category}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-slate-800 text-sm mb-4 leading-tight group-hover:text-rose-600 transition-colors flex-1">{item.title}</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-auto">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
