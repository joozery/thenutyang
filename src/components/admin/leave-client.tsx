'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, CheckCircle, XCircle, Clock, X, CalendarRange, UserCircle, Trash2,
} from 'lucide-react';
import { createLeave, approveLeave, rejectLeave, deleteLeave } from '@/app/actions/leaves';
import type { LeaveRow, LeaveStatus } from '@/lib/leaves';
import type { EmployeeRow } from '@/lib/employees';
import type { LeaveType } from '@/models/LeaveRequest';

const TYPE_LABELS: Record<LeaveType, string> = {
  sick: 'ลาป่วย', vacation: 'ลาพักร้อน', personal: 'ลากิจ', other: 'อื่นๆ',
};
const TYPE_PAID: Record<LeaveType, boolean> = { sick: true, vacation: true, personal: false, other: false };

const STATUS_META: Record<LeaveStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:  { label: 'รออนุมัติ', cls: 'bg-amber-100 text-amber-700',   icon: <Clock size={11} /> },
  approved: { label: 'อนุมัติ',   cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={11} /> },
  rejected: { label: 'ปฏิเสธ',    cls: 'bg-red-100 text-red-600',        icon: <XCircle size={11} /> },
};

const fmtDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

const EMPTY_FORM = {
  employeeId: '',
  leaveType: 'sick' as LeaveType,
  startDate: '',
  endDate: '',
  reason: '',
};

export function LeaveClient({ leaves, employees }: { leaves: LeaveRow[]; employees: EmployeeRow[] }) {
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

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  function handleCreate() {
    if (!form.employeeId || !form.startDate || !form.endDate) { setError('กรุณากรอกข้อมูลให้ครบ'); return; }
    startTransition(async () => {
      const res = await createLeave(form);
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">การลา</h1>
          <p className="text-sm text-slate-500 mt-1">
            คำขอทั้งหมด {leaves.length} รายการ
            {pendingCount > 0 && <span className="ml-2 text-amber-600 font-semibold">· รออนุมัติ {pendingCount}</span>}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {toast && <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mr-1"><CheckCircle size={13} /> {toast}</span>}
          <button onClick={() => { setForm(EMPTY_FORM); setError(''); setShowAdd(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors w-fit">
            <Plus size={16} /> บันทึกการลา
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-5">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {f === 'all' ? 'ทั้งหมด' : STATUS_META[f].label}
            {f === 'pending' && pendingCount > 0 && <span className="ml-1.5">({pendingCount})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3">พนักงาน</th>
                <th className="text-left px-4 py-3">ประเภท</th>
                <th className="text-left px-4 py-3">ช่วงวันที่</th>
                <th className="text-center px-4 py-3">จำนวนวัน</th>
                <th className="text-left px-4 py-3">เหตุผล</th>
                <th className="text-center px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-slate-400">ไม่มีคำขอลา</td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0"><UserCircle size={18} /></div>
                      <span className="font-semibold text-slate-800">{empName.get(l.employeeId) ?? '(ไม่พบพนักงาน)'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{TYPE_LABELS[l.leaveType]}</span>
                    {!TYPE_PAID[l.leaveType] && <span className="ml-1 text-[10px] text-red-400 font-semibold">ไม่รับเงิน</span>}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                    <span className="flex items-center gap-1.5"><CalendarRange size={13} />{fmtDate(l.startDate)} – {fmtDate(l.endDate)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-700">{l.days}</td>
                  <td className="px-4 py-3.5 text-slate-500 max-w-[200px] truncate" title={l.reason}>{l.reason || '—'}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_META[l.status].cls}`}>
                      {STATUS_META[l.status].icon}{STATUS_META[l.status].label}
                    </span>
                    {l.status === 'rejected' && l.rejReason && <p className="text-[10px] text-red-400 mt-1">{l.rejReason}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {l.status === 'pending' ? (
                        <>
                          <button onClick={() => handleApprove(l.id)} disabled={isPending} className="text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors">อนุมัติ</button>
                          <button onClick={() => { setRejectTarget(l); setRejReason(''); }} disabled={isPending} className="text-xs font-semibold text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors">ปฏิเสธ</button>
                        </>
                      ) : (
                        <button onClick={() => handleDelete(l.id)} disabled={isPending} className="p-1.5 rounded-md text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">บันทึกการลา</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">พนักงาน *</label>
                <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={inputCls}>
                  <option value="">-- เลือกพนักงาน --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">ประเภทการลา</label>
                <select value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value as LeaveType }))} className={inputCls}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}{!TYPE_PAID[k as LeaveType] ? ' (ไม่รับเงิน)' : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">วันเริ่ม *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">วันสิ้นสุด *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">เหตุผล</label>
                <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className={inputCls} placeholder="รายละเอียด..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">ยกเลิก</button>
              <button onClick={handleCreate} disabled={isPending} className="px-5 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors">
                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-900 mb-1">ปฏิเสธคำขอลา</h3>
            <p className="text-xs text-slate-500 mb-4">{empName.get(rejectTarget.employeeId)} · {TYPE_LABELS[rejectTarget.leaveType]} {rejectTarget.days} วัน</p>
            <input value={rejReason} onChange={e => setRejReason(e.target.value)} className={inputCls} placeholder="เหตุผลที่ปฏิเสธ (ถ้ามี)" autoFocus />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setRejectTarget(null)} className="flex-1 px-4 py-2.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">ยกเลิก</button>
              <button onClick={handleReject} disabled={isPending} className="flex-1 px-4 py-2.5 text-xs font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-40 transition-colors">{isPending ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors';
