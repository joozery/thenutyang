'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight,
  Plus, X, Trash2,
} from 'lucide-react';
import { createExpense, deleteExpense } from '@/app/actions/expenses';
import type { FinanceSummary } from '@/lib/finance';

const RANGE_LABEL: Record<string, string> = {
  this_month:    'เดือนนี้',
  last_month:    'เดือนที่แล้ว',
  last_3_months: '3 เดือนล่าสุด',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

const EXPENSE_CATEGORIES = ['ค่าน้ำ', 'ค่าไฟ', 'ค่าเช่าที่', 'ค่าซ่อมบำรุง', 'ค่าใช้จ่ายอื่นๆ'];

export function FinanceClient({
  summary,
  activeRange,
  activeDate,
  periodLabel,
}: {
  summary: FinanceSummary;
  activeRange: string;
  activeDate?: string;
  periodLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  const [category,    setCategory]    = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [amount,      setAmount]      = useState(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [note,        setNote]        = useState('');

  function closeModal() {
    setModalOpen(false);
    setError('');
    setCategory(EXPENSE_CATEGORIES[0]);
    setDescription('');
    setAmount(0);
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setNote('');
  }

  function handleSave() {
    startTransition(async () => {
      const res = await createExpense({ category, description, amount, expenseDate, note });
      if (res.error) { setError(res.error); return; }
      closeModal();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('ต้องการลบรายจ่ายนี้?')) return;
    startTransition(async () => {
      await deleteExpense(id);
      router.refresh();
    });
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">การเงิน</h1>
          <p className="text-sm text-slate-500 mt-1">ภาพรวมการเงิน — {periodLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={activeDate || ''}
            onChange={e => {
              if (e.target.value) {
                router.push(`/admin/finance?date=${e.target.value}`);
              } else {
                router.push(`/admin/finance?range=this_month`);
              }
            }}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400 bg-white"
          />
          <select
            value={activeDate ? '' : activeRange}
            onChange={e => {
              if (e.target.value) {
                router.push(`/admin/finance?range=${e.target.value}`);
              }
            }}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-green-400 bg-white"
          >
            {activeDate && <option value="" disabled className="hidden">เลือกช่วงเวลา</option>}
            {Object.entries(RANGE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors w-fit"
          >
            <Plus size={16} /> บันทึกรายจ่าย
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">รายรับรวม</span>
            <div className="bg-slate-100 p-2 rounded-xl text-slate-500"><TrendingUp size={18} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 mb-1">฿{summary.totalIncome.toLocaleString()}</p>
          <p className="text-slate-400 text-xs">จากใบเสร็จ + ใบรับชำระที่ปิดยอดในช่วงนี้</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">รายจ่ายรวม</span>
            <div className="bg-slate-100 p-2 rounded-xl text-slate-500"><TrendingDown size={18} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 mb-1">฿{summary.totalExpense.toLocaleString()}</p>
          <p className="text-slate-400 text-xs">ต้นทุนสินค้า + เงินเดือน + รายจ่ายทั่วไป</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">กำไรสุทธิ</span>
            <div className="bg-green-50 p-2 rounded-xl text-green-600"><DollarSign size={18} /></div>
          </div>
          <p className={`text-3xl font-black mb-1 ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            ฿{summary.netProfit.toLocaleString()}
          </p>
          <p className="text-slate-400 text-xs">รายรับ − รายจ่าย</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">รายการ — {periodLabel}</h2>
            <span className="text-xs text-slate-400">{summary.transactions.length} รายการ</span>
          </div>
          <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
            {summary.transactions.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-12">ไม่มีรายการในช่วงนี้</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left px-4 py-3">วันที่</th>
                    <th className="text-left px-4 py-3">รายการ</th>
                    <th className="text-right px-4 py-3">จำนวนเงิน</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {summary.transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">{fmtDate(t.date)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-100 text-slate-500">
                            {t.type === 'in' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-xs leading-snug">{t.desc}</p>
                            <p className="text-xs text-slate-400">{t.ref}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3.5 text-right font-bold ${t.type === 'in' ? 'text-slate-800' : 'text-slate-500'}`}>
                        {t.type === 'in' ? '+' : '-'}฿{t.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        {t.deletable && (
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={isPending}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 disabled:opacity-40"
                            title="ลบรายจ่ายนี้"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Income/Expense Breakdown */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">รายรับตามหมวด</h3>
            {summary.incomeByCategory.length === 0 ? (
              <p className="text-sm text-slate-400">ไม่มีรายรับในช่วงนี้</p>
            ) : (
              <div className="space-y-3">
                {summary.incomeByCategory.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{cat.label}</span>
                      <span className={`font-bold ${cat.amount < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                        {cat.amount < 0 ? '-' : ''}฿{Math.abs(cat.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${cat.amount < 0 ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${cat.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">รายจ่ายตามหมวด</h3>
            {summary.expenseByCategory.length === 0 ? (
              <p className="text-sm text-slate-400">ไม่มีรายจ่ายในช่วงนี้</p>
            ) : (
              <div className="space-y-3">
                {summary.expenseByCategory.map((cat, i) => (
                  <div key={cat.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{cat.label}</span>
                      <span className="font-bold text-slate-800">฿{cat.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${['bg-slate-700', 'bg-slate-400', 'bg-slate-300'][i % 3]}`} style={{ width: `${cat.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">บันทึกรายจ่ายทั่วไป</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">หมวดรายจ่าย</label>
                <select
                  value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-green-400 bg-white"
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">รายละเอียด</label>
                <input
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="เช่น ค่าไฟเดือนมิถุนายน"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-green-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">จำนวนเงิน</label>
                  <input
                    type="number" min={0} value={amount || ''} onChange={e => setAmount(+e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">วันที่จ่าย</label>
                  <input
                    type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-green-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">หมายเหตุ (ถ้ามี)</label>
                <textarea
                  value={note} onChange={e => setNote(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-green-400 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button onClick={closeModal} className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">ยกเลิก</button>
              <button
                onClick={handleSave} disabled={isPending || !amount}
                className="px-5 py-2.5 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-40"
              >
                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
