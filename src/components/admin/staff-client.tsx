'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Phone, UserCircle, Edit2, Trash2, X,
  Users, BadgeCheck, CalendarOff, Wallet, ChevronDown,
} from 'lucide-react';
import { createEmployee, updateEmployee, deleteEmployee } from '@/app/actions/employees';
import type { EmployeeRow } from '@/lib/employees';
import type { EmpRole } from '@/models/Employee';

const ROLE_LABELS: Record<EmpRole, string> = {
  mechanic: 'ช่างยาง',
  alignment: 'ช่างตั้งศูนย์',
  cashier: 'แคชเชียร์',
  admin_role: 'ธุรการ / บัญชี',
  manager: 'ผู้จัดการ',
};

const STATUS_LABELS: Record<EmployeeRow['status'], string> = {
  active: 'ทำงาน',
  on_leave: 'ลาพัก',
  resigned: 'ลาออก',
};

const STATUS_STYLE: Record<EmployeeRow['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700',
  on_leave: 'bg-amber-100 text-amber-700',
  resigned: 'bg-slate-200 text-slate-500',
};

const COMMON_BANKS = [
  'กสิกรไทย (KBANK)',
  'ไทยพาณิชย์ (SCB)',
  'กรุงเทพ (BBL)',
  'กรุงไทย (KTB)',
  'กรุงศรีอยุธยา (BAY)',
  'ทหารไทยธนชาต (TTB)',
  'ออมสิน (GSB)',
  'ธ.ก.ส. (BAAC)',
  'พร้อมเพย์ (PromptPay)',
];

const EMPTY_FORM = {
  name: '',
  nickname: '',
  phone: '',
  idCard: '',
  role: 'ช่างยาง',
  employeeType: 'fulltime' as 'fulltime' | 'parttime',
  status: 'active' as EmployeeRow['status'],
  baseSalary: 15000,
  dailyRate: 0,
  hourlyRate: 0,
  lateDeductRate:    300,
  otRate:            200,
  hasSocialSecurity: true,
  sssCustomAmount: 0,
  startDate: '',
  bankAccount: '',
  bankName: '',
  address: '',
  note: '',
};

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
const fmtBaht = (n: number) => `฿${n.toLocaleString('th-TH')}`;

export function StaffClient({ initialEmployees }: { initialEmployees: EmployeeRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [modal, setModal]         = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<EmployeeRow | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRow | null>(null);
  const [error, setError]         = useState('');

  const [isCustomRole, setIsCustomRole] = useState(false);
  const [isCustomBank, setIsCustomBank] = useState(false);

  const allUniqueRoles = useMemo(() => {
    return Array.from(new Set([
      ...Object.values(ROLE_LABELS),
      ...initialEmployees.map(e => ROLE_LABELS[e.role as EmpRole] || e.role)
    ])).sort();
  }, [initialEmployees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initialEmployees.filter(e => {
      const eRoleTh = ROLE_LABELS[e.role as EmpRole] || e.role;
      const matchRole = roleFilter === 'all' || eRoleTh === roleFilter;
      const matchSearch = !q
        || e.name.toLowerCase().includes(q)
        || e.nickname.toLowerCase().includes(q)
        || e.empId.toLowerCase().includes(q)
        || e.phone.includes(q);
      return matchRole && matchSearch;
    });
  }, [initialEmployees, search, roleFilter]);

  const activeCount = initialEmployees.filter(e => e.status === 'active').length;
  const onLeaveCount = initialEmployees.filter(e => e.status === 'on_leave').length;
  const payroll = initialEmployees
    .filter(e => e.status !== 'resigned')
    .reduce((s, e) => s + e.baseSalary, 0);

  function openAdd() { 
    setForm(EMPTY_FORM); 
    setError(''); 
    setIsCustomRole(false);
    setIsCustomBank(false);
    setModal('add'); 
  }
  function openEdit(e: EmployeeRow) {
    setEditTarget(e);
    const translatedRole = ROLE_LABELS[e.role as EmpRole] || e.role;
    setForm({
      name: e.name, nickname: e.nickname, phone: e.phone, idCard: e.idCard,
      role: translatedRole, employeeType: e.employeeType ?? 'fulltime',
      status: e.status, baseSalary: e.baseSalary,
      dailyRate: e.dailyRate ?? 0, hourlyRate: e.hourlyRate ?? 0,
      lateDeductRate: e.lateDeductRate ?? 300, otRate: e.otRate ?? 200,
      hasSocialSecurity: e.hasSocialSecurity !== false,
      sssCustomAmount: e.sssCustomAmount ?? 0,
      startDate: e.startDate ? e.startDate.slice(0, 10) : '',
      bankAccount: e.bankAccount, bankName: e.bankName, address: e.address, note: e.note,
    });
    setIsCustomRole(!allUniqueRoles.includes(translatedRole));
    setIsCustomBank(!COMMON_BANKS.includes(e.bankName) && e.bankName !== '');
    setError('');
    setModal('edit');
  }
  function closeModal() { setModal(null); setEditTarget(null); setError(''); }

  function handleSave() {
    if (!form.name || !form.startDate) { setError('กรุณากรอกชื่อและวันเริ่มงาน'); return; }
    startTransition(async () => {
      const res = modal === 'add'
        ? await createEmployee(form)
        : await updateEmployee(editTarget!.id, form);
      if (!res.ok) { setError(res.error); return; }
      closeModal();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">พนักงาน (Staff)</h1>
          <p className="text-sm text-slate-500 mt-1">จัดการรายชื่อ ข้อมูลส่วนตัว และเงินเดือนของพนักงานทั้งหมด</p>
        </div>
        <button onClick={openAdd} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors shadow-md w-full md:w-auto">
          <Plus size={16} /> เพิ่มพนักงานใหม่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Users size={20} className="text-blue-500" />,     label: 'พนักงานทั้งหมด',   value: String(initialEmployees.length), bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-100' },
          { icon: <BadgeCheck size={20} className="text-emerald-500" />, label: 'กำลังทำงาน',     value: String(activeCount),             bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-100' },
          { icon: <CalendarOff size={20} className="text-amber-500" />,  label: 'ลาพัก',          value: String(onLeaveCount),            bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-100' },
          { icon: <Wallet size={20} className="text-purple-500" />,     label: 'ค่าแรงรวมเดือนนี้', value: fmtBaht(payroll),                bg: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-100' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.bg} rounded-2xl border ${s.border} p-5 flex flex-col justify-between h-full relative overflow-hidden group hover:shadow-md transition-shadow`}>
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/40 blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mb-4 relative z-10">
              {s.icon}
            </div>
            <div className="relative z-10">
              <p className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1.5">{s.value}</p>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors shadow-sm" />
          </div>
          <div className="w-full sm:w-auto min-w-[200px]">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors shadow-sm cursor-pointer appearance-none">
              <option value="all">ทุกตำแหน่ง</option>
              {allUniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="px-6 py-4">พนักงาน</th>
                <th className="px-6 py-4">ตำแหน่ง</th>
                <th className="px-6 py-4">เบอร์ติดต่อ</th>
                <th className="px-6 py-4">เริ่มงาน</th>
                <th className="px-6 py-4 text-right">เงินเดือน</th>
                <th className="px-6 py-4 text-center">สถานะ</th>
                <th className="px-6 py-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200/50 shadow-inner">
                        <UserCircle size={22} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{s.name}{s.nickname && <span className="text-slate-500 font-medium ml-1">({s.nickname})</span>}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 tracking-wider">ID: {s.empId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/50 shadow-sm w-fit">{ROLE_LABELS[s.role as EmpRole] || s.role}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${s.employeeType === 'parttime' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                        {s.employeeType === 'parttime' ? 'พาร์ทไทม์' : 'ประจำ'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {s.phone ? <span className="flex items-center gap-1.5 text-slate-600 font-medium text-xs"><Phone size={13} className="text-slate-400" />{s.phone}</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-medium">{fmtDate(s.startDate)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-black text-slate-800">{fmtBaht(s.baseSalary)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm ${STATUS_STYLE[s.status]} ${s.status === 'active' ? 'border-emerald-200' : s.status === 'on_leave' ? 'border-amber-200' : 'border-slate-200'}`}>{STATUS_LABELS[s.status]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(s)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="แก้ไข"><Edit2 size={16} /></button>
                      <button onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="ลบ"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">{initialEmployees.length === 0 ? 'ยังไม่มีรายชื่อพนักงานในระบบ' : 'ไม่พบข้อมูลที่ค้นหา'}</p>
                    <p className="text-xs text-slate-400 mt-1">{initialEmployees.length === 0 ? 'คลิก "เพิ่มพนักงานใหม่" เพื่อเริ่มต้น' : 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">แสดง {filtered.length} จาก {initialEmployees.length} รายการ</span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
              <div>
                <h2 className="font-black text-lg text-slate-900">{modal === 'add' ? 'เพิ่มพนักงานใหม่' : 'แก้ไขข้อมูลพนักงาน'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{modal === 'add' ? 'กรอกข้อมูลพื้นฐานของพนักงานเพื่อเพิ่มเข้าระบบ' : 'อัปเดตข้อมูลส่วนตัวหรือการทำงานของพนักงาน'}</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  {error}
                </div>
              )}
              
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">ข้อมูลส่วนตัว</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="ชื่อ-นามสกุล *">
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="เช่น สมศักดิ์ ทองดี" />
                  </Field>
                  <Field label="ชื่อเล่น">
                    <input value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} className={inputCls} placeholder="เช่น ศักดิ์" />
                  </Field>
                  <Field label="เบอร์โทรศัพท์">
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} maxLength={10} className={inputCls} placeholder="0812345678" />
                  </Field>
                  <Field label="เลขประจำตัวประชาชน / พาสปอร์ต">
                    <input value={form.idCard} onChange={e => setForm(f => ({ ...f, idCard: e.target.value.slice(0, 13) }))} maxLength={13} className={inputCls} placeholder="เลข 13 หลัก หรือ พาสปอร์ต" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="ที่อยู่ปัจจุบัน">
                      <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={`${inputCls} min-h-[80px] resize-none`} placeholder="บ้านเลขที่, ถนน, ซอย, จังหวัด..." />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              {/* ประเภทพนักงาน + เวรงาน */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">ประเภท & เวรงาน</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="ประเภทพนักงาน">
                    <div className="flex gap-2">
                      {(['fulltime', 'parttime'] as const).map(t => (
                        <button key={t} type="button"
                          onClick={() => setForm(f => ({ ...f, employeeType: t }))}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            form.employeeType === t
                              ? t === 'fulltime' ? 'bg-slate-800 text-white border-slate-800' : 'bg-amber-500 text-white border-amber-500'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}>
                          {t === 'fulltime' ? 'ประจำ' : 'พาร์ทไทม์'}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="ค่าปรับสาย (บาท/ชม.)">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">฿</span>
                      <input type="number" value={form.lateDeductRate || ''} onChange={e => setForm(f => ({ ...f, lateDeductRate: +e.target.value }))} className={`${inputCls} pl-8`} placeholder="300" />
                    </div>
                  </Field>
                  <Field label="อัตรา OT (บาท/ชม.)">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">฿</span>
                      <input type="number" value={form.otRate || ''} onChange={e => setForm(f => ({ ...f, otRate: +e.target.value }))} className={`${inputCls} pl-8`} placeholder={form.employeeType === 'parttime' ? 'คิดจาก hourly×1.5' : '200'} disabled={form.employeeType === 'parttime'} />
                    </div>
                    {form.employeeType === 'parttime' && <p className="text-[10px] text-slate-400 mt-1">พาร์ทไทม์: ชั่วโมงละ × 1.5 อัตโนมัติ</p>}
                  </Field>
                  <Field label="ประกันสังคม">
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, hasSocialSecurity: !f.hasSocialSecurity }))}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border-2 transition-all font-semibold text-sm
                          ${form.hasSocialSecurity
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-400'}`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                          ${form.hasSocialSecurity ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                          {form.hasSocialSecurity && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        {form.hasSocialSecurity ? 'มีประกันสังคม' : 'ไม่มีประกันสังคม'}
                      </button>
                      {form.hasSocialSecurity && (
                        <div>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">฿</span>
                            <input
                              type="number" min={0}
                              value={form.sssCustomAmount || ''}
                              onChange={e => setForm(f => ({ ...f, sssCustomAmount: Math.max(0, +e.target.value) }))}
                              className={`${inputCls} pl-8`}
                              placeholder="เว้นว่าง = หัก 5% อัตโนมัติ (สูงสุด 750)"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {form.sssCustomAmount > 0
                              ? `หักเดือนละ ฿${form.sssCustomAmount.toLocaleString('th-TH')} ตามที่กำหนด`
                              : 'คำนวณอัตโนมัติ 5% ของเงินเดือน (ฐานสูงสุด 15,000 → หักสูงสุด 750)'}
                          </p>
                        </div>
                      )}
                    </div>
                  </Field>
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">ข้อมูลการทำงาน & การเงิน</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="ตำแหน่ง *">
                    {!isCustomRole ? (
                      <div className="relative">
                        <select 
                          value={allUniqueRoles.includes(form.role) ? form.role : ''} 
                          onChange={e => {
                            if (e.target.value === 'CUSTOM') {
                              setIsCustomRole(true);
                              setForm(f => ({ ...f, role: '' }));
                            } else {
                              setForm(f => ({ ...f, role: e.target.value }));
                            }
                          }}
                          className={`${inputCls} cursor-pointer appearance-none`}
                        >
                          <option value="" disabled>-- เลือกตำแหน่ง --</option>
                          {allUniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                          <option value="CUSTOM">+ อื่นๆ (พิมพ์เพิ่มเอง)</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          value={form.role} 
                          onChange={e => setForm(f => ({ ...f, role: e.target.value }))} 
                          className={inputCls} 
                          placeholder="พิมพ์ตำแหน่งใหม่..."
                        />
                        <button type="button" onClick={() => {
                          setIsCustomRole(false);
                          setForm(f => ({ ...f, role: allUniqueRoles[0] || 'ช่างยาง' }));
                        }} className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shrink-0">
                          ยกเลิก
                        </button>
                      </div>
                    )}
                  </Field>
                  <Field label="สถานะการทำงาน *">
                    <div className="relative">
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as EmployeeRow['status'] }))} className={`${inputCls} cursor-pointer appearance-none`}>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="วันที่เริ่มงาน *">
                    <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
                  </Field>
                  {form.employeeType === 'fulltime' ? (
                    <Field label="ฐานเงินเดือน (บาท)">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">฿</span>
                        <input type="number" value={form.baseSalary || ''} onChange={e => setForm(f => ({ ...f, baseSalary: +e.target.value }))} className={`${inputCls} pl-8`} placeholder="15000" />
                      </div>
                    </Field>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                      <Field label="ค่าจ้างรายวัน (บาท)">
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">฿</span>
                          <input type="number" value={form.dailyRate || ''} onChange={e => setForm(f => ({ ...f, dailyRate: +e.target.value }))} className={`${inputCls} pl-8`} placeholder="600" />
                        </div>
                      </Field>
                      <Field label="ค่าจ้างรายชั่วโมง (บาท)">
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">฿</span>
                          <input type="number" value={form.hourlyRate || ''} onChange={e => setForm(f => ({ ...f, hourlyRate: +e.target.value }))} className={`${inputCls} pl-8`} placeholder="60" />
                        </div>
                      </Field>
                    </div>
                  )}
                  <Field label="ธนาคารที่รับเงิน">
                    {!isCustomBank ? (
                      <div className="relative">
                        <select 
                          value={COMMON_BANKS.includes(form.bankName) ? form.bankName : ''} 
                          onChange={e => {
                            if (e.target.value === 'CUSTOM') {
                              setIsCustomBank(true);
                              setForm(f => ({ ...f, bankName: '' }));
                            } else {
                              setForm(f => ({ ...f, bankName: e.target.value }));
                            }
                          }}
                          className={`${inputCls} cursor-pointer appearance-none`}
                        >
                          <option value="">- ไม่ระบุ -</option>
                          {COMMON_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                          <option value="CUSTOM">+ อื่นๆ (พิมพ์เพิ่มเอง)</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          value={form.bankName} 
                          onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} 
                          className={inputCls} 
                          placeholder="พิมพ์ชื่อธนาคาร..."
                        />
                        <button type="button" onClick={() => {
                          setIsCustomBank(false);
                          setForm(f => ({ ...f, bankName: '' }));
                        }} className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shrink-0">
                          ยกเลิก
                        </button>
                      </div>
                    )}
                  </Field>
                  <Field label="เลขที่บัญชี">
                    <input value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} className={inputCls} placeholder="123-4-56789-0" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="หมายเหตุ (ถ้ามี)">
                      <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className={inputCls} placeholder="ข้อมูลเพิ่มเติมอื่นๆ..." />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 z-10">
              <button onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={!form.name || !form.startDate || isPending}
                className="px-6 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors shadow-md flex items-center gap-2">
                {isPending ? 'กำลังบันทึก...' : (
                  <>
                    <BadgeCheck size={16} /> {modal === 'add' ? 'บันทึกพนักงานใหม่' : 'บันทึกการแก้ไข'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">ลบพนักงาน</h3>
            <p className="text-xs text-slate-500 mb-5">
              ยืนยันการลบ <span className="font-semibold text-slate-700">{deleteTarget.name}</span>?<br />
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">ยกเลิก</button>
              <button onClick={handleDelete} disabled={isPending} className="flex-1 px-4 py-2.5 text-xs font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-40 transition-colors">
                {isPending ? 'กำลังลบ...' : 'ลบเลย'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors shadow-sm placeholder-slate-300';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 flex flex-col">
      <label className="text-xs font-bold text-slate-600 pl-1">{label}</label>
      {children}
    </div>
  );
}
