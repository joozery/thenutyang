'use client';

import { useTransition, useState } from 'react';
import { sendLineQuote, confirmBooking, markReady, cancelBooking } from '@/app/actions/admin';
import { MessageCircle, CheckCircle, Package, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

type Booking = {
  _id: string;
  ref: string;
  tireName: string;
  tirePrice: number;
  quantity: number;
  name: string;
  phone: string;
  lineId: string;
  lineUserId?: string;
  carModel: string;
  carYear: string;
  appointmentDate: string;
  note: string;
  status: string;
  createdAt: string;
};

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending:   { label: 'รอดำเนินการ', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed: { label: 'ยืนยันแล้ว',  className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  completed: { label: 'เสร็จสิ้น',   className: 'bg-green-50 text-green-700 border border-green-200' },
  cancelled: { label: 'ยกเลิก',      className: 'bg-slate-50 text-slate-500 border border-slate-200' },
};

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        showToast('สำเร็จ', true);
      } else {
        showToast(res.error ?? 'เกิดข้อผิดพลาด', false);
      }
    });
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
        <p className="text-slate-400">ยังไม่มีการจอง</p>
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold text-white transition-all
          ${toast.ok ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.ok ? '✅ ' : '❌ '}{toast.msg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3.5 text-xs font-bold text-slate-500">หมายเลขจอง</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-500">ลูกค้า</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-500 hidden md:table-cell">สินค้า</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-500 hidden lg:table-cell">วันนัด</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-500 text-center">LINE</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-500 text-center">สถานะ</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-500 text-center">จัดการ</th>
              <th className="px-2 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <>
                <tr key={b._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-green-600 font-bold">{b.ref}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(b.createdAt).toLocaleDateString('th-TH')}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-slate-800">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.phone}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-xs text-slate-700 font-medium max-w-[180px] truncate">{b.tireName}</p>
                    <p className="text-xs text-slate-400">{b.quantity} เส้น · ฿{(b.tirePrice * b.quantity).toLocaleString()}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <p className="text-xs text-slate-700">
                      {new Date(b.appointmentDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {b.lineUserId ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-green-400" title="เชื่อมต่อ LINE แล้ว" />
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-slate-300" title="ยังไม่เชื่อมต่อ LINE" />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[b.status]?.className}`}>
                      {STATUS_STYLE[b.status]?.label ?? b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* ส่งใบเสนอราคา LINE */}
                      <button
                        onClick={() => run(() => sendLineQuote(b.ref))}
                        disabled={isPending || !b.lineUserId}
                        title={b.lineUserId ? 'ส่งใบเสนอราคาผ่าน LINE' : 'ลูกค้ายังไม่เชื่อมต่อ LINE'}
                        className="p-1.5 rounded-lg bg-[#06C755]/10 text-[#06C755] hover:bg-[#06C755]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      {/* ยืนยัน */}
                      {b.status === 'pending' && (
                        <button
                          onClick={() => run(() => confirmBooking(b.ref))}
                          disabled={isPending}
                          title="ยืนยันการจอง"
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {/* สินค้าพร้อม */}
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => run(() => markReady(b.ref))}
                          disabled={isPending}
                          title="สินค้าพร้อม / เสร็จสิ้น"
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                      )}

                      {/* ยกเลิก */}
                      {(b.status === 'pending' || b.status === 'confirmed') && (
                        <button
                          onClick={() => {
                            if (confirm(`ยกเลิกการจอง ${b.ref} ใช่ไหม?`)) {
                              run(() => cancelBooking(b.ref));
                            }
                          }}
                          disabled={isPending}
                          title="ยกเลิกการจอง"
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3.5">
                    <button
                      onClick={() => setExpanded(expanded === b._id ? null : b._id)}
                      className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {expanded === b._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>

                {/* Expanded row */}
                {expanded === b._id && (
                  <tr key={`${b._id}-expand`} className="bg-slate-50/50 border-b border-slate-100">
                    <td colSpan={8} className="px-5 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-slate-400 mb-0.5">รุ่นรถ</p>
                          <p className="font-medium text-slate-700">{b.carModel} ปี {b.carYear}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-0.5">LINE ID (ที่กรอก)</p>
                          <p className="font-medium text-slate-700">@{b.lineId}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-0.5">LINE User ID</p>
                          <p className="font-mono text-slate-700 truncate">{b.lineUserId ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-0.5">หมายเหตุ</p>
                          <p className="font-medium text-slate-700">{b.note || '—'}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
