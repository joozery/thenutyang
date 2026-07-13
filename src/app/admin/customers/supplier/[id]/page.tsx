import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Phone, Mail, MapPin, Hash, User, Handshake,
  FileText, Wallet, Clock, Building2,
} from 'lucide-react';
import connectDB from '@/lib/mongodb';
import { Supplier } from '@/models/Supplier';
import { PurchaseOrder } from '@/models/PurchaseOrder';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'รายละเอียดคู่ค้า | Admin' };

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'ร่าง',           cls: 'bg-slate-100 text-slate-500' },
  pending:   { label: 'รอรับสินค้า',    cls: 'bg-amber-50 text-amber-600' },
  received:  { label: 'รับสินค้าแล้ว',  cls: 'bg-emerald-50 text-emerald-600' },
  cancelled: { label: 'ยกเลิก',         cls: 'bg-red-50 text-red-500' },
};

const PAY_BADGE: Record<string, { label: string; cls: string }> = {
  unpaid:  { label: 'ค้างชำระ',     cls: 'bg-red-50 text-red-500' },
  partial: { label: 'ชำระบางส่วน', cls: 'bg-amber-50 text-amber-600' },
  paid:    { label: 'ชำระแล้ว',     cls: 'bg-emerald-50 text-emerald-600' },
};

function fmtDate(d?: Date) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();

  type SupplierDoc = {
    name?: string; address?: string; contact?: string;
    phone?: string; email?: string; taxId?: string; createdAt?: Date;
  };
  let supplier: SupplierDoc | null = null;
  try {
    supplier = await Supplier.findById(id).lean() as SupplierDoc | null;
  } catch {
    notFound();
  }
  if (!supplier) notFound();

  const pos = await PurchaseOrder.find({ supplierId: id })
    .select('poNumber status paymentStatus amountPaid grandTotal createdAt dueDate')
    .sort({ createdAt: -1 })
    .lean() as {
      _id: unknown; poNumber: string; status: string; paymentStatus: string;
      amountPaid: number; grandTotal: number; createdAt?: Date; dueDate?: Date;
    }[];

  const active = pos.filter(p => p.status !== 'cancelled');
  const totalSpent  = active.reduce((s, p) => s + (p.grandTotal ?? 0), 0);
  const outstanding = active
    .filter(p => p.paymentStatus !== 'paid')
    .reduce((s, p) => s + Math.max(0, (p.grandTotal ?? 0) - (p.amountPaid ?? 0)), 0);
  const lastOrder = active[0]?.createdAt;

  const infoRows = [
    { icon: <Phone size={14} />,     label: 'เบอร์โทร',    value: supplier.phone },
    { icon: <User size={14} />,      label: 'ผู้ติดต่อ',   value: supplier.contact },
    { icon: <Mail size={14} />,      label: 'อีเมล',       value: supplier.email },
    { icon: <Hash size={14} />,      label: 'เลขผู้เสียภาษี', value: supplier.taxId },
    { icon: <MapPin size={14} />,    label: 'ที่อยู่',      value: supplier.address },
  ].filter(r => r.value);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/customers" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800">
          <ArrowLeft size={16} />
        </Link>
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-black border border-indigo-200 shrink-0">
          <Building2 size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{supplier.name}</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              <Handshake size={10} /> คู่ค้า (ซัพพลายเออร์)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">ข้อมูลจากหน้าจัดซื้อ · แก้ไขได้ที่รายชื่อซัพพลายเออร์ในหน้าจัดซื้อ</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ใบสั่งซื้อทั้งหมด', value: `${active.length} ใบ`, icon: <FileText size={16} className="text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'ยอดซื้อสะสม', value: `฿${totalSpent.toLocaleString()}`, icon: <Wallet size={16} className="text-emerald-500" />, bg: 'bg-emerald-50' },
          { label: 'ยอดค้างชำระ', value: `฿${outstanding.toLocaleString()}`, icon: <Wallet size={16} className="text-red-500" />, bg: 'bg-red-50' },
          { label: 'สั่งซื้อล่าสุด', value: fmtDate(lastOrder), icon: <Clock size={16} className="text-amber-500" />, bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${s.bg}`}>{s.icon}</div>
            <p className="text-lg font-black text-slate-800">{s.value}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-6 items-start">
        {/* Contact info */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h2 className="font-bold text-slate-800 text-sm mb-4">ข้อมูลติดต่อ</h2>
          {infoRows.length === 0 ? (
            <p className="text-xs text-slate-400">ยังไม่มีข้อมูลติดต่อ</p>
          ) : (
            <div className="space-y-3.5">
              {infoRows.map(r => (
                <div key={r.label} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">{r.icon}</div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 font-semibold">{r.label}</p>
                    <p className="text-sm text-slate-700 font-medium break-words">{r.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PO history */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm">ประวัติใบสั่งซื้อ ({pos.length} ใบ)</h2>
            <Link href="/admin/purchasing" className="text-xs font-bold text-green-600 hover:underline underline-offset-2">ไปหน้าจัดซื้อ →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3">เลขที่</th>
                  <th className="text-left px-4 py-3">วันที่</th>
                  <th className="text-center px-4 py-3">สถานะ</th>
                  <th className="text-center px-4 py-3">การชำระ</th>
                  <th className="text-right px-5 py-3">ยอดรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pos.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">ยังไม่มีใบสั่งซื้อ</td></tr>
                ) : pos.map(po => {
                  const st = STATUS_BADGE[po.status] ?? STATUS_BADGE.pending;
                  const pay = PAY_BADGE[po.paymentStatus] ?? PAY_BADGE.unpaid;
                  return (
                    <tr key={String(po._id)} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/admin/purchasing/${String(po._id)}/edit`} className="font-bold text-slate-800 text-[13px] hover:text-green-700 hover:underline underline-offset-2 transition-colors">
                          {po.poNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(po.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {po.status === 'cancelled'
                          ? <span className="text-[10px] text-slate-300">—</span>
                          : <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pay.cls}`}>{pay.label}</span>}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-slate-800 text-[13px]">฿{(po.grandTotal ?? 0).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
