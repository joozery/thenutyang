import { cookies } from 'next/headers';
import { verifyCustomerToken, CUSTOMER_COOKIE } from '@/lib/customer-session';
import connectDB from '@/lib/mongodb';
import { Booking, IBooking } from '@/models/Booking';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package, Calendar, Car, ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';

export const metadata = { title: 'ประวัติการสั่งซื้อ | THENUTTIRE' };

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'รอยืนยัน', color: 'text-amber-600 bg-amber-50', icon: Clock },
  confirmed: { label: 'ยืนยันแล้ว', color: 'text-blue-600 bg-blue-50', icon: CheckCircle },
  completed: { label: 'เสร็จสิ้น', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  cancelled: { label: 'ยกเลิก', color: 'text-red-600 bg-red-50', icon: XCircle },
};

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('th-TH', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateOnly(date: string | Date) {
  return new Date(date).toLocaleDateString('th-TH', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
}

export default async function OrdersPage() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  const session = token ? await verifyCustomerToken(token) : null;
  
  if (!session) {
    redirect('/account');
  }

  await connectDB();
  const orders = await Booking.find({ lineUserId: session.lineUserId }).sort({ createdAt: -1 }).lean() as (IBooking & { _id: any })[];

  return (
    <div className="bg-slate-50 min-h-screen py-6 md:py-10">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/account" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-black text-slate-900">ประวัติการสั่งซื้อ</h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Package size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">ยังไม่มีประวัติการสั่งซื้อ</h3>
            <p className="text-slate-500 mb-6">เริ่มค้นหายางที่ใช่สำหรับรถของคุณเลย!</p>
            <Link href="/tires" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-colors">
              ค้นหายางรถยนต์
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const StatusIcon = status.icon;
              return (
                <div key={order.ref} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 transition-all hover:shadow-md group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-1">หมายเลขคำสั่งซื้อ</p>
                      <p className="font-mono font-bold text-slate-800 text-sm">#{order.ref}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {formatDate(order.createdAt)}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
                        <StatusIcon size={14} />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1">{order.tireName}</h4>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5"><Package size={14} /> {order.quantity} เส้น</span>
                          <span>·</span>
                          <span className="font-bold text-slate-700">฿{(order.tirePrice * order.quantity).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">ข้อมูลรถ</p>
                          <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                            <Car size={14} className="text-slate-400" />
                            {order.carModel} ({order.carYear})
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">วันนัดหมาย</p>
                          <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            {formatDateOnly(order.appointmentDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex md:flex-col justify-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                      <Link href={`https://line.me/R/ti/p/@${process.env.NEXT_PUBLIC_LINE_OA_ID ?? '131zpewj'}`} target="_blank"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#06C755]/10 text-[#06C755] hover:bg-[#06C755] hover:text-white border border-[#06C755] md:border-transparent font-bold py-2.5 px-4 rounded-xl text-sm transition-colors">
                        <svg role="img" viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg"><title>LINE</title><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.5 12 .5S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314z"/></svg>
                        สอบถามผ่าน LINE
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
