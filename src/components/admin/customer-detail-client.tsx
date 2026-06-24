'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, Mail, MapPin, Hash, Car, Gauge,
  Crown, UserCheck, Sparkles, Building2, FileText,
  Receipt, FileClock, FileEdit, FileMinus, CreditCard,
  Pencil, Calendar, Wrench,
} from 'lucide-react';
import { useState } from 'react';
import type { CustomerDetailResult } from '@/lib/customer-detail';

const DOC_TYPE_LABEL: Record<string, string> = {
  invoice:      'ใบเสร็จ',
  quote:        'ใบเสนอราคา',
  billing_note: 'ใบแจ้งหนี้',
  credit_note:  'ใบลดหนี้',
  payment_note: 'ใบรับชำระ',
};
function docTypeLabel(type: string): string {
  return DOC_TYPE_LABEL[type] ?? type;
}
import { CustomerModal } from '@/components/admin/customers-client';
import type { UnifiedCustomerRow } from '@/lib/customers';
import type { CarBrandRow, CarModelRow } from '@/app/actions/car-data';

const STATUS_STYLE: Record<string, string> = {
  paid:       'bg-green-100 text-green-700 border-green-200',
  unpaid:     'bg-amber-100 text-amber-700 border-amber-200',
  cancelled:  'bg-slate-100 text-slate-500 border-slate-200',
  draft:      'bg-slate-100 text-slate-500 border-slate-200',
  pending:    'bg-amber-100 text-amber-700 border-amber-200',
  confirmed:  'bg-blue-100 text-blue-700 border-blue-200',
  completed:  'bg-green-100 text-green-700 border-green-200',
};
const STATUS_LABEL: Record<string, string> = {
  paid:      'ชำระแล้ว',
  unpaid:    'ค้างชำระ',
  cancelled: 'ยกเลิก',
  draft:     'ร่าง',
  pending:   'รอดำเนินการ',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
};
const DOC_TYPE_ICON: Record<string, React.ReactNode> = {
  invoice:      <Receipt  size={13} />,
  quote:        <FileEdit size={13} />,
  billing_note: <FileClock size={13} />,
  credit_note:  <FileMinus size={13} />,
  payment_note: <CreditCard size={13} />,
};
const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending:   'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
};

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function CustomerDetailClient({ data, carBrands = [], carModels = [] }: { data: CustomerDetailResult; carBrands?: CarBrandRow[]; carModels?: CarModelRow[] }) {
  const { customer, docs, bookings, totalSpent, totalDocs, totalBookings } = data;
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const tag: 'VIP' | 'ปกติ' | 'ใหม่' = totalSpent >= 50000 ? 'VIP' : totalDocs === 0 ? 'ใหม่' : 'ปกติ';
  const TAG_STYLE = {
    VIP:  'bg-amber-100 text-amber-700 border-amber-200',
    ปกติ: 'bg-slate-100 text-slate-600 border-slate-200',
    ใหม่: 'bg-green-100 text-green-700 border-green-200',
  };
  const TAG_ICON = {
    VIP:  <Crown size={13} className="text-amber-500" />,
    ปกติ: <UserCheck size={13} className="text-slate-400" />,
    ใหม่: <Sparkles size={13} className="text-green-500" />,
  };

  const editableCustomer: UnifiedCustomerRow & { id: string } = {
    id: customer.id,
    customerType: customer.customerType,
    name: customer.displayName,
    firstName: customer.firstName,
    lastName: customer.lastName,
    companyName: customer.companyName,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    taxId: customer.taxId,
    carInfo: customer.carInfo,
    vehicles: customer.vehicles,
    note: customer.note,
    lineUserId: undefined,
    cars: [],
    totalBills: totalDocs,
    totalSpent,
    lastVisit: customer.createdAt,
    tag,
    source: customer.source,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">{customer.displayName}</h1>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md border ${TAG_STYLE[tag]}`}>
                {TAG_ICON[tag]} {tag}
              </span>
              {customer.customerType === 'corporate' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                  <Building2 size={10} /> นิติบุคคล
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-0.5">ลูกค้าตั้งแต่ {fmtDate(customer.createdAt)}</p>
          </div>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Pencil size={14} /> แก้ไขข้อมูล
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'ยอดซื้อรวม',   value: `฿${fmt(totalSpent)}`,         sub: 'จากใบเสร็จ + ใบรับชำระ' },
          { label: 'เอกสารทั้งหมด', value: `${totalDocs} รายการ`,          sub: 'ทุกประเภทเอกสาร' },
          { label: 'การจอง',        value: `${totalBookings} ครั้ง`,        sub: 'ผ่านเว็บไซต์' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-sm font-semibold text-slate-500 mt-1">{s.label}</p>
            <p className="text-xs text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — ข้อมูล + รถ */}
        <div className="space-y-4">
          {/* ข้อมูลติดต่อ */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <h2 className="font-bold text-slate-900 text-sm">ข้อมูลติดต่อ</h2>
            {[
              { icon: <Phone size={13} />,  label: 'เบอร์โทร', value: customer.phone   || '—' },
              { icon: <Mail size={13} />,   label: 'อีเมล',   value: customer.email   || '—' },
              { icon: <Hash size={13} />,   label: 'เลขผู้เสียภาษี', value: customer.taxId || '—' },
            ].map((r) => (
              <div key={r.label} className="flex items-start gap-2.5">
                <span className="text-slate-400 mt-0.5 shrink-0">{r.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{r.label}</p>
                  <p className="text-sm text-slate-700 font-medium break-all">{r.value}</p>
                </div>
              </div>
            ))}
            {customer.address && (
              <div className="flex items-start gap-2.5">
                <span className="text-slate-400 mt-0.5 shrink-0"><MapPin size={13} /></span>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">ที่อยู่</p>
                  <p className="text-sm text-slate-700 font-medium whitespace-pre-line">{customer.address}</p>
                </div>
              </div>
            )}
            {customer.note && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
                {customer.note}
              </div>
            )}
          </div>

          {/* รถของลูกค้า */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Car size={14} className="text-slate-400" />
              รถของลูกค้า
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                {customer.vehicles.length} คัน
              </span>
            </h2>
            {customer.vehicles.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">ยังไม่ได้บันทึกข้อมูลรถ</p>
            ) : (
              <div className="space-y-3">
                {customer.vehicles.map((v, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Car size={12} className="text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">รถคันที่ {i + 1}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {[v.carBrand, v.carModel, v.carColor].filter(Boolean).join(' ') || '—'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {v.licensePlate && (
                        <span className="text-xs text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono font-semibold">
                          {v.licensePlate}
                        </span>
                      )}
                      {v.mileage && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Gauge size={10} /> {v.mileage} กม.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — เอกสาร + การจอง */}
        <div className="lg:col-span-2 space-y-6">

          {/* เอกสาร */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText size={14} className="text-slate-400" /> ประวัติเอกสาร
              </h2>
              <Link
                href={`/admin/documents?phone=${encodeURIComponent(customer.phone)}`}
                className="text-xs font-semibold text-green-600 hover:text-green-800"
              >
                ดูทั้งหมด →
              </Link>
            </div>

            {docs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">ยังไม่มีเอกสาร</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {docs.slice(0, 10).map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      {DOC_TYPE_ICON[doc.type] ?? <FileText size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/documents/${doc.id}`}
                          className="text-sm font-bold text-slate-800 hover:text-green-700 font-mono"
                        >
                          {doc.docNumber}
                        </Link>
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {docTypeLabel(doc.type)}
                        </span>
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_STYLE[doc.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {STATUS_LABEL[doc.status] ?? doc.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {doc.customerCar && <span className="mr-2">{doc.customerCar}</span>}
                        <span className="flex items-center gap-1 inline-flex"><Calendar size={10} /> {fmtDate(doc.createdAt)}</span>
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-800 shrink-0">฿{fmt(doc.grandTotal)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* การจอง */}
          {bookings.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
                <Wrench size={14} className="text-slate-400" /> ประวัติการจอง (เว็บไซต์)
              </h2>
              <div className="divide-y divide-slate-100">
                {bookings.slice(0, 8).map((b) => (
                  <div key={b.id} className="py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                      <Car size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800">
                          {[b.carModel, b.carYear].filter(Boolean).join(' ปี ') || '—'}
                        </p>
                        {b.licensePlate && (
                          <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {b.licensePlate}
                          </span>
                        )}
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_STYLE[b.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {b.tireSize && <span className="mr-2">{b.tireSize} × {b.quantity} เส้น</span>}
                        <span>{fmtDate(b.createdAt)}</span>
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-800 shrink-0">
                      ฿{fmt(b.tirePrice * b.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {editOpen && (
        <CustomerModal
          initial={editableCustomer}
          carBrands={carBrands}
          carModels={carModels}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
