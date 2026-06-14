import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTireById } from '@/lib/tires';
import { BookingForm } from '@/components/booking/booking-form';

export const metadata = { title: 'จองยาง / ขอใบเสนอราคา | เดอะนัททายางยนต์' };

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ tireId?: string }>;
}) {
  const { tireId } = await searchParams;
  const tire = tireId ? getTireById(tireId) : undefined;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-2xl">
        {/* Back */}
        <Link
          href={tire ? `/tires/${tire.id}` : '/tires'}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-600 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {tire ? `กลับไปดู ${tire.model}` : 'กลับไปดูสินค้า'}
        </Link>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900">จองยาง / ขอใบเสนอราคา</h1>
            <p className="text-slate-500 text-sm mt-1">
              กรอกข้อมูลด้านล่าง ระบบจะส่งใบเสนอราคาให้ผ่าน LINE ทันที
            </p>
          </div>

          <BookingForm tire={tire} />
        </div>

        {/* Info box */}
        <div className="mt-6 bg-green-50 border border-green-100 rounded-xl p-4 flex gap-3">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#06C755] shrink-0 mt-0.5"><path d="M19.952 12.447c0-4.41-4.42-7.997-9.852-7.997S.248 8.037.248 12.447c0 3.95 3.503 7.264 8.236 7.888.32.07.757.21.867.484.1.247.065.634.032.883l-.14.84c-.042.247-.195.966.846.527 1.04-.44 5.613-3.306 7.656-5.659 1.41-1.548 2.207-3.12 2.207-4.963z"/></svg>
          <div>
            <p className="text-sm font-bold text-green-800">รับใบเสนอราคาผ่าน LINE</p>
            <p className="text-xs text-green-700 mt-1">
              ทีมงานจะส่งใบเสนอราคาพร้อมรายละเอียดราคา 1 เส้น / 4 เส้น และโปรโมชั่นที่มีอยู่ให้ทาง LINE ID ที่ระบุ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
