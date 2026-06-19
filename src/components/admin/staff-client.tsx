'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Phone, UserCircle, Edit2, Trash2, X,
  Users, BadgeCheck, CalendarOff, Wallet,
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

const EMPTY_FORM = {
  name: '',
  nickname: '',
  phone: '',
  idCard: '',
  role: 'mechanic' as EmpRole,
  status: 'active' as EmployeeRow['status'],
  baseSalary: 15000,
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
  const [roleFilter, setRoleFilter] = useState<'all' | EmpRole>('all');
  const [modal, setModal]         = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<EmployeeRow | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRow | null>(null);
  const [error, setError]         = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initialEmployees.filter(e => {
      const matchRole = roleFilter === 'all' || e.role === roleFilter;
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

  function openAdd() { setForm(EMPTY_FORM); setError(''); setModal('add'); }
  function openEdit(e: EmployeeRow) {
    setEditTarget(e);
    setForm({
      name: e.name, nickname: e.nickname, phone: e.phone, idCard: e.idCard,
      role: e.role, status: e.status, baseSalary: e.baseSalary,
      startDate: e.startDate ? e.startDate.slice(0, 10) : '',
      bankAccount: e.bankAccount, bankName: e.bankName, address: e.address, note: e.note,
    });
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">พนักงาน</h1>
          <p className="text-sm text-slate-500 mt-1">ทั้งหมด {initialEmployees.length} คน</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors w-fit">
          <Plus size={16} /> เพิ่มพนักงาน
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Users size={16} className="text-slate-600" />,     label: 'พนักงานทั้งหมด',   value: String(initialEmployees.length), bg: 'bg-slate-100' },
          { icon: <BadgeCheck size={16} className="text-emerald-600" />, label: 'กำลังทำงาน',     value: String(activeCount),             bg: 'bg-emerald-50' },
          { icon: <CalendarOff size={16} className="text-amber-600" />,  label: 'ลาพัก',          value: String(onLeaveCount),            bg: 'bg-amber-50' },
          { icon: <Wallet size={16} className="text-slate-600" />,     label: 'ค่าแรงรวมเดือนนี้', value: fmtBaht(payroll),                bg: 'bg-slate-100' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
            <div className={`${s.bg} p-2 rounded-lg`}>{s.icon}</div>
            <div>
              <p className="text-xl font-black text-slate-900 leading-none">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อ / รหัส / เบอร์โทร..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as 'all' | EmpRole)} className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400">
            <option value="all">ตำแหน่ง: ทั้งหมด</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="text-left px-4 py-3">พนักงาน</th>
                <th className="text-left px-4 py-3">ตำแหน่ง</th>
                <th className="text-left px-4 py-3">เบอร์โทร</th>
                <th className="text-left px-4 py-3">วันเริ่มงาน</th>
                <th className="text-right px-4 py-3">เงินเดือน</th>
                <th className="text-center px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
                        <UserCircle size={22} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{s.name}{s.nickname && <span className="text-slate-400 font-normal"> ({s.nickname})</span>}</p>
                        <p className="text-xs text-slate-400">{s.empId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{ROLE_LABELS[s.role]}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {s.phone ? <span className="flex items-center gap-1.5 text-slate-600"><Phone size={13} />{s.phone}</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">{fmtDate(s.startDate)}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-800">{fmtBaht(s.baseSalary)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[s.status]}`}>{STATUS_LABELS[s.status]}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-20 text-center text-sm text-slate-400">
                  {initialEmployees.length === 0 ? 'ยังไม่มีพนักงาน — กดปุ่ม "เพิ่มพนักงาน" เพื่อเริ่มต้น' : 'ไม่พบพนักงานที่ค้นหา'}
                </td></tr>
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">{modal === 'add' ? 'เพิ่มพนักงานใหม่' : 'แก้ไขข้อมูลพนักงาน'}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <Field label="ชื่อ-นามสกุล *">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="สมศักดิ์ ทองดี" />
                </Field>
                <Field label="ชื่อเล่น">
                  <input value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} className={inputCls} placeholder="ศักดิ์" />
                </Field>
                <Field label="ตำแหน่ง">
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as EmpRole }))} className={inputCls}>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="สถานะ">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as EmployeeRow['status'] }))} className={inputCls}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="เบอร์โทร">
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} placeholder="081-234-5678" />
                </Field>
                <Field label="เลขบัตรประชาชน">
                  <input value={form.idCard} onChange={e => setForm(f => ({ ...f, idCard: e.target.value }))} className={inputCls} placeholder="1-2345-67890-12-3" />
                </Field>
                <Field label="วันเริ่มงาน *">
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="เงินเดือน (บาท)">
                  <input type="number" value={form.baseSalary || ''} onChange={e => setForm(f => ({ ...f, baseSalary: +e.target.value }))} className={inputCls} />
                </Field>
                <Field label="ธนาคาร">
                  <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} className={inputCls} placeholder="กสิกรไทย" />
                </Field>
                <Field label="เลขบัญชี">
                  <input value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} className={inputCls} placeholder="123-4-56789-0" />
                </Field>
              </div>
              <Field label="ที่อยู่">
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="หมายเหตุ">
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className={inputCls} />
              </Field>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">ยกเลิก</button>
              <button onClick={handleSave} disabled={!form.name || !form.startDate || isPending}
                className="px-5 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {isPending ? 'กำลังบันทึก...' : modal === 'add' ? 'เพิ่มพนักงาน' : 'บันทึก'}
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

const inputCls = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}
