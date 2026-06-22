'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Phone, FileText, ChevronLeft, ChevronRight, Crown, UserCheck, Sparkles,
  Download, Filter, Plus, X, Pencil, Trash2, Building2, Mail, MapPin, Hash,
} from 'lucide-react';
import type { UnifiedCustomerRow } from '@/lib/customers';
import { createCustomer, updateCustomer, deleteCustomer, type CustomerFormInput } from '@/app/actions/customers';

function formatLastVisit(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'วันนี้';
  if (days === 1) return 'เมื่อวาน';
  if (days < 7)  return `${days} วันที่แล้ว`;
  if (days < 30) return `${Math.floor(days / 7)} สัปดาห์ที่แล้ว`;
  if (days < 365) return `${Math.floor(days / 30)} เดือนที่แล้ว`;
  return `${Math.floor(days / 365)} ปีที่แล้ว`;
}

const PAGE_SIZE = 15;

const TAG_STYLE: Record<string, string> = {
  VIP:  'bg-amber-100/50 text-amber-700 border-amber-200',
  ปกติ: 'bg-slate-100 text-slate-600 border-slate-200',
  ใหม่: 'bg-green-100/50 text-green-700 border-green-200',
};

const TAG_ICON: Record<string, React.ReactNode> = {
  VIP:  <Crown size={12} className="text-amber-500" />,
  ปกติ: <UserCheck size={12} className="text-slate-400" />,
  ใหม่: <Sparkles size={12} className="text-green-500" />,
};

const EMPTY_FORM: CustomerFormInput = {
  customerType: 'individual',
  firstName: '', lastName: '', companyName: '',
  phone: '', email: '', address: '', taxId: '', carInfo: '', note: '',
};

type EditableCustomer = UnifiedCustomerRow & { id: string };

function CustomerModal({
  initial, onClose, onSaved,
}: {
  initial: EditableCustomer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CustomerFormInput>(
    initial
      ? {
          customerType: initial.customerType,
          firstName: initial.firstName,
          lastName: initial.lastName,
          companyName: initial.companyName,
          phone: initial.phone,
          email: initial.email,
          address: initial.address,
          taxId: initial.taxId,
          carInfo: initial.carInfo,
          note: initial.note,
        }
      : EMPTY_FORM
  );
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function set<K extends keyof CustomerFormInput>(key: K, value: CustomerFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    setError('');
    startTransition(async () => {
      const result = initial ? await updateCustomer(initial.id, form) : await createCustomer(form);
      if (result.error) setError(result.error);
      else { router.refresh(); onSaved(); }
    });
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{initial ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4">
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button" onClick={() => set('customerType', 'individual')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-colors ${form.customerType === 'individual' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-500'}`}
            >
              <UserCheck size={14} /> บุคคลธรรมดา
            </button>
            <button
              type="button" onClick={() => set('customerType', 'corporate')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-colors ${form.customerType === 'corporate' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-500'}`}
            >
              <Building2 size={14} /> นิติบุคคล
            </button>
          </div>

          {form.customerType === 'corporate' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">ชื่อบริษัท <span className="text-green-500">*</span></label>
              <input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="บริษัท ... จำกัด" className={inputCls} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                {form.customerType === 'corporate' ? 'ชื่อผู้ติดต่อ' : 'ชื่อ'} {form.customerType === 'individual' && <span className="text-green-500">*</span>}
              </label>
              <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="ชื่อ" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">นามสกุล</label>
              <input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="นามสกุล" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-1.5"><Phone size={11} /> เบอร์โทร</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="08X-XXX-XXXX" className={inputCls} />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-1.5"><Mail size={11} /> อีเมล</label>
              <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@example.com" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-1.5"><MapPin size={11} /> ที่อยู่</label>
            <textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} placeholder="ที่อยู่สำหรับออกเอกสาร" className={inputCls + ' resize-none'} />
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-1.5"><Hash size={11} /> เลขที่ผู้เสียภาษี</label>
            <input value={form.taxId} onChange={(e) => set('taxId', e.target.value)} placeholder="0-0000-00000-00-0" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">หมายเหตุ</label>
            <textarea value={form.note} onChange={(e) => set('note', e.target.value)} rows={2} placeholder="หมายเหตุเพิ่มเติม" className={inputCls + ' resize-none'} />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">ยกเลิก</button>
          <button onClick={handleSubmit} disabled={isPending} className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50">
            {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomersClient({ customers }: { customers: UnifiedCustomerRow[] }) {
  const [search, setSearch]       = useState('');
  const [tagFilter, setTagFilter] = useState('ทั้งหมด');
  const [sourceFilter, setSourceFilter] = useState('ทั้งหมด');
  const [page, setPage]           = useState(1);
  const [modal, setModal]         = useState<'add' | EditableCustomer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EditableCustomer | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(c => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
      const matchTag    = tagFilter === 'ทั้งหมด' || c.tag === tagFilter;
      const matchSource = sourceFilter === 'ทั้งหมด'
        || (sourceFilter === 'ออนไลน์' && c.source === 'online')
        || (sourceFilter === 'หน้าร้าน' && c.source === 'walkin');
      return matchSearch && matchTag && matchSource;
    });
  }, [customers, search, tagFilter, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const vipCount   = customers.filter(c => c.tag === 'VIP').length;
  const newCount   = customers.filter(c => c.tag === 'ใหม่').length;
  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteCustomer(deleteTarget.id);
      router.refresh();
      setDeleteTarget(null);
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ลูกค้าทั้งหมด</h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            จัดการและดูข้อมูลลูกค้าของคุณ <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span> {customers.length} รายการ
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModal('add')} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all shadow-sm">
            <Plus size={16} />
            เพิ่มลูกค้า
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-[#00B900] to-green-700 p-6 rounded-2xl shadow-lg shadow-green-600/20 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-green-100 font-medium text-sm mb-1">ยอดใช้จ่ายรวมทั้งหมด</p>
            <p className="text-3xl font-black drop-shadow-sm tracking-tight">฿{totalSpent.toLocaleString()}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <span>จากทุก booking</span>
            </div>
          </div>
        </div>

        {[
          { label: 'ลูกค้าทั้งหมด', value: customers.length.toString(), sub: 'ในระบบ', icon: <UserCheck className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'ลูกค้า VIP',    value: vipCount.toString(),         sub: 'ยอดซื้อ ≥ 50,000', icon: <Crown className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50' },
          { label: 'ลูกค้าใหม่ (เดือนนี้)', value: newCount.toString(),  sub: 'จองครั้งแรก', icon: <Sparkles className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                {s.icon}
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800">{s.value}</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">{s.label}</p>
              <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์โทรศัพท์..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="inline-flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl bg-white shadow-sm w-full md:w-auto">
              <Filter size={16} className="text-slate-400" />
              <select
                value={sourceFilter}
                onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                {['ทั้งหมด', 'ออนไลน์', 'หน้าร้าน'].map(t => <option key={t} value={t}>ที่มา: {t}</option>)}
              </select>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl bg-white shadow-sm w-full md:w-auto">
              <Filter size={16} className="text-slate-400" />
              <select
                value={tagFilter}
                onChange={e => { setTagFilter(e.target.value); setPage(1); }}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                {['ทั้งหมด', 'VIP', 'ปกติ', 'ใหม่'].map(t => <option key={t} value={t}>สถานะ: {t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 bg-slate-50/80">
                <th className="text-left px-6 py-4">ลูกค้า</th>
                <th className="text-left px-6 py-4">เบอร์โทร</th>
                <th className="text-center px-6 py-4">จำนวนบิล</th>
                <th className="text-right px-6 py-4">ยอดซื้อรวม</th>
                <th className="text-left px-6 py-4">เข้ามาล่าสุด</th>
                <th className="text-center px-6 py-4">สถานะ</th>
                <th className="text-center px-6 py-4">ที่มา</th>
                <th className="px-6 py-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="py-24 text-center text-slate-400 text-base font-medium">ไม่พบข้อมูลลูกค้าที่คุณค้นหา</td></tr>
              ) : paginated.map((c, i) => (
                <tr key={c.id ?? c.phone} className="hover:bg-green-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-green-700 font-black text-sm shrink-0 border border-green-200 shadow-sm group-hover:scale-105 transition-transform">
                          {c.name.charAt(0)}
                        </div>
                        {c.customerType === 'corporate' ? (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-600 rounded-full border-2 border-white flex items-center justify-center shadow-sm" title="นิติบุคคล">
                            <Building2 size={9} className="text-white" />
                          </div>
                        ) : c.lineUserId && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#06C755] rounded-full border-2 border-white flex items-center justify-center shadow-sm" title="เชื่อมต่อ LINE แล้ว">
                            <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.301.079.767.038 1.076-.003.016-.046.284-.046.284s-.142.859-.172 1.034c-.049.289-.228 1.127 1.01.606 1.238-.521 6.678-3.929 8.924-7.069C23.013 14.28 24 12.395 24 10.304zm-14.73 2.946H6.602a.852.852 0 0 1-.852-.853V7.276a.852.852 0 0 1 1.704 0v4.269h1.816a.852.852 0 0 1 0 1.705zm2.768-.853a.853.853 0 0 1-1.705 0V7.276a.853.853 0 0 1 1.705 0v5.121zm4.869 0a.853.853 0 0 1-.853.853h-2.557a.853.853 0 0 1-.853-.853V7.276a.852.852 0 0 1 .853-.853h2.557a.853.853 0 1 1 0 1.705h-1.704v.852h1.704a.853.853 0 0 1 0 1.705h-1.704v.853h1.704a.852.852 0 0 1 .853.852zm3.308-5.121v5.121a.852.852 0 0 1-1.704 0V8.718l-2.457 3.422a.846.846 0 0 1-.689.379.852.852 0 0 1-.852-.853V6.544a.853.853 0 0 1 1.705 0v3.68l2.457-3.422a.846.846 0 0 1 .689-.379.852.852 0 0 1 .851.853z" /></svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{c.name}</p>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">ID: {(page - 1) * PAGE_SIZE + i + 1}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <Phone size={13} className="text-slate-400" />{c.phone || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                      <FileText size={14} className="text-blue-500" />{c.totalBills}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-black text-slate-800 text-base">
                      ฿{c.totalSpent.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                    {c.totalBills > 0 ? formatLastVisit(c.lastVisit) : '—'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${TAG_STYLE[c.tag]}`}>
                      {TAG_ICON[c.tag]}{c.tag}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md ${c.source === 'online' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                      {c.source === 'online' ? 'ออนไลน์' : 'หน้าร้าน'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.id && (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setModal(c as EditableCustomer)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(c as EditableCustomer)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-medium text-slate-500">
            แสดง <span className="text-slate-900 font-bold">{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> จากทั้งหมด <span className="text-slate-900 font-bold">{filtered.length}</span> รายการ
          </span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const n = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-all shadow-sm ${page === n ? 'bg-[#00B900] text-white border-transparent' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {n}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <CustomerModal
          initial={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <p className="font-bold text-slate-900 mb-1">ลบลูกค้านี้?</p>
            <p className="text-sm text-slate-500 mb-5">{deleteTarget.name} — ลบแล้วไม่สามารถกู้คืนได้</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">ยกเลิก</button>
              <button onClick={handleDelete} disabled={isPending} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50">
                {isPending ? 'กำลังลบ...' : 'ลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
