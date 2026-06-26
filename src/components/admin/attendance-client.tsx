'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Clock, X,
  CalendarDays, AlertTriangle, Edit2, LogIn, LogOut, UserX, XCircle, Trash2,
} from 'lucide-react';
import type { AttendanceRow } from '@/lib/attendance';
import { minutesToBilledHours } from '@/lib/attendance-calc';
import { updateAttendance, deleteAttendance } from '@/app/actions/attendance';
import type { AttendanceStatus } from '@/models/Attendance';
import type { EmployeeRow } from '@/lib/employees';

function fmtDateTH(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
function prevDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
function nextDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function fmtHrs(hrs: number) {
  if (!hrs) return '—';
  const h = Math.floor(hrs); const m = Math.round((hrs - h) * 60);
  return m ? `${h}ชม.${m}น.` : `${h}ชม.`;
}
function fmtBaht(n: number) {
  if (!n) return '—';
  return `฿${n.toLocaleString()}`;
}

function calcLateDeduct(lateMinutes: number, emp: EmployeeRow): number {
  const hours = minutesToBilledHours(lateMinutes);
  return hours * (emp.lateDeductRate ?? 300);
}
function calcOTPay(otMinutes: number, emp: EmployeeRow): number {
  const hours = minutesToBilledHours(otMinutes);
  if (emp.employeeType === 'parttime') return hours * (emp.hourlyRate ?? 0) * 1.5;
  return hours * (emp.otRate ?? 200);
}

const STATUS_CFG: Record<AttendanceStatus, { label: string; color: string }> = {
  pending: { label: 'รอลงเวลา', color: 'bg-slate-100 text-slate-500' },
  present: { label: 'มาทำงาน', color: 'bg-emerald-100 text-emerald-700' },
  late:    { label: 'มาสาย',   color: 'bg-amber-100 text-amber-700' },
  absent:  { label: 'ขาดงาน',  color: 'bg-red-100 text-red-600' },
  leave:   { label: 'ลา',       color: 'bg-blue-100 text-blue-600' },
  holiday: { label: 'วันหยุด',  color: 'bg-slate-100 text-slate-400' },
};

function EditModal({ rec, onClose, onSaved }: {
  rec: AttendanceRow; onClose: () => void; onSaved: () => void;
}) {
  const [checkIn,  setCheckIn]  = useState(rec.checkIn);
  const [checkOut, setCheckOut] = useState(rec.checkOut);
  const [status,   setStatus]   = useState<AttendanceStatus>(rec.status);
  const [note,     setNote]     = useState(rec.note);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateAttendance(rec.id, { checkIn, checkOut, status, note });
      if (res.ok) onSaved(); else setError(res.error ?? 'เกิดข้อผิดพลาด');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">แก้ไขการลงเวลา</h2>
            <p className="text-sm text-slate-400">{rec.employeeName} · เวร {rec.shiftStart}–{rec.shiftEnd}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">เวลาเข้างาน</label>
              <input type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400" />
              {rec.shiftStart && checkIn && checkIn > rec.shiftStart && (
                <p className="text-xs text-amber-600 mt-1">สาย (เวร {rec.shiftStart})</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">เวลาออกงาน</label>
              <input type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400" />
              {rec.shiftEnd && checkOut && checkOut > rec.shiftEnd && (
                <p className="text-xs text-blue-600 mt-1">OT (เวร {rec.shiftEnd})</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">สถานะ</label>
            <div className="grid grid-cols-3 gap-2">
              {(['present', 'late', 'absent', 'leave', 'holiday', 'pending'] as AttendanceStatus[]).map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${status === s ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {STATUS_CFG[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">หมายเหตุ</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="(ไม่บังคับ)"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">ยกเลิก</button>
          <button onClick={handleSave} disabled={isPending}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
            {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickStatusModal({ rec, onClose, onSaved }: {
  rec: AttendanceRow; onClose: () => void; onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const mark = (s: AttendanceStatus) => startTransition(async () => {
    await updateAttendance(rec.id, { status: s }); onSaved();
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xs mx-4 p-5" style={{ opacity: isPending ? 0.6 : 1 }}>
        <p className="text-sm font-bold text-slate-800 mb-4">{rec.employeeName}</p>
        <div className="space-y-2">
          <button onClick={() => mark('absent')} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2 px-4"><UserX size={15} /> ขาดงาน</button>
          <button onClick={() => mark('leave')} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-2 px-4"><CalendarDays size={15} /> ลา</button>
          <button onClick={() => mark('holiday')} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 flex items-center gap-2 px-4">วันหยุด</button>
        </div>
        <button onClick={onClose} className="mt-3 w-full py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-50">ยกเลิก</button>
      </div>
    </div>
  );
}

export function AttendanceClient({ date, records, hasShifts, employees }: {
  date: string;
  records: AttendanceRow[];
  hasShifts: boolean;
  employees: EmployeeRow[];
}) {
  const router = useRouter();
  const [localRecs, setLocalRecs] = useState(records);
  const [editTarget, setEditTarget] = useState<AttendanceRow | null>(null);
  const [quickTarget, setQuickTarget] = useState<AttendanceRow | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setLocalRecs(records); }, [records]);

  const empMap = new Map(employees.map(e => [e.id, e]));
  const navigate = (d: string) => router.push(`/admin/attendance?date=${d}`);
  const handleSaved = () => { setEditTarget(null); setQuickTarget(null); router.refresh(); };

  const handleDelete = (rec: AttendanceRow) => {
    if (!confirm(`ลบรายการของ ${rec.employeeName} ออก?`)) return;
    setLocalRecs(p => p.filter(r => r.id !== rec.id));
    startTransition(async () => { await deleteAttendance(rec.id); router.refresh(); });
  };

  const handleCheckIn = (rec: AttendanceRow) => {
    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
    startTransition(async () => { await updateAttendance(rec.id, { checkIn: now }); router.refresh(); });
  };
  const handleCheckOut = (rec: AttendanceRow) => {
    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
    startTransition(async () => { await updateAttendance(rec.id, { checkOut: now }); router.refresh(); });
  };

  const stats = {
    present: localRecs.filter(r => r.status === 'present').length,
    late:    localRecs.filter(r => r.status === 'late').length,
    pending: localRecs.filter(r => r.status === 'pending').length,
    absent:  localRecs.filter(r => r.status === 'absent').length,
    leave:   localRecs.filter(r => r.status === 'leave').length,
  };

  const totalLateDeduct = localRecs.reduce((s, r) => {
    const emp = empMap.get(r.employeeId);
    return s + (emp ? calcLateDeduct(r.lateMinutes, emp) : 0);
  }, 0);
  const totalOTPay = localRecs.reduce((s, r) => {
    const emp = empMap.get(r.employeeId);
    return s + (emp ? calcOTPay(r.otMinutes, emp) : 0);
  }, 0);

  return (
    <>
      <div className={`max-w-7xl mx-auto transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">ลงเวลา</h1>
            <p className="text-sm text-slate-500 mt-1">บันทึกการเข้า-ออกงานจากตารางเวร</p>
          </div>
          <Link href={`/admin/shifts?date=${date}`} className="text-sm font-semibold text-indigo-600 hover:underline">
            จัดการตารางเวร →
          </Link>
        </div>

        {/* Date nav */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(prevDay(date))} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"><ChevronLeft size={18} /></button>
            <div className="flex-1 text-center">
              <p className="text-base font-black text-slate-900">{fmtDateTH(date)}</p>
              <p className="text-xs text-slate-400">{localRecs.length} รายการ</p>
            </div>
            <button onClick={() => navigate(nextDay(date))} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"><ChevronRight size={18} /></button>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <input type="date" value={date} onChange={e => navigate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-indigo-400" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {[
            { label: 'มาแล้ว',   value: stats.present, c: 'text-emerald-600' },
            { label: 'มาสาย',    value: stats.late,    c: 'text-amber-600' },
            { label: 'รอลงเวลา', value: stats.pending, c: 'text-slate-500' },
            { label: 'ขาดงาน',   value: stats.absent,  c: 'text-red-600' },
            { label: 'ลา',       value: stats.leave,   c: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-3 text-center">
              <p className={`text-2xl font-black ${s.c}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* No shifts warning */}
        {!hasShifts && localRecs.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-4 mb-4">
            <AlertTriangle size={24} className="text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">ยังไม่ได้กำหนดเวรงาน</p>
              <p className="text-sm text-amber-600 mt-0.5">
                ไปกำหนดเวรที่{' '}
                <Link href={`/admin/shifts?date=${date}`} className="font-bold underline">หน้าเวรงาน</Link>
                {' '}ก่อน ระบบจะสร้างรายการลงเวลาให้อัตโนมัติ
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100">
          {localRecs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Clock size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{hasShifts ? 'กำลังโหลดรายการ...' : 'ไม่มีข้อมูล'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left px-5 py-3">พนักงาน</th>
                    <th className="text-center px-3 py-3">เวร</th>
                    <th className="text-center px-3 py-3">เข้างาน</th>
                    <th className="text-center px-3 py-3">ออกงาน</th>
                    <th className="text-center px-3 py-3">ชม.ทำงาน</th>
                    <th className="text-center px-3 py-3">สาย</th>
                    <th className="text-center px-3 py-3">หักสาย</th>
                    <th className="text-center px-3 py-3">OT</th>
                    <th className="text-center px-3 py-3">ค่า OT</th>
                    <th className="text-center px-3 py-3">สถานะ</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {localRecs.map(rec => {
                    const emp = empMap.get(rec.employeeId);
                    const lateDeduct = emp ? calcLateDeduct(rec.lateMinutes, emp) : 0;
                    const otPay      = emp ? calcOTPay(rec.otMinutes, emp)       : 0;
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-800">{rec.employeeName}</p>
                          {emp && (
                            <p className="text-xs text-slate-400">
                              {emp.employeeType === 'parttime' ? `฿${emp.hourlyRate}/ชม.` : `฿${emp.baseSalary?.toLocaleString()}/เดือน`}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-slate-500 font-mono">
                          {rec.shiftStart && rec.shiftEnd ? `${rec.shiftStart}–${rec.shiftEnd}` : '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {rec.checkIn ? (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${rec.status === 'late' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{rec.checkIn}</span>
                          ) : (
                            <button onClick={() => handleCheckIn(rec)} disabled={['absent','leave','holiday'].includes(rec.status)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full hover:bg-emerald-100 hover:text-emerald-700 disabled:opacity-30 transition-colors">
                              <LogIn size={11} /> ลงเข้า
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {rec.checkOut ? (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${rec.otMinutes > 10 ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{rec.checkOut}</span>
                          ) : rec.checkIn ? (
                            <button onClick={() => handleCheckOut(rec)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full hover:bg-orange-100 hover:text-orange-700 transition-colors">
                              <LogOut size={11} /> ลงออก
                            </button>
                          ) : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-700 font-semibold text-xs">{fmtHrs(rec.hoursWorked)}</td>
                        {/* late minutes */}
                        <td className="px-3 py-3 text-center">
                          {rec.lateMinutes > 0
                            ? <span className="text-xs font-semibold text-amber-600">{rec.lateMinutes}น. ({minutesToBilledHours(rec.lateMinutes)}ชม.)</span>
                            : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        {/* late deduction in baht */}
                        <td className="px-3 py-3 text-center">
                          {lateDeduct > 0
                            ? <span className="text-xs font-bold text-red-600">-฿{lateDeduct.toLocaleString()}</span>
                            : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        {/* OT minutes */}
                        <td className="px-3 py-3 text-center">
                          {rec.otMinutes > 10
                            ? <span className="text-xs font-semibold text-purple-600">{rec.otMinutes}น. ({minutesToBilledHours(rec.otMinutes)}ชม.)</span>
                            : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        {/* OT pay in baht */}
                        <td className="px-3 py-3 text-center">
                          {otPay > 0
                            ? <span className="text-xs font-bold text-green-600">+฿{otPay.toLocaleString()}</span>
                            : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CFG[rec.status].color}`}>{STATUS_CFG[rec.status].label}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => setQuickTarget(rec)} title="เปลี่ยนสถานะ" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"><XCircle size={14} /></button>
                            <button onClick={() => setEditTarget(rec)} title="แก้ไขเวลา" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(rec)} title="ลบรายการ" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary footer */}
        {localRecs.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-100 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-slate-800">{fmtHrs(localRecs.reduce((s, r) => s + r.hoursWorked, 0))}</p>
              <p className="text-xs text-slate-400 mt-0.5">ชม.ทำงานรวม</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-amber-600">{localRecs.reduce((s, r) => s + r.lateMinutes, 0)} น.</p>
              <p className="text-xs text-slate-400 mt-0.5">สายรวม</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-red-600">-{fmtBaht(totalLateDeduct)}</p>
              <p className="text-xs text-red-400 mt-0.5">หักสายรวม</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-green-600">+{fmtBaht(totalOTPay)}</p>
              <p className="text-xs text-green-400 mt-0.5">ค่า OT รวม</p>
            </div>
          </div>
        )}
      </div>

      {editTarget && <EditModal rec={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />}
      {quickTarget && <QuickStatusModal rec={quickTarget} onClose={() => setQuickTarget(null)} onSaved={handleSaved} />}
    </>
  );
}
