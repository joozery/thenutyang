'use client';

import { useState } from 'react';
import { Wallet } from 'lucide-react';
import type { PaymentMethod } from '@/lib/documents';
import { fmtMoney } from './shared';

export function RecordPaymentForm({
  remaining,
  onSubmit,
  isPending,
}: {
  remaining: number;
  onSubmit: (amount: number, method: PaymentMethod, note: string) => void;
  isPending: boolean;
}) {
  const [amount, setAmount] = useState(remaining);
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [note, setNote]     = useState('');

  function submit() {
    if (!amount || amount <= 0 || amount > remaining + 0.01) return;
    onSubmit(amount, method, note);
    setNote('');
  }

  return (
    <div className="bg-white border border-slate-200/60 shadow-sm rounded-lg p-4 space-y-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">บันทึกรับชำระงวดนี้</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">จำนวนเงิน</label>
          <input
            type="number" min={0} max={remaining} value={amount || ''}
            onChange={e => setAmount(+e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">ช่องทาง</label>
          <select
            value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="cash">เงินสด</option>
            <option value="transfer">โอนเงิน</option>
            <option value="credit_card">บัตรเครดิต</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">หมายเหตุ (ถ้ามี)</label>
          <input
            value={note} onChange={e => setNote(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-400">คงเหลือ ฿{fmtMoney(remaining)}</p>
        <button
          type="button" onClick={submit}
          disabled={isPending || !amount || amount <= 0 || amount > remaining + 0.01}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-40 shadow-sm"
        >
          <Wallet size={14} /> บันทึกรับชำระ
        </button>
      </div>
    </div>
  );
}
