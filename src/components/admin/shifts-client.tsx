'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, ChevronLeft, ChevronRight, Trash2, Copy, Users, Clock, X, Check, AlertCircle,
} from 'lucide-react';
import type { ShiftRow } from '@/lib/shifts';
import type { EmployeeRow } from '@/lib/employees';
import { createShifts, deleteShift, copyShiftsFromDate, copyWeek } from '@/app/actions/shifts';

function fmtDateTH(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function prevDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
function nextDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function mondayOf(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - dow + 1);
  return d.toISOString().slice(0, 10);
}

// ── Add Shift Modal ───────────────────────────────────────────────────────────

function AddShiftModal({ date, employees, onClose, onSaved }: {
  date: string;
  employees: EmployeeRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('18:00');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.nickname ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const toggleEmp = (id: string) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSave = () => {
    if (!selected.length) { setError('เลือกพนักงานอย่างน้อย 1 คน'); return; }
    setError('');
    startTransition(async () => {
      const inputs = selected.map(id => {
        const emp = employees.find(e => e.id === id)!;
        return { employeeId: id, employeeName: emp.name, date, shiftStart, shiftEnd, note };
      });
      const res = await createShifts(inputs);
      if (res.ok) onSaved();
      else setError(res.error ?? 'เกิดข้อผิดพลาด');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">เพิ่มเวรงาน</h2>
            <p className="text-xs text-slate-400">{fmtDateTH(date)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">เวลาเข้า</label>
              <input type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">เวลาออก</label>
              <input type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
          </div>

          {/* Employee picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500">เลือกพนักงาน</label>
              {selected.length > 0 && (
                <span className="text-xs text-indigo-600 font-semibold">เลือกแล้ว {selected.length} คน</span>
              )}
            </div>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2 focus:outline-none focus:border-indigo-400"
            />
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {filtered.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => toggleEmp(emp.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-slate-50 last:border-0 transition-colors
                    ${selected.includes(emp.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0
                    ${selected.includes(emp.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                    {selected.includes(emp.id) && <Check size={10} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{emp.name}</p>
                    <p className="text-xs text-slate-400">{emp.nickname || emp.role}</p>
                  </div>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold
                    ${emp.employeeType === 'parttime' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                    {emp.employeeType === 'parttime' ? 'พาร์ทไทม์' : 'ประจำ'}
                  </span>
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
          <button onClick={handleSave} disabled={isPending || !selected.length}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
            {isPending ? 'กำลังบันทึก...' : `บันทึก (${selected.length} คน)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ShiftsClient({ date, shifts, employees }: {
  date: string;
  shifts: ShiftRow[];
  employees: EmployeeRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localShifts, setLocalShifts] = useState(shifts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState('');
  const [copying, setCopying] = useState(false);

  useEffect(() => { setLocalShifts(shifts); }, [shifts]);

  const navigate = (d: string) => router.push(`/admin/shifts?date=${d}`);

  const handleDelete = (id: string) => {
    setLocalShifts(p => p.filter(s => s.id !== id));
    startTransition(async () => {
      await deleteShift(id);
      router.refresh();
    });
  };

  const handleCopyYesterday = async () => {
    setCopying(true);
    const from = prevDay(date);
    const res  = await copyShiftsFromDate(from, date);
    setCopying(false);
    if (res.ok) { showToast(`Copy สำเร็จ ${res.copied} รายการ`); router.refresh(); }
    else showToast(res.error ?? 'Copy ไม่สำเร็จ');
  };

  const handleCopyWeek = async () => {
    setCopying(true);
    const monday = mondayOf(date);
    const res    = await copyWeek(monday);
    setCopying(false);
    if (res.ok) { showToast(`Copy สัปดาห์สำเร็จ ${res.copied} รายการ`); router.refresh(); }
    else showToast(res.error ?? 'Copy ไม่สำเร็จ');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <>
      <div className={`max-w-5xl mx-auto transition-opacity ${isPending || copying ? 'opacity-60' : ''}`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">เวรงาน</h1>
            <p className="text-sm text-slate-500 mt-1">กำหนดตารางเวรพนักงานรายวัน</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 w-fit"
          >
            <Plus size={16} /> เพิ่มเวร
          </button>
        </div>

        {/* Date nav */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between gap-4">
            <button onClick={() => navigate(prevDay(date))}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
              <ChevronLeft size={18} />
            </button>

            <div className="text-center flex-1">
              <p className="text-base font-black text-slate-900">{fmtDateTH(date)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{localShifts.length} รายการ</p>
            </div>

            <button onClick={() => navigate(nextDay(date))}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Date picker */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
            <input
              type="date" value={date} onChange={e => navigate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-indigo-400"
            />
            {/* Copy buttons */}
            <button
              onClick={handleCopyYesterday} disabled={copying}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <Copy size={13} /> Copy เมื่อวาน
            </button>
            <button
              onClick={handleCopyWeek} disabled={copying}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <Copy size={13} /> Copy สัปดาห์ก่อน
            </button>
          </div>
        </div>

        {/* Shifts Table */}
        <div className="bg-white rounded-2xl border border-slate-100">
          {localShifts.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Clock size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">ยังไม่มีเวรงานสำหรับวันนี้</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700"
              >
                + เพิ่มเวร
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-5 py-3">พนักงาน</th>
                  <th className="text-center px-4 py-3">เวลาเข้า</th>
                  <th className="text-center px-4 py-3">เวลาออก</th>
                  <th className="text-center px-4 py-3">จำนวนชั่วโมง</th>
                  <th className="text-left px-4 py-3">หมายเหตุ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {localShifts.map(s => {
                  const emp = employees.find(e => e.id === s.employeeId);
                  const [sh, sm] = s.shiftStart.split(':').map(Number);
                  const [eh, em] = s.shiftEnd.split(':').map(Number);
                  const hrs = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Users size={14} className="text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{s.employeeName}</p>
                            <p className="text-xs text-slate-400">
                              {emp?.employeeType === 'parttime' ? 'พาร์ทไทม์' : 'ประจำ'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <Clock size={11} /> {s.shiftStart}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <Clock size={11} /> {s.shiftEnd}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-600 font-semibold">
                        {hrs > 0 ? `${hrs} ชม.` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">{s.note || '—'}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบเวร"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary */}
        {localShifts.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { label: 'พนักงานทั้งหมด', value: localShifts.length + ' คน' },
              { label: 'ประจำ', value: localShifts.filter(s => employees.find(e => e.id === s.employeeId)?.employeeType !== 'parttime').length + ' คน' },
              { label: 'พาร์ทไทม์', value: localShifts.filter(s => employees.find(e => e.id === s.employeeId)?.employeeType === 'parttime').length + ' คน' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4 text-center">
                <p className="text-xl font-black text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddShiftModal
          date={date}
          employees={employees}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); router.refresh(); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-xl flex items-center gap-2">
          <AlertCircle size={15} className="text-amber-400" /> {toast}
        </div>
      )}
    </>
  );
}
