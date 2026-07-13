import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Phone, Mail, MapPin, Hash, User, Handshake,
  FileText, Wallet, Clock, Building2,
} from 'lucide-react';
import connectDB from '@/lib/mongodb';
import { Supplier } from '@/models/Supplier';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { SupplierPOTable } from '@/components/admin/supplier-po-table';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'รายละเอียดคู่ค้า | Admin' };

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
          <SupplierPOTable
            pos={pos.map(po => ({
              id: String(po._id),
              poNumber: po.poNumber,
              status: po.status,
              paymentStatus: po.paymentStatus,
              grandTotal: po.grandTotal ?? 0,
              orderDate: po.createdAt instanceof Date ? po.createdAt.toISOString() : '',
            }))}
          />
        </div>
      </div>
    </div>
  );
}
