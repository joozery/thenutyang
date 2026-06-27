import { Check, ShieldCheck, RefreshCw, AlertCircle, Settings, Wind } from 'lucide-react';
import Link from 'next/link';
import { AfterSales } from '@/components/home/after-sales';
import { OurServices } from '@/components/home/our-services';
import connectDB from '@/lib/mongodb';
import { Service } from '@/models/Service';

export const metadata = { title: 'บริการหลังการขาย | THENUTTIRE' };

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  await connectDB();
  const servicesData = await Service.find().sort({ order: 1, createdAt: -1 }).lean();
  const services = JSON.parse(JSON.stringify(servicesData));

  return (
    <div className="bg-slate-50 min-h-screen overflow-hidden">
      <OurServices />

      <div className="py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-8">

        <AfterSales services={services} />

        {/* CTA Section */}
        <div className="mt-16 max-w-[1400px] mx-auto bg-green-600 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl shadow-green-600/20">
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
    </div>
  );
}
