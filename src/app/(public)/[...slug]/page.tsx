import Link from 'next/link';
import { Clock, ArrowLeft } from 'lucide-react';

const PAGE_LABELS: Record<string, string> = {
  wheels: 'ล้อแม็ก',
  accessories: 'ของแต่ง',
  brakes: 'เบรค',
  shock: 'โช๊ค',
  oil: 'น้ำมันเครื่อง',
  battery: 'แบตเตอรี่',
  promotions: 'โปรโมชั่น',
  services: 'บริการของเรา',
  articles: 'บทความ',
  contact: 'ติดต่อเรา',
  faq: 'คำถามที่พบบ่อย',
  privacy: 'นโยบายความเป็นส่วนตัว',
  terms: 'เงื่อนไขการให้บริการ',
};

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug[0] ?? '';
  const label = PAGE_LABELS[key] ?? 'หน้านี้';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
        <Clock className="w-10 h-10 text-green-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{label}</h1>
      <p className="text-slate-500 mb-8 max-w-sm">
        กำลังอยู่ระหว่างการพัฒนา เร็วๆ นี้จะเปิดให้บริการค่ะ
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
