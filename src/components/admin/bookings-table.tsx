'use client';

import { useTransition, useState, Fragment } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { sendLineQuote, confirmBooking, markReady, cancelBooking, createQuoteForBooking } from '@/app/actions/admin';
import { CheckCircle, Package, XCircle, ChevronDown, ChevronUp, Calendar, Phone, Car, Tag, ChevronLeft, ChevronRight, Building2, MapPin, Hash, FileEdit, FileText } from 'lucide-react';

const LineIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>LINE</title>
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

type Booking = {
  _id: string;
  ref: string;
  tireName: string;
  tirePrice: number;
  quantity: number;
  name: string;
  customerType?: 'individual' | 'corporate';
  companyName?: string;
  phone: string;
  lineId: string;
  lineUserId?: string;
  carModel: string;
  carYear: string;
  address?: string;
  taxId?: string;
  appointmentDate: string;
  note: string;
  status: string;
  createdAt: string;
  quoteDocId?: string | null;
};

type PaginationData = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
};

const STATUS_STYLE: Record<string, { label: string; className: string; dot: string }> = {
  pending:   { label: 'รอดำเนินการ', className: 'bg-amber-50 text-amber-700 border-amber-200/50', dot: 'bg-amber-500' },
  confirmed: { label: 'ยืนยันแล้ว',  className: 'bg-blue-50 text-blue-700 border-blue-200/50', dot: 'bg-blue-500' },
  completed: { label: 'เสร็จสิ้น',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', dot: 'bg-emerald-500' },
  cancelled: { label: 'ยกเลิก',      className: 'bg-slate-50 text-slate-500 border-slate-200/50', dot: 'bg-slate-400' },
};

export function BookingsTable({ 
  bookings, 
  pagination 
}: { 
  bookings: Booking[],
  pagination?: PaginationData
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
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

  const handlePageChange = (newPage: number) => {
    if (!pagination) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white/50">
        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-5 shadow-sm">
          <Package className="w-10 h-10 text-slate-300" />
        </div>
        <p className="text-slate-600 font-bold text-lg mb-1">ยังไม่มีรายการจองในขณะนี้</p>
        <p className="text-slate-400 text-sm">รายการจองใหม่จะแสดงที่นี่โดยอัตโนมัติ</p>
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] text-sm font-bold text-white transition-all transform animate-in slide-in-from-bottom-5
          ${toast.ok ? 'bg-slate-900' : 'bg-red-500'}`}>
          <div className="flex items-center gap-3">
            {toast.ok ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-white" />}
            {toast.msg}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap md:whitespace-normal">
          <thead>
            <tr className="bg-white border-b border-slate-100">
              <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">หมายเลขจอง</th>
              <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">ลูกค้า</th>
              <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">สินค้า</th>
              <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">วันนัด</th>
              <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider text-center">LINE</th>
              <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
              <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider text-center">จัดการ</th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookings.map(b => {
              const isExpanded = expanded === b._id;
              return (
                <Fragment key={b._id}>
                  <tr 
                    className={`transition-colors duration-200 group
                      ${isExpanded ? 'bg-slate-50/80' : 'bg-white hover:bg-slate-50/50'}`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[13px] text-slate-800 font-bold bg-slate-100/80 px-2.5 py-1 rounded-md w-fit border border-slate-200/50">{b.ref}</span>
                        <span className="text-[11px] text-slate-400 font-medium pl-1 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(b.createdAt).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        {b.customerType === 'corporate' && b.companyName ? (
                          <>
                            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              {b.companyName}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">ติดต่อ: {b.name}</p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-slate-800">{b.name}</p>
                        )}
                        <p className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {b.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden md:table-cell">
                      <div className="flex flex-col">
                        <p className="text-[13px] text-slate-800 font-semibold max-w-[200px] truncate" title={b.tireName}>{b.tireName}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">{b.quantity} เส้น</span>
                          <span className="text-[12px] font-bold text-emerald-600">฿{(b.tirePrice * b.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden lg:table-cell">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/80 text-blue-700 border border-blue-100/60">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[13px] font-bold">
                          {new Date(b.appointmentDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center">
                        {b.lineUserId ? (
                          <div className="w-8 h-8 rounded-full bg-[#06C755]/10 flex items-center justify-center border border-[#06C755]/20" title="เชื่อมต่อ LINE แล้ว">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#06C755] shadow-[0_0_8px_rgba(6,199,85,0.4)]" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200" title="ยังไม่เชื่อมต่อ LINE">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full border ${STATUS_STYLE[b.status]?.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[b.status]?.dot}`}></span>
                        {STATUS_STYLE[b.status]?.label ?? b.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {/* ส่งใบเสนอราคา LINE */}
                        <button
                          onClick={() => run(() => sendLineQuote(b.ref))}
                          disabled={isPending || !b.lineUserId}
                          title={b.lineUserId ? 'ส่งใบเสนอราคาผ่าน LINE' : 'ลูกค้ายังไม่เชื่อมต่อ LINE'}
                          className="p-2.5 rounded-lg bg-[#06C755]/10 text-[#06C755] hover:bg-[#06C755] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-[#06C755]/20 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <LineIcon className="w-4 h-4" />
                        </button>

                        {/* ใบเสนอราคา */}
                        {b.quoteDocId ? (
                          <Link
                            href={`/admin/documents/${b.quoteDocId}/print`}
                            target="_blank"
                            title="ดูใบเสนอราคา"
                            className="p-2.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100/60 hover:bg-purple-600 hover:text-white hover:border-transparent transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                        ) : (
                          <button
                            onClick={() => run(() => createQuoteForBooking(b.ref))}
                            disabled={isPending}
                            title="สร้างใบเสนอราคา"
                            className="p-2.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100/60 hover:bg-purple-600 hover:text-white disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>
                        )}

                        {/* ยืนยัน */}
                        {b.status === 'pending' && (
                          <button
                            onClick={() => run(() => confirmBooking(b.ref))}
                            disabled={isPending}
                            title="ยืนยันการจอง"
                            className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/60 hover:bg-blue-600 hover:text-white hover:border-transparent disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0"
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
                            className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/60 hover:bg-emerald-500 hover:text-white hover:border-transparent disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                        )}

                        {/* ยกเลิก */}
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการยกเลิกการจอง ${b.ref} ใช่หรือไม่?`)) {
                                run(() => cancelBooking(b.ref));
                              }
                            }}
                            disabled={isPending}
                            title="ยกเลิกการจอง"
                            className="p-2.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 hover:bg-red-500 hover:text-white hover:border-transparent disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 active:translate-y-0 group-hover:bg-slate-100"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : b._id)}
                        className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ml-auto
                          ${isExpanded ? 'bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 group-hover:bg-slate-100'}`}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded row details */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={8} className="p-0 border-b border-slate-200">
                        <div className="px-6 py-6 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Car Detail (เฉพาะรายการเก่าที่มีข้อมูลรถ) */}
                            {b.carModel && (
                              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-start gap-4 hover:border-slate-300 transition-colors">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                  <Car className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">ข้อมูลรถยนต์</p>
                                  <p className="text-sm font-bold text-slate-800">{b.carModel}</p>
                                  <p className="text-[13px] font-medium text-slate-500 mt-0.5">ปี {b.carYear}</p>
                                </div>
                              </div>
                            )}

                            {/* Address / Tax Detail */}
                            {(b.address || b.taxId) && (
                              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-start gap-4 hover:border-slate-300 transition-colors">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                                  <MapPin className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">ที่อยู่ / ภาษี</p>
                                  {b.address && <p className="text-[13px] font-medium text-slate-700">{b.address}</p>}
                                  {b.taxId && (
                                    <p className="text-[12px] text-slate-500 mt-1 flex items-center gap-1">
                                      <Hash className="w-3 h-3" /> {b.taxId}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Line Detail */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-start gap-4 hover:border-slate-300 transition-colors">
                              <div className="p-3 bg-[#06C755]/10 text-[#06C755] rounded-lg">
                                <LineIcon className="w-5 h-5" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">LINE ID</p>
                                <p className="text-sm font-bold text-slate-800">@{b.lineId}</p>
                                <p className="text-[11px] font-mono text-slate-400 mt-1 truncate w-full bg-slate-50 px-2 py-1 rounded-md border border-slate-100" title={b.lineUserId}>
                                  {b.lineUserId ?? 'ยังไม่เชื่อมต่อ'}
                                </p>
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-start gap-4 lg:col-span-2 hover:border-slate-300 transition-colors">
                              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                                <Tag className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">หมายเหตุ / ความต้องการพิเศษ</p>
                                <div className="text-[13px] font-medium text-slate-700 bg-slate-50/80 p-3 rounded-lg border border-slate-100 min-h-[48px]">
                                  {b.note ? b.note : <span className="text-slate-400 italic">ไม่มีการระบุหมายเหตุ</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && (
        <div className="p-4 sm:px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <p className="text-[13px] text-slate-500 font-medium">
            แสดง <span className="font-bold text-slate-700">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> ถึง <span className="font-bold text-slate-700">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> จากทั้งหมด <span className="font-bold text-slate-700">{pagination.totalItems}</span> รายการ
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || isPending}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center">
              <span className="text-[13px] font-bold text-slate-700 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                หน้า {pagination.currentPage} / {pagination.totalPages}
              </span>
            </div>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || isPending}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
