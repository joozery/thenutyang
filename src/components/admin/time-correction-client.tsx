'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, X } from 'lucide-react';
import type { TimeCorrectionRow } from '@/lib/time-correction';
import { approveTimeCorrection, rejectTimeCorrection } from '@/app/actions/time-correction';

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

const STATUS_CFG = {
  pending:  { label: 'รออนุมัติ', color: 'bg-amber-100 text-amber-700'     },
  approved: { label: 'อนุมัติ',   color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'ปฏิเสธ',   color: 'bg-red-100 text-red-600'         },
};

function RejectModal({ req, onClose, onRejected }: {
  req: TimeCorrectionRow; onClose: () => void; onRejected: () => void;
}) {
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleReject = () => {
    startTransition(async () => {
      await rejectTimeCorrection(req.id, 'ผู้จัดการ', note);
      onRejected();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900">ปฏิเสธคำขอ</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"><X size={16} /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          {req.employeeName} · {fmtDate(req.date)}
        </p>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">เหตุผลการปฏิเสธ</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="(ไม่บังคับ)"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-red-400 resize-none" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">ยกเลิก</button>
          <button onClick={handleReject} disabled={isPending}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50">
            {isPending ? 'กำลังบันทึก...' : 'ปฏิเสธ'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TimeCorrectionClient({ requests }: { requests: TimeCorrectionRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(requests);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [rejectTarget, setRejectTarget] = useState<TimeCorrectionRow | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setItems(requests); }, [requests]);

  const displayed = tab === 'pending' ? items.filter(r => r.status === 'pending') : items;

  const handleApprove = (req: TimeCorrectionRow) => {
    startTransition(async () => {
      await approveTimeCorrection(req.id, 'ผู้จัดการ');
      router.refresh();
    });
  };

  const pendingCount = items.filter(r => r.status === 'pending').length;

  return (
    <>
      <div className={`max-w-5xl mx-auto transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">อนุมัติแก้ไขเวลา</h1>
          <p className="text-sm text-slate-500 mt-1">คำขอแก้ไขเวลาเข้า-ออกงานของพนักงาน</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1 w-fit">
          <button onClick={() => setTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2
              ${tab === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            รออนุมัติ
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">{pendingCount}</span>
            )}
          </button>
          <button onClick={() => setTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            ทั้งหมด
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100">
          {displayed.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <CheckCircle size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{tab === 'pending' ? 'ไม่มีคำขอรออนุมัติ' : 'ยังไม่มีคำขอแก้ไขเวลา'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left px-5 py-3">พนักงาน</th>
                    <th className="text-center px-4 py-3">วันที่</th>
                    <th className="text-center px-4 py-3">เวลาเดิม</th>
                    <th className="text-center px-4 py-3">ขอแก้เป็น</th>
                    <th className="text-left px-4 py-3">เหตุผล</th>
                    <th className="text-center px-4 py-3">สถานะ</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayed.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{req.employeeName}</td>
                      <td className="px-4 py-3.5 text-center text-slate-500 text-xs">{fmtDate(req.date)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs font-mono text-slate-400">
                          {req.originalCheckIn || '—'} – {req.originalCheckOut || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                          {req.requestedCheckIn} – {req.requestedCheckOut}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs max-w-[200px] truncate">{req.reason}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CFG[req.status].color}`}>
                          {STATUS_CFG[req.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {req.status === 'pending' && (
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => handleApprove(req)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                              <CheckCircle size={12} /> อนุมัติ
                            </button>
                            <button
                              onClick={() => setRejectTarget(req)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                            >
                              <XCircle size={12} /> ปฏิเสธ
                            </button>
                          </div>
                        )}
                        {req.status !== 'pending' && (
                          <div className="text-right text-xs text-slate-400">
                            {req.reviewedBy} · {fmtDate(req.reviewedAt)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {rejectTarget && (
        <RejectModal
          req={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={() => { setRejectTarget(null); router.refresh(); }}
        />
      )}
    </>
  );
}
