'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, CheckCircle, XCircle, Clock, X, CalendarRange,
  Trash2, AlertCircle, FileText, Users, CalendarDays, Filter,
} from 'lucide-react';
import { createLeaveRequest as createLeave, approveLeave, rejectLeave, deleteLeaveRequest as deleteLeave } from '@/app/actions/leave';
import type { LeaveRequestRow as LeaveRow } from '@/lib/leave';
import type { EmployeeRow } from '@/lib/employees';
import { LEAVE_LABELS, LEAVE_QUOTA } from '@/lib/leave-constants';
import type { LeaveType } from '@/models/LeaveRequest';

type LeaveStatus = 'pending' | 'approved' | 'rejected';

const TYPE_LABELS = LEAVE_LABELS;
const TYPE_PAID: Record<LeaveType, boolean> = Object.fromEntries(
  Object.entries(LEAVE_QUOTA).map(([k, v]) => [k, !v.deductPay])
) as Record<LeaveType, boolean>;
const TYPE_COLOR: Record<LeaveType, string> = {
  sick:      'bg-red-50 text-red-600',
  vacation:  'bg-blue-50 text-blue-600',
  personal:  'bg-purple-50 text-purple-600',
  maternity: 'bg-pink-50 text-pink-600',
  military:  'bg-slate-100 text-slate-600',
  other:     'bg-slate-100 text-slate-600',
};

const STATUS_META: Record<LeaveStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:  { label: 'รออนุมัติ', cls: 'bg-amber-100 text-amber-700',   icon: <Clock size={11} /> },
  approved: { label: 'อนุมัติ',   cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={11} /> },
  rejected: { label: 'ปฏิเสธ',    cls: 'bg-red-100 text-red-600',        icon: <XCircle size={11} /> },
};

const fmtDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

const EMPTY_FORM = {
  employeeId: '',
  leaveType:  'sick' as LeaveType,
  startDate:  '',
  endDate:    '',
  reason:     '',
  deductPay:  LEAVE_QUOTA['sick'].deductPay,
  deductDays: 0,   // จำนวนวันที่หักจริง
  deductAmount: 0, // ยอดหักเป็นบาท (0 = หักตามวันลา)
};

export function LeaveClient({ requests: leaves, employees }: { requests: LeaveRow[]; employees: EmployeeRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<'all' | LeaveStatus>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [rejectTarget, setRejectTarget] = useState<LeaveRow | null>(null);
  const [rejReason, setRejReason] = useState('');
  const [toast, setToast] = useState('');

  const empName = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);
  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const totalDays = leaves.filter(l => l.status === 'approved').reduce((s, l) => s + l.days, 0);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  function handleCreate() {
    if (!form.employeeId || !form.startDate || !form.endDate) { setError('กรุณากรอกข้อมูลให้ครบ'); return; }
    const start = new Date(form.startDate);
    const end   = new Date(form.endDate);
    const days  = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const employeeName = empName.get(form.employeeId) ?? '';
    startTransition(async () => {
      const res = await createLeave({ ...form, employeeName, days, reason: form.reason });
      if (!res.ok) { setError(res.error); return; }
      setShowAdd(false); setForm(EMPTY_FORM); setError(''); flash('บันทึกคำขอลาแล้ว'); router.refresh();
    });
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      const res = await approveLeave(id);
      if (res.ok) { flash('อนุมัติแล้ว'); router.refresh(); }
    });
  }

  function handleReject() {
    if (!rejectTarget) return;
    startTransition(async () => {
      const res = await rejectLeave(rejectTarget.id, rejReason);
      if (res.ok) { setRejectTarget(null); setRejReason(''); flash('ปฏิเสธคำขอแล้ว'); router.refresh(); }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteLeave(id);
      if (res.ok) { flash('ลบแล้ว'); router.refresh(); }
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-lg shadow-xl flex items-center gap-2">
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">คำขอทั้งหมด {leaves.length} รายการ</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">จัดการการลา</h1>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setError(''); setShowAdd(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-green-500/30 w-fit"
        >
          <Plus size={16} /> บันทึกการลา
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-lg p-5 shadow-lg">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center mb-3">
            <FileText size={18} />
          </div>
          <p className="text-2xl font-black">{leaves.length}</p>
          <p className="text-xs text-slate-400 mt-1">คำขอทั้งหมด</p>
        </div>
        <div className="bg-white rounded-lg p-5 border border-slate-100 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
            <Clock size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
          <p className="text-xs text-slate-400 mt-1">รออนุมัติ</p>
        </div>
        <div className="bg-white rounded-lg p-5 border border-slate-100 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{approvedCount}</p>
          <p className="text-xs text-slate-400 mt-1">อนุมัติแล้ว</p>
        </div>
        <div className="bg-white rounded-lg p-5 border border-slate-100 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
            <CalendarDays size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600">{totalDays}</p>
          <p className="text-xs text-slate-400 mt-1">วันลารวม (อนุมัติ)</p>
        </div>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-3.5 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            มีคำขอลา <span className="font-black">{pendingCount} รายการ</span> ที่รออนุมัติ
          </p>
          <button onClick={() => setFilter('pending')} className="ml-auto text-xs font-bold text-amber-700 hover:text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg">
            ดูรายการรอ →
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <Filter size={14} className="text-slate-400" />
          <div className="flex gap-1.5">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f
                    ? 'bg-green-600 text-white shadow-sm shadow-green-200'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {f === 'all' ? 'ทั้งหมด' : STATUS_META[f].label}
                {f === 'pending' && pendingCount > 0 && (
                  <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === 'pending' ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} รายการ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                <th className="text-left px-5 py-3.5">พนักงาน</th>
                <th className="text-left px-4 py-3.5">ประเภท</th>
                <th className="text-left px-4 py-3.5">ช่วงวันที่</th>
                <th className="text-center px-4 py-3.5">จำนวนวัน</th>
                <th className="text-left px-4 py-3.5">เหตุผล</th>
                <th className="text-center px-4 py-3.5">สถานะ</th>
                <th className="px-4 py-3.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="w-14 h-14 rounded-lg bg-slate-50 flex items-center justify-center mx-auto mb-3">
                      <CalendarDays size={24} className="text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400">ไม่มีคำขอลาในหมวดนี้</p>
                  </td>
                </tr>
              ) : filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                        {(empName.get(l.employeeId) ?? '?')[0]}
                      </div>
                      <span className="font-semibold text-slate-800">{empName.get(l.employeeId) ?? '(ไม่พบพนักงาน)'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${TYPE_COLOR[l.leaveType]}`}>
                        {TYPE_LABELS[l.leaveType]}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${l.deductPay ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        {!l.deductPay ? 'ไม่หักเงิน'
                          : l.deductAmount > 0 ? `หักเงิน ฿${l.deductAmount.toLocaleString()}`
                          : l.deductDays > 0 ? `หักเงินเดือน (${l.deductDays} วัน)`
                          : 'หักเงินเดือน'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 text-xs">
                      <CalendarRange size={13} className="text-slate-400" />
                      {fmtDate(l.startDate)} – {fmtDate(l.endDate)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg">{l.days} วัน</span>
                  </td>
                  <td className="px-4 py-4 text-slate-500 max-w-[180px] truncate text-xs" title={l.reason}>
                    {l.reason || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_META[l.status].cls}`}>
                        {STATUS_META[l.status].icon}{STATUS_META[l.status].label}
                      </span>
                      {l.status === 'rejected' && l.rejReason && (
                        <p className="text-[10px] text-red-400 mt-1">{l.rejReason}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {l.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApprove(l.id)}
                            disabled={isPending}
                            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 shadow-sm"
                          >
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => { setRejectTarget(l); setRejReason(''); }}
                            disabled={isPending}
                            className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                          >
                            ปฏิเสธ
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDelete(l.id)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="font-bold text-slate-900">บันทึกการลา</h2>
                <p className="text-xs text-slate-400 mt-0.5">เพิ่มคำขอลาสำหรับพนักงาน</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Users size={12} /> พนักงาน *
                </label>
                <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={inputCls}>
                  <option value="">-- เลือกพนักงาน --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">ประเภทการลา</label>
                <select value={form.leaveType} onChange={e => {
                  const t = e.target.value as LeaveType;
                  const dp = LEAVE_QUOTA[t].deductPay;
                  setForm(f => ({ ...f, leaveType: t, deductPay: dp, deductDays: dp ? f.deductDays : 0, deductAmount: dp ? f.deductAmount : 0 }));
                }} className={inputCls}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              {/* การหักเงิน — admin override ได้ */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">การหักเงินเดือน</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm(f => ({ ...f, deductPay: false, deductDays: 0, deductAmount: 0 }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all
                      ${!form.deductPay ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                    ไม่หักเงิน
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, deductPay: true }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all
                      ${form.deductPay ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                    หักเงินเดือน
                  </button>
                </div>
                {form.deductPay && (
                  <div className="flex items-center gap-3 mt-2 bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
                    <span className="text-xs text-red-600 font-medium whitespace-nowrap">ยอดเงินที่หัก</span>
                    <input
                      type="number" min={0}
                      value={form.deductAmount === 0 ? '' : form.deductAmount}
                      placeholder="0 = หักตามวันลา (เงินเดือน÷30 × วัน)"
                      onChange={e => setForm(f => ({ ...f, deductAmount: Math.max(0, Number(e.target.value) || 0) }))}
                      className="flex-1 bg-white border border-red-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                    <span className="text-xs text-red-400">บาท</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">วันเริ่ม *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">วันสิ้นสุด *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">เหตุผล</label>
                <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className={inputCls} placeholder="รายละเอียด..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-colors">ยกเลิก</button>
              <button onClick={handleCreate} disabled={isPending}
                className="px-6 py-2.5 text-xs font-bold bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg hover:opacity-90 disabled:opacity-40 transition-all shadow-sm shadow-green-200">
                {isPending ? 'กำลังบันทึก...' : 'บันทึกการลา'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 bg-red-50/50">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mb-3">
                <XCircle size={20} className="text-red-600" />
              </div>
              <h3 className="font-bold text-slate-900">ปฏิเสธคำขอลา</h3>
              <p className="text-xs text-slate-500 mt-1">
                {empName.get(rejectTarget.employeeId)} · {TYPE_LABELS[rejectTarget.leaveType]} {rejectTarget.days} วัน
              </p>
            </div>
            <div className="p-6">
              <label className="text-xs font-semibold text-slate-600 block mb-2">เหตุผลที่ปฏิเสธ (ถ้ามี)</label>
              <input
                value={rejReason}
                onChange={e => setRejReason(e.target.value)}
                className={inputCls}
                placeholder="กรอกเหตุผล..."
                autoFocus
              />
              <div className="flex gap-2 mt-5">
                <button onClick={() => setRejectTarget(null)} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">ยกเลิก</button>
                <button onClick={handleReject} disabled={isPending}
                  className="flex-1 px-4 py-2.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors">
                  {isPending ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors';
