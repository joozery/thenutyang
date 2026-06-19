'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle, Save, UserCircle, Users } from 'lucide-react';
import { saveAttendanceBulk } from '@/app/actions/attendance';
import type { AttendanceRow } from '@/lib/attendance';
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">ลงเวลาทำงาน</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <CalendarDays size={13} /> บันทึกการเข้างานรายวัน · {employees.length} คน
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {toast && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mr-1">
              <CheckCircle size={13} /> {toast}
            </span>
          )}
          <input
            type="date"
            value={date}
            onChange={e => changeDate(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400"
          />
          <button onClick={setAllPresent} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors w-fit">
            <Users size={15} /> มาครบทุกคน
          </button>
          <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-colors w-fit">
            <Save size={15} /> {isPending ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {STATUS_OPTS.map(s => (
          <div key={s.value} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-2xl font-black text-slate-900">{counts[s.value] ?? 0}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {employees.length === 0 ? (
          <div className="py-20 text-center text-sm text-slate-400">
            ยังไม่มีพนักงาน — <Link href="/admin/staff" className="text-green-600 underline">เพิ่มพนักงานก่อน</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3">พนักงาน</th>
                  <th className="text-left px-4 py-3 w-40">สถานะ</th>
                  <th className="text-center px-4 py-3 w-28">เข้า</th>
                  <th className="text-center px-4 py-3 w-28">ออก</th>
                  <th className="text-center px-4 py-3 w-24">สาย (นาที)</th>
                  <th className="text-center px-4 py-3 w-24">OT (นาที)</th>
                  <th className="text-left px-4 py-3">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map(e => {
                  const r = rows[e.id];
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0"><UserCircle size={20} /></div>
                          <div>
                            <p className="font-semibold text-slate-800">{e.name}</p>
                            <p className="text-xs text-slate-400">{ROLE_LABELS[e.role] ?? e.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={r.status}
                          onChange={ev => update(e.id, { status: ev.target.value as AttendanceStatus })}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none ${STATUS_OPTS.find(o => o.value === r.status)?.color}`}
                        >
                          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="time" value={r.checkIn} onChange={ev => update(e.id, { checkIn: ev.target.value })} disabled={r.status === 'absent' || r.status === 'leave' || r.status === 'holiday'} className={cellCls} />
                      </td>
                      <td className="px-4 py-3">
                        <input type="time" value={r.checkOut} onChange={ev => update(e.id, { checkOut: ev.target.value })} disabled={r.status === 'absent' || r.status === 'leave' || r.status === 'holiday'} className={cellCls} />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min={0} value={r.lateMinutes || ''} onChange={ev => update(e.id, { lateMinutes: +ev.target.value })} disabled={r.status !== 'late'} className={`${cellCls} text-center`} placeholder="0" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min={0} value={r.otMinutes || ''} onChange={ev => update(e.id, { otMinutes: +ev.target.value })} className={`${cellCls} text-center`} placeholder="0" />
                      </td>
                      <td className="px-4 py-3">
                        <input value={r.note} onChange={ev => update(e.id, { note: ev.target.value })} className={cellCls} placeholder="—" />
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

const cellCls = 'w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 disabled:bg-slate-50 disabled:text-slate-300';
