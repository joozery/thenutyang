'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, CheckCircle, Clock, Calculator, Wallet, Edit2, X, TrendingUp, TrendingDown,
} from 'lucide-react';
import { generatePayroll, updatePayslip, markPaid, markAllPaid } from '@/app/actions/payroll';
import type { PayslipRow } from '@/lib/payroll';

const fmt = (n: number) => `฿${Math.round(n).toLocaleString('th-TH')}`;

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function periodLabel(period: string) {
  const [y, m] = period.split('-').map(Number);
  return `${THAI_MONTHS[m - 1]} ${y + 543}`;
}

export function PayrollClient({
  period,
  payslips,
  activeEmployees,
}: {
  period: string;
  payslips: PayslipRow[];
  activeEmployees: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editTarget, setEditTarget] = useState<PayslipRow | null>(null);
  const [bonus, setBonus] = useState(0);
  const [otherDeduct, setOtherDeduct] = useState(0);
  const [toast, setToast] = useState('');

  const paid = payslips.filter(p => p.status === 'paid').length;
  const totalNet = payslips.reduce((s, p) => s + p.netPay, 0);
  const totalOt = payslips.reduce((s, p) => s + p.otPay, 0);
  const totalDeduct = payslips.reduce((s, p) => s + p.absentDeduct + p.lateDeduct + p.leaveDeduct + p.sss + p.otherDeduct, 0);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function changePeriod(p: string) {
    router.push(`/admin/payroll?period=${p}`);
  }

  function handleGenerate() {
    startTransition(async () => {
      const res = await generatePayroll(period);
      if (res.ok) { flash('คำนวณรอบเงินเดือนสำเร็จ'); router.refresh(); }
      else flash(res.error);
    });
  }

  function handleMarkAll() {
    if (paid === payslips.length) return;
    startTransition(async () => {
      const res = await markAllPaid(period);
      if (res.ok) { flash('จ่ายเงินเดือนทั้งหมดแล้ว'); router.refresh(); }
    });
  }

  function handleMarkOne(id: string) {
    startTransition(async () => {
      const res = await markPaid(id);
      if (res.ok) { flash('บันทึกการจ่ายแล้ว'); router.refresh(); }
    });
  }

  function openEdit(p: PayslipRow) {
    setEditTarget(p);
    setBonus(p.bonus);
    setOtherDeduct(p.otherDeduct);
  }

  function handleSaveEdit() {
    if (!editTarget) return;
    startTransition(async () => {
      const res = await updatePayslip(editTarget.id, bonus, otherDeduct);
      if (res.ok) { setEditTarget(null); flash('แก้ไขแล้ว'); router.refresh(); }
      else flash(res.error);
    });
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">เงินเดือน</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <CalendarDays size={13} /> รอบเงินเดือน — {periodLabel(period)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {toast && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mr-1">
              <CheckCircle size={13} /> {toast}
            </span>
          )}
          <input
            type="month"
            value={period}
            onChange={e => changePeriod(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400"
          />
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors w-fit"
          >
            <Calculator size={15} /> {payslips.length === 0 ? 'คำนวณรอบนี้' : 'คำนวณใหม่'}
          </button>
          <button
            onClick={handleMarkAll}
            disabled={isPending || payslips.length === 0 || paid === payslips.length}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors w-fit"
          >
            <Wallet size={15} /> จ่ายเงินเดือนทั้งหมด
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'ยอดจ่ายสุทธิรวม', value: fmt(totalNet), color: 'text-slate-900' },
          { label: 'จ่ายแล้ว', value: `${paid}/${payslips.length} คน`, color: 'text-emerald-600' },
          { label: 'OT รวม', value: `+${fmt(totalOt)}`, color: 'text-blue-600' },
          { label: 'หักรวม', value: `-${fmt(totalDeduct)}`, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">รายละเอียดเงินเดือน · {periodLabel(period)}</h2>
          <span className="text-xs text-slate-400">พนักงานในระบบ {activeEmployees} คน</span>
        </div>

        {payslips.length === 0 ? (
          <div className="py-20 text-center">
            <Calculator size={36} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-500 mb-1">ยังไม่ได้คำนวณรอบเงินเดือนนี้</p>
            <p className="text-xs text-slate-400 mb-5">ระบบจะดึงข้อมูลจากการลงเวลา + การลา มาคำนวณให้อัตโนมัติ</p>
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Calculator size={15} /> {isPending ? 'กำลังคำนวณ...' : 'คำนวณรอบนี้'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3">พนักงาน</th>
                  <th className="text-center px-4 py-3">มา/ขาด/ลา</th>
                  <th className="text-right px-4 py-3">ฐานเงินเดือน</th>
                  <th className="text-right px-4 py-3">OT</th>
                  <th className="text-right px-4 py-3">โบนัส</th>
                  <th className="text-right px-4 py-3 text-red-400">หัก</th>
                  <th className="text-right px-4 py-3">รับสุทธิ</th>
                  <th className="text-center px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payslips.map(p => {
                  const deduct = p.absentDeduct + p.lateDeduct + p.leaveDeduct + p.sss + p.otherDeduct;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm shrink-0">{p.employeeName[0]}</div>
                          <div>
                            <p className="font-semibold text-slate-800">{p.employeeName}</p>
                            <p className="text-xs text-slate-400">{p.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs">
                        <span className="text-emerald-600 font-semibold">{p.daysWorked}</span>
                        <span className="text-slate-300"> / </span>
                        <span className="text-red-500 font-semibold">{p.daysAbsent}</span>
                        <span className="text-slate-300"> / </span>
                        <span className="text-amber-500 font-semibold">{p.daysLeavePaid + p.daysLeaveUnpaid}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-600">{fmt(p.baseSalary)}</td>
                      <td className="px-4 py-3.5 text-right text-blue-600 font-medium">{p.otPay > 0 ? `+${fmt(p.otPay)}` : '-'}</td>
                      <td className="px-4 py-3.5 text-right text-emerald-600 font-medium">{p.bonus > 0 ? `+${fmt(p.bonus)}` : '-'}</td>
                      <td className="px-4 py-3.5 text-right text-red-500" title={`ขาด ${fmt(p.absentDeduct)} · สาย ${fmt(p.lateDeduct)} · ลา ${fmt(p.leaveDeduct)} · สปส. ${fmt(p.sss)} · อื่นๆ ${fmt(p.otherDeduct)}`}>
                        {deduct > 0 ? `-${fmt(deduct)}` : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-900">{fmt(p.netPay)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.status === 'paid' ? <CheckCircle size={11} /> : <Clock size={11} />}{p.status === 'paid' ? 'จ่ายแล้ว' : 'รอจ่าย'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === 'pending' && (
                            <>
                              <button onClick={() => openEdit(p)} title="แก้ไขโบนัส/หัก" className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Edit2 size={14} /></button>
                              <button onClick={() => handleMarkOne(p.id)} disabled={isPending} className="text-xs font-semibold text-green-600 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors">จ่าย</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="px-4 py-3.5 font-bold text-slate-700" colSpan={2}>รวมทั้งสิ้น</td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-700">{fmt(payslips.reduce((s, p) => s + p.baseSalary, 0))}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-blue-600">+{fmt(totalOt)}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-600">+{fmt(payslips.reduce((s, p) => s + p.bonus, 0))}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-red-500">-{fmt(totalDeduct)}</td>
                  <td className="px-4 py-3.5 text-right font-black text-slate-900 text-base">{fmt(totalNet)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">ปรับเงินเดือน · {editTarget.employeeName}</h2>
              <button onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Breakdown */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-xs">
                <Row label="ฐานเงินเดือน" value={fmt(editTarget.baseSalary)} />
                <Row label={`OT (${(editTarget.otMinutes / 60).toFixed(1)} ชม.)`} value={`+${fmt(editTarget.otPay)}`} color="text-blue-600" />
                <Row label={`ขาดงาน ${editTarget.daysAbsent} วัน`} value={`-${fmt(editTarget.absentDeduct)}`} color="text-red-500" />
                <Row label={`มาสาย ${editTarget.lateMinutes} นาที`} value={`-${fmt(editTarget.lateDeduct)}`} color="text-red-500" />
                <Row label={`ลาไม่รับเงิน ${editTarget.daysLeaveUnpaid} วัน`} value={`-${fmt(editTarget.leaveDeduct)}`} color="text-red-500" />
                <Row label="ประกันสังคม (5%)" value={`-${fmt(editTarget.sss)}`} color="text-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1"><TrendingUp size={12} className="text-emerald-500" /> โบนัส</label>
                  <input type="number" value={bonus || ''} onChange={e => setBonus(+e.target.value)} className={inputCls} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1"><TrendingDown size={12} className="text-red-400" /> หักอื่นๆ</label>
                  <input type="number" value={otherDeduct || ''} onChange={e => setOtherDeduct(+e.target.value)} className={inputCls} placeholder="0" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">ยกเลิก</button>
              <button onClick={handleSaveEdit} disabled={isPending} className="px-5 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors">
                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors';

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${color ?? 'text-slate-700'}`}>{value}</span>
    </div>
  );
}
