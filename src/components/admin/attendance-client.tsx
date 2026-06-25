'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle, Save, UserCircle, Users, Clock, AlertTriangle } from 'lucide-react';
import { saveAttendanceBulk } from '@/app/actions/attendance';
import type { AttendanceRow } from '@/lib/attendance';
import { calcLateMinutes, calcOTMinutes, minutesToBilledHours } from '@/lib/attendance-calc';
import type { EmployeeRow } from '@/lib/employees';
import type { AttendanceStatus } from '@/models/Attendance';

const ROLE_LABELS: Record<string, string> = {
  mechanic: 'ช่างยาง', alignment: 'ช่างตั้งศูนย์', cashier: 'แคชเชียร์',
  admin_role: 'ธุรการ / บัญชี', manager: 'ผู้จัดการ',
};

const STATUS_OPTS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'มาทำงาน', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'late',    label: 'มาสาย',   color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'absent',  label: 'ขาดงาน',  color: 'bg-red-100 text-red-600 border-red-200' },
  { value: 'leave',   label: 'ลา',       color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { value: 'holiday', label: 'วันหยุด',  color: 'bg-slate-100 text-slate-500 border-slate-200' },
];

type RowState = {
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  lateMinutes: number;
  otMinutes: number;
  note: string;
};

function initRow(rec?: AttendanceRow): RowState {
  return {
    status:      rec?.status ?? 'present',
    checkIn:     rec?.checkIn ?? '',
    checkOut:    rec?.checkOut ?? '',
    lateMinutes: rec?.lateMinutes ?? 0,
    otMinutes:   rec?.otMinutes ?? 0,
    note:        rec?.note ?? '',
  };
}

export function AttendanceClient({
  date,
  employees,
  records,
}: {
  date: string;
  employees: EmployeeRow[];
  records: AttendanceRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState('');

  const recMap = new Map(records.map(r => [r.employeeId, r]));
  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const o: Record<string, RowState> = {};
    for (const e of employees) o[e.id] = initRow(recMap.get(e.id));
    return o;
  });

  function update(id: string, patch: Partial<RowState>) {
    setRows(r => ({ ...r, [id]: { ...r[id], ...patch } }));
  }

  function updateWithAutoCalc(emp: EmployeeRow, patch: Partial<RowState>) {
    setRows(r => {
      const cur = { ...r[emp.id], ...patch };
      // auto-calc สาย
      if (patch.checkIn !== undefined) {
        const lateMin = calcLateMinutes(emp.shiftStart, cur.checkIn);
        cur.lateMinutes = lateMin;
        if (lateMin > 10) cur.status = 'late';
        else if (cur.status === 'late') cur.status = 'present';
      }
      // auto-calc OT
      if (patch.checkOut !== undefined) {
        cur.otMinutes = calcOTMinutes(emp.shiftEnd, cur.checkOut);
      }
      return { ...r, [emp.id]: cur };
    });
  }

  function setAllPresent() {
    setRows(r => {
      const o = { ...r };
      for (const e of employees) o[e.id] = { ...o[e.id], status: 'present' };
      return o;
    });
  }

  function changeDate(d: string) {
    router.push(`/admin/attendance?date=${d}`);
  }

  function handleSave() {
    const payload = employees.map(e => ({ employeeId: e.id, date, ...rows[e.id] }));
    startTransition(async () => {
      const res = await saveAttendanceBulk(payload);
      if (res.ok) {
        setToast('บันทึกการลงเวลาสำเร็จ');
        setTimeout(() => setToast(''), 2500);
        router.refresh();
      } else {
        setToast(res.error);
        setTimeout(() => setToast(''), 3500);
      }
    });
  }

  const counts = Object.values(rows).reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">ลงเวลาทำงาน (Attendance)</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <CalendarDays size={14} className="text-slate-400" /> บันทึกการเข้างานรายวัน · {employees.length} คน
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center w-full lg:w-auto">
          {toast && (
            <div className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border border-emerald-100 animate-in fade-in slide-in-from-top-2 w-full sm:w-auto justify-center">
              <CheckCircle size={14} /> {toast}
            </div>
          )}
          <div className="relative w-full sm:w-auto">
            <input
              type="date"
              value={date}
              onChange={e => changeDate(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 shadow-sm transition-colors"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={setAllPresent} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
              <Users size={16} /> มาครบทุกคน
            </button>
            <button onClick={handleSave} disabled={isPending} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-green-600 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all shadow-md">
              <Save size={16} /> {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {STATUS_OPTS.map(s => (
          <div key={s.value} className={`rounded-2xl border ${s.color.split(' ')[2] || 'border-slate-100'} p-4 relative overflow-hidden group hover:shadow-md transition-shadow bg-white flex flex-col justify-between min-h-[90px]`}>
             {/* subtle background tint */}
             <div className={`absolute inset-0 opacity-10 ${s.color.split(' ')[0]}`}></div>
             
             <div className="relative z-10 flex flex-col items-center justify-center text-center">
               <p className={`text-3xl font-black tracking-tight leading-none mb-1 ${s.color.split(' ')[1]}`}>{counts[s.value] ?? 0}</p>
               <p className={`text-[11px] font-bold tracking-wide ${s.color.split(' ')[1]}`}>{s.label}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {employees.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">ยังไม่มีรายชื่อพนักงานในระบบ</p>
            <Link href="/admin/staff" className="text-xs text-green-600 hover:text-green-700 font-bold mt-2 inline-block">เพิ่มพนักงานที่นี่</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-6 py-4">พนักงาน / เวร</th>
                  <th className="px-6 py-4 w-36">สถานะ</th>
                  <th className="text-center px-4 py-4 w-28">เวลาเข้า</th>
                  <th className="text-center px-4 py-4 w-28">เวลาออก</th>
                  <th className="text-center px-4 py-4 w-32">มาสาย</th>
                  <th className="text-center px-4 py-4 w-32">OT</th>
                  <th className="text-left px-6 py-4">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map(e => {
                  const r = rows[e.id];
                  const st = STATUS_OPTS.find(o => o.value === r.status);
                  const lateHrs = minutesToBilledHours(r.lateMinutes);
                  const otHrs   = minutesToBilledHours(r.otMinutes);
                  const isOff   = r.status === 'absent' || r.status === 'leave' || r.status === 'holiday';
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200/50 shadow-inner">
                            <UserCircle size={22} strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{e.name}</p>
                            <p className="text-[11px] font-medium text-slate-400 tracking-wider mt-0.5">{ROLE_LABELS[e.role] ?? e.role}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock size={9} /> {e.shiftStart ?? '09:00'} – {e.shiftEnd ?? '18:00'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={r.status}
                          onChange={ev => update(e.id, { status: ev.target.value as AttendanceStatus })}
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 appearance-none cursor-pointer shadow-sm transition-colors ${st?.color}`}
                        >
                          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <input type="time" value={r.checkIn} onChange={ev => updateWithAutoCalc(e, { checkIn: ev.target.value })} disabled={isOff} className={cellCls} />
                      </td>
                      <td className="px-4 py-4">
                        <input type="time" value={r.checkOut} onChange={ev => updateWithAutoCalc(e, { checkOut: ev.target.value })} disabled={isOff} className={cellCls} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="space-y-0.5">
                          <p className={`text-xs font-bold ${r.lateMinutes > 10 ? 'text-amber-600' : 'text-slate-300'}`}>
                            {r.lateMinutes > 0 ? `${r.lateMinutes} นาที` : '—'}
                          </p>
                          {lateHrs > 0 && (
                            <p className="text-[10px] font-bold text-red-500 flex items-center justify-center gap-0.5">
                              <AlertTriangle size={9} /> นับ {lateHrs} ชม. (-฿{lateHrs * (e.lateDeductRate ?? 300)})
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="space-y-0.5">
                          <p className={`text-xs font-bold ${r.otMinutes > 10 ? 'text-blue-600' : 'text-slate-300'}`}>
                            {r.otMinutes > 0 ? `${r.otMinutes} นาที` : '—'}
                          </p>
                          {otHrs > 0 && (
                            <p className="text-[10px] font-bold text-blue-500 flex items-center justify-center gap-0.5">
                              +{otHrs} ชม. (+฿{otHrs * (e.otRate ?? 200)})
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input value={r.note} onChange={ev => update(e.id, { note: ev.target.value })} className={`${cellCls} w-full placeholder-slate-300 text-slate-600`} placeholder="หมายเหตุ..." />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const cellCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 shadow-sm transition-colors disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-300 disabled:shadow-none';
