import { Wrench, ShieldCheck, PenTool, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'บริการของเรา | THENUTTIRE' };

const SERVICES = [
  {
    title: 'เปลี่ยนยาง ถ่วงล้อ',
    desc: 'บริการเปลี่ยนยางใหม่และถ่วงล้อด้วยเครื่องมือมาตรฐานสูง เพื่อความนุ่มนวลและยืดอายุการใช้งาน',
    icon: <Wrench className="w-8 h-8 text-green-600" />,
    features: ['ถอด-ใส่ยางด้วยเครื่องถนอมแม็กซ์', 'ถ่วงล้อระบบดิจิตอล', 'เติมลมไนโตรเจนฟรี'],
  },
  {
    title: 'ตั้งศูนย์ล้อ',
    desc: 'ปรับตั้งศูนย์ล้อรถยนต์ทุกประเภท ให้รถขับตรง พวงมาลัยนิ่ง ไม่กินยาง',
    icon: <PenTool className="w-8 h-8 text-green-600" />,
    features: ['ตั้งศูนย์ด้วยระบบคอมพิวเตอร์ 3D', 'ช่างผู้ชำนาญการ', 'ตรวจสอบช่วงล่างเบื้องต้นฟรี'],
  },
  {
    title: 'บริการหลังการขาย (ดูแลยาง)',
    desc: 'ดูแลยางที่คุณซื้อจากเราตลอดอายุการใช้งาน ให้คุณมั่นใจทุกเส้นทาง',
    icon: <ShieldCheck className="w-8 h-8 text-green-600" />,
    features: ['สลับยางฟรีทุก 10,000 กม.', 'ปะยางแทงใยไหมฟรี', 'รับประกันยางบวม แตก จากการผลิต'],
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">บริการของเรา</h1>
          <p className="text-slate-600 text-lg">มาตรฐานศูนย์บริการโดยช่างผู้เชี่ยวชาญ พร้อมเครื่องมือที่ทันสมัย</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-6">
                {s.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{s.title}</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">{s.desc}</p>
              
              <ul className="space-y-2 mb-6 border-t border-slate-100 pt-4">
                {s.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-green-600 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl shadow-green-600/20">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">ต้องการรับบริการ?</h2>
          <p className="text-green-50 mb-8 max-w-2xl mx-auto">สอบถามข้อมูลเพิ่มเติม หรือจองคิวเข้ารับบริการล่วงหน้าได้เลย เพื่อความสะดวกรวดเร็ว</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tires" className="bg-white text-green-600 hover:bg-green-50 font-bold px-8 py-3 rounded-xl transition-colors">
              ค้นหายางและจองคิว
            </Link>
            <a href="https://line.me/ti/p/~" target="_blank" rel="noreferrer" className="bg-green-700 text-white hover:bg-green-800 font-bold px-8 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              ติดต่อผ่าน LINE
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
