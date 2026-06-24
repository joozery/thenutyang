import connectDB from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { FinancialDocument } from '@/models/FinancialDocument';
import { BookingsTable } from '@/components/admin/bookings-table';
import { DatePickerFilter } from '@/components/admin/date-picker-filter';
import { ClipboardList, LayoutGrid } from 'lucide-react';

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
  searchParams: Promise<{ status?: string, page?: string, date?: string }>;
}) {
  const { status, page, date } = await searchParams;
  const activeStatus = STATUS_FILTER.includes(status as typeof STATUS_FILTER[number]) ? status : 'all';

  const currentPage = parseInt(page || '1', 10);
  const itemsPerPage = 10;

  await connectDB();
  const query: any = activeStatus && activeStatus !== 'all' ? { status: activeStatus } : {};
  if (date) {
    query.appointmentDate = date;
  }
  
  const totalItems = await Booking.countDocuments(query);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const raw = await Booking.find(query)
    .sort({ createdAt: -1 })
    .skip((validPage - 1) * itemsPerPage)
    .limit(itemsPerPage)
    .lean();

  const docs = await FinancialDocument.find(
    { bookingId: { $in: raw.map(b => b._id) } },
    { bookingId: 1 },
  ).lean();
  const quoteDocByBookingId = new Map(docs.map(d => [String(d.bookingId), String(d._id)]));

  const bookings = raw.map(b => ({
    _id: b._id.toString(),
    ref: b.ref,
    tireName: b.tireName,
    tirePrice: b.tirePrice,
    quantity: b.quantity,
    name: b.name,
    customerType: b.customerType ?? 'individual',
    companyName: b.companyName ?? '',
    phone: b.phone,
    lineId: b.lineId,
    lineUserId: b.lineUserId,
    carBrand: b.carBrand ?? '',
    carModel: b.carModel,
    carYear: b.carYear,
    licensePlate: b.licensePlate ?? '',
    mileageBefore: b.mileageBefore ?? null,
    mileageAfter: b.mileageAfter ?? null,
    address: b.address ?? '',
    taxId: b.taxId ?? '',
    appointmentDate: b.appointmentDate,
    note: b.note,
    status: b.status,
    createdAt: (b.createdAt as Date).toISOString(),
    quoteDocId: quoteDocByBookingId.get(b._id.toString()) ?? null,
  }));

  const matchStage: any = {};
  if (date) {
    matchStage.appointmentDate = date;
  }

  const counts = await Booking.aggregate([
    { $match: matchStage },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const totalAll = counts.reduce((acc, c) => acc + c.count, 0);
  const countMap: Record<string, number> = { all: totalAll };
  for (const c of counts) countMap[c._id] = c.count;

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">การจอง <span className="text-slate-400 font-normal ml-1 text-xl">/ Bookings</span></h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">จัดการรายการจองและส่งใบเสนอราคาผ่าน LINE</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-lg px-4 py-2">
            <LayoutGrid className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">ทั้งหมด <span className="text-green-600 font-bold ml-1">{totalAll}</span> รายการ</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
        
        {/* Toolbar & Filters */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex bg-slate-100/80 p-1 rounded-lg">
              {STATUS_FILTER.map(s => {
                const params = new URLSearchParams();
                if (s !== 'all') params.set('status', s);
                if (date) params.set('date', date);
                const href = `/admin/bookings${params.toString() ? `?${params.toString()}` : ''}`;
                return (
                  <a
                    key={s}
                    href={href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-bold whitespace-nowrap transition-all duration-200 group
                      ${activeStatus === s
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                  >
                    {STATUS_LABEL[s]}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black transition-colors
                      ${activeStatus === s ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'}`}>
                      {countMap[s] ?? 0}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <DatePickerFilter label="วันนัดหมาย" />
            
            <div className="flex items-center gap-4 text-[13px] text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200/60 shadow-sm font-medium w-fit">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06C755] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#06C755]"></span>
                </span>
                เชื่อมต่อ LINE
              </span>
              <div className="w-px h-4 bg-slate-200"></div>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> 
                ทั่วไป
              </span>
            </div>
          </div>
        </div>

        {/* Table Component */}
        <BookingsTable 
          bookings={bookings} 
          pagination={{
            currentPage: validPage,
            totalPages,
            totalItems,
            itemsPerPage
          }} 
        />
      </div>
    </div>
  );
}
