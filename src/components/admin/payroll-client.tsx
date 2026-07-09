'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, CheckCircle, Clock, Calculator, Wallet, Edit2, X,
  TrendingUp, TrendingDown, Users, DollarSign, AlertCircle, ChevronRight, Trash2,
} from 'lucide-react';
import { generatePayroll, updatePayslip, markPaid, markAllPaid, deletePayslip } from '@/app/actions/payroll';
import type { PayslipRow } from '@/lib/payroll';

const fmt = (n: number) => `฿${Math.round(n).toLocaleString('th-TH')}`;

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function periodLabel(period: string) {
  const [y, m] = period.split('-').map(Number);
  return `${THAI_MONTHS[m - 1]} ${y + 543}`;
}

export function PayrollClient({
  period, payslips, activeEmployees,
}: {
  period: string;
  payslips: PayslipRow[];
  activeEmployees: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editTarget, setEditTarget] = useState<PayslipRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PayslipRow | null>(null);
  const [bonus, setBonus] = useState(0);
  const [otherDeduct, setOtherDeduct] = useState(0);
  const [toast, setToast] = useState('');

  const paid = payslips.filter(p => p.status === 'paid').length;
  const pending = payslips.filter(p => p.status === 'pending').length;
  const totalNet = payslips.reduce((s, p) => s + p.netPay, 0);
  const totalOt = payslips.reduce((s, p) => s + p.otPay, 0);
  const totalDeduct = payslips.reduce((s, p) => s + p.absentDeduct + p.lateDeduct + p.leaveDeduct + p.sss + p.otherDeduct, 0);
  const totalBase = payslips.reduce((s, p) => s + p.baseSalary, 0);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function changePeriod(p: string) { router.push(`/admin/payroll?period=${p}`); }

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

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deletePayslip(id);
      setDeleteTarget(null);
      if (res.ok) { flash('ลบรายการแล้ว'); router.refresh(); }
      else flash(res.error);
    });
  }

  function handleSaveEdit() {
    if (!editTarget) return;
    startTransition(async () => {
      const res = await updatePayslip(editTarget.id, bonus, otherDeduct);
      if (res.ok) { setEditTarget(null); flash('แก้ไขแล้ว'); router.refresh(); }
      else flash(res.error);
    });
  }

  const paidPct = payslips.length > 0 ? Math.round((paid / payslips.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in slide-in-from-right">
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 font-medium">
            <CalendarDays size={13} />
            <span>รอบเงินเดือน — {periodLabel(period)}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">จัดการเงินเดือน</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="month"
            value={period}
            onChange={e => changePeriod(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400 bg-white shadow-sm"
          />
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
          >
            <Calculator size={15} />
            {payslips.length === 0 ? 'คำนวณรอบนี้' : 'คำนวณใหม่'}
          </button>
          <button
            onClick={handleMarkAll}
            disabled={isPending || payslips.length === 0 || paid === payslips.length}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/30"
          >
            <Wallet size={15} /> จ่ายเงินเดือนทั้งหมด
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <DollarSign size={18} className="text-white" />
            </div>
            <span className="text-xs text-slate-400 font-medium">ยอดจ่ายสุทธิรวม</span>
          </div>
          <p className="text-2xl font-black tracking-tight">{fmt(totalNet)}</p>
          <p className="text-xs text-slate-400 mt-1">รอบ {periodLabel(period)}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Users size={18} className="text-emerald-600" />
            </div>
            <span className="text-xs text-slate-400 font-medium">สถานะการจ่าย</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{paid}<span className="text-base font-semibold text-slate-400">/{payslips.length}</span></p>
          <div className="mt-2">
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${paidPct}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{paidPct}% จ่ายแล้ว</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-blue-500" />
            </div>
            <span className="text-xs text-slate-400 font-medium">OT รวม</span>
          </div>
          <p className="text-2xl font-black text-blue-600">+{fmt(totalOt)}</p>
          <p className="text-xs text-slate-400 mt-1">รวมทุกคน</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <TrendingDown size={18} className="text-red-500" />
            </div>
            <span className="text-xs text-slate-400 font-medium">หักรวม</span>
          </div>
          <p className="text-2xl font-black text-red-500">-{fmt(totalDeduct)}</p>
          <p className="text-xs text-slate-400 mt-1">รวมทุกรายการ</p>
        </div>
      </div>

      {/* Pending Alert */}
      {pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">มีพนักงาน <span className="font-black">{pending} คน</span> ที่ยังรอรับเงินเดือนในรอบนี้</p>
          <button onClick={handleMarkAll} disabled={isPending} className="ml-auto text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 shrink-0">
            จ่ายทั้งหมด <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">รายละเอียดเงินเดือน</h2>
            <p className="text-xs text-slate-400 mt-0.5">พนักงานในระบบ {activeEmployees} คน · รอบ {periodLabel(period)}</p>
          </div>
        </div>

        {payslips.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Calculator size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold mb-1">ยังไม่ได้คำนวณรอบเงินเดือนนี้</p>
            <p className="text-xs text-slate-400 mb-6">ระบบจะดึงข้อมูลจากการลงเวลา + การลา มาคำนวณให้อัตโนมัติ</p>
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-green-500/30"
            >
              <Calculator size={15} /> {isPending ? 'กำลังคำนวณ...' : 'คำนวณรอบนี้'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-5 py-3.5">พนักงาน</th>
                  <th className="text-center px-4 py-3.5">มา / ขาด / ลา</th>
                  <th className="text-right px-4 py-3.5">ฐานเงินเดือน</th>
                  <th className="text-right px-4 py-3.5">OT</th>
                  <th className="text-right px-4 py-3.5">โบนัส</th>
                  <th className="text-right px-4 py-3.5 text-red-400">หัก</th>
                  <th className="text-right px-4 py-3.5">รับสุทธิ</th>
                  <th className="text-center px-4 py-3.5">สถานะ</th>
                  <th className="px-4 py-3.5 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payslips.map(p => {
                  const deduct = p.absentDeduct + p.lateDeduct + p.leaveDeduct + p.sss + p.otherDeduct;
                  const isPaid = p.status === 'paid';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm shadow-green-200">
                            {p.employeeName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">{p.employeeName}</p>
                            <p className="text-xs text-slate-400">{p.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">{p.daysWorked}ว</span>
                          <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-md">{p.daysAbsent}ข</span>
                          <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md">{p.daysLeavePaid + p.daysLeaveUnpaid}ล</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-slate-600 font-medium">{fmt(p.baseSalary)}</td>
                      <td className="px-4 py-4 text-right font-semibold">
                        {p.otPay > 0
                          ? <span className="text-blue-600">+{fmt(p.otPay)}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold">
                        {p.bonus > 0
                          ? <span className="text-emerald-600">+{fmt(p.bonus)}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold"
                        title={`ขาด ${fmt(p.absentDeduct)} · สาย ${fmt(p.lateDeduct)} · ลา ${fmt(p.leaveDeduct)} · สปส. ${fmt(p.sss)} · อื่นๆ ${fmt(p.otherDeduct)}`}>
                        {deduct > 0
                          ? <span className="text-red-500">-{fmt(deduct)}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-black text-slate-900">{fmt(p.netPay)}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isPaid ? <CheckCircle size={11} /> : <Clock size={11} />}
                          {isPaid ? 'จ่ายแล้ว' : 'รอจ่าย'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* ปุ่มแก้ไข: โชว์ทุก status */}
                          <button onClick={() => openEdit(p)} title="แก้ไขโบนัส/หัก"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          {!isPaid && (
                            <button onClick={() => handleMarkOne(p.id)} disabled={isPending}
                              className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 shadow-sm shadow-green-200">
                              จ่าย
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(p)}
                            title="ลบรายการ"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="px-5 py-4 font-bold text-slate-700" colSpan={2}>รวมทั้งสิ้น ({payslips.length} คน)</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-700">{fmt(totalBase)}</td>
                  <td className="px-4 py-4 text-right font-bold text-blue-600">+{fmt(totalOt)}</td>
                  <td className="px-4 py-4 text-right font-bold text-emerald-600">+{fmt(payslips.reduce((s, p) => s + p.bonus, 0))}</td>
                  <td className="px-4 py-4 text-right font-bold text-red-500">-{fmt(totalDeduct)}</td>
                  <td className="px-4 py-4 text-right font-black text-slate-900 text-base">{fmt(totalNet)}</td>
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">ปรับเงินเดือน</h2>
                <p className="text-xs text-slate-400 mt-0.5">{editTarget.employeeName} · {periodLabel(period)}</p>
              </div>
              <button onClick={() => setEditTarget(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* หมายเหตุเมื่อแก้หลังจ่ายแล้ว */}
              {editTarget.status === 'paid' && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>รายการนี้จ่ายแล้ว — ถ้าบันทึก ยอดค่าใช้จ่ายในรายงานจะถูก <strong>อัปเดตอัตโนมัติ</strong> ไม่สร้างรายการใหม่</span>
                </div>
              )}
              {/* Breakdown */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-xs border border-slate-100">
                <Row label="ฐานเงินเดือน" value={fmt(editTarget.baseSalary)} />
                <Row label={`OT ${editTarget.otRate > 0 ? (editTarget.otPay / editTarget.otRate) : 0} ชม. × ฿${editTarget.otRate}`} value={`+${fmt(editTarget.otPay)}`} color="text-blue-600" />
                <Row label={`ขาดงาน ${editTarget.daysAbsent} วัน`} value={`-${fmt(editTarget.absentDeduct)}`} color="text-red-500" />
                <Row label={`สาย ${editTarget.lateDeductRate > 0 ? (editTarget.lateDeduct / editTarget.lateDeductRate) : 0} ชม. × ฿${editTarget.lateDeductRate}`} value={`-${fmt(editTarget.lateDeduct)}`} color="text-red-500" />
                <Row
                  label={editTarget.daysLeaveUnpaid > 0
                    ? `ลาไม่รับเงิน ${editTarget.daysLeaveUnpaid} วัน${editTarget.leaveDeductAmount > 0 ? ' + ยอดหักจากใบลา' : ''}`
                    : editTarget.leaveDeductAmount > 0 ? 'หักจากใบลา (ระบุยอด)' : 'ลาไม่รับเงิน 0 วัน'}
                  value={`-${fmt(editTarget.leaveDeduct)}`} color="text-red-500" />
                <Row label="ประกันสังคม" value={`-${fmt(editTarget.sss)}`} color="text-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
                      <TrendingUp size={11} className="text-emerald-600" />
                    </div>
                    โบนัส (฿)
                  </label>
                  <input type="number" value={bonus || ''} onChange={e => setBonus(+e.target.value)} className={inputCls} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-red-100 flex items-center justify-center">
                      <TrendingDown size={11} className="text-red-500" />
                    </div>
                    หักอื่นๆ (฿)
                  </label>
                  <input type="number" value={otherDeduct || ''} onChange={e => setOtherDeduct(+e.target.value)} className={inputCls} placeholder="0" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-colors">ยกเลิก</button>
              <button onClick={handleSaveEdit} disabled={isPending}
                className="px-6 py-2.5 text-xs font-bold bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg hover:opacity-90 disabled:opacity-40 transition-all shadow-sm shadow-green-200">
                {isPending ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-red-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <Trash2 size={15} className="text-red-500" />
                </div>
                <h2 className="font-bold text-slate-900">ยืนยันการลบ</h2>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="p-2 rounded-lg hover:bg-red-100 text-slate-400 transition-colors"><X size={15} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-700 mb-1">
                คุณต้องการลบข้อมูลเงินเดือนของ <span className="font-bold">{deleteTarget.employeeName}</span> ใช่ไหม?
              </p>
              <p className="text-xs text-slate-400 mb-1">รอบ {periodLabel(period)} · สุทธิ {fmt(deleteTarget.netPay)}</p>
              {deleteTarget.status === 'paid' && (
                <div className="flex items-start gap-2 mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  <span>รายการนี้จ่ายแล้ว — <strong>ค่าใช้จ่ายในรายงานการเงินจะถูกลบออกด้วย</strong></span>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-colors">ยกเลิก</button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                disabled={isPending}
                className="px-5 py-2.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 transition-all shadow-sm shadow-red-200"
              >
                {isPending ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors';

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${color ?? 'text-slate-700'}`}>{value}</span>
    </div>
  );
}
