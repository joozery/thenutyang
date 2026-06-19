import connectDB from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { BookingsTable } from '@/components/admin/bookings-table';
import { ClipboardList } from 'lucide-react';

export const metadata = { title: 'การจอง | Admin' };
export const dynamic = 'force-dynamic';

const STATUS_FILTER = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const;
const STATUS_LABEL: Record<string, string> = {
  all: 'ทั้งหมด',
  pending: 'รอดำเนินการ',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
};

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = STATUS_FILTER.includes(status as typeof STATUS_FILTER[number]) ? status : 'all';

  await connectDB();
  const query = activeStatus && activeStatus !== 'all' ? { status: activeStatus } : {};
  const raw = await Booking.find(query).sort({ createdAt: -1 }).lean();

  const bookings = raw.map(b => ({
    _id: b._id.toString(),
    ref: b.ref,
    tireName: b.tireName,
    tirePrice: b.tirePrice,
    quantity: b.quantity,
    name: b.name,
    phone: b.phone,
    lineId: b.lineId,
    lineUserId: b.lineUserId,
    carModel: b.carModel,
    carYear: b.carYear,
    appointmentDate: b.appointmentDate,
    note: b.note,
    status: b.status,
    createdAt: (b.createdAt as Date).toISOString(),
  }));

  const counts = await Booking.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const countMap: Record<string, number> = { all: raw.length };
  for (const c of counts) countMap[c._id] = c.count;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">การจอง</h1>
            <p className="text-xs text-slate-500">จัดการการจองและส่งใบเสนอราคาผ่าน LINE</p>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
          ทั้งหมด {bookings.length} รายการ
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {STATUS_FILTER.map(s => (
          <a
            key={s}
            href={s === 'all' ? '/admin/bookings' : `/admin/bookings?status=${s}`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
              ${activeStatus === s
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-green-200 hover:text-green-600'
              }`}
          >
            {STATUS_LABEL[s]}
            {countMap[s] !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black
                ${activeStatus === s ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {s === 'all' ? raw.length : (countMap[s] ?? 0)}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> เชื่อมต่อ LINE แล้ว
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> ยังไม่เชื่อมต่อ LINE
        </span>
        <span className="hidden md:block">
          กดปุ่ม <span className="text-slate-600 font-medium">▾</span> เพื่อดูรายละเอียด
        </span>
      </div>

      <BookingsTable bookings={bookings} />
    </div>
  );
}
