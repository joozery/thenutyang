'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, Send, FileText,
  User, Phone, Car, Hash, ChevronDown,
  AlertCircle, CheckCircle, Receipt, FileEdit, FileMinus,
} from 'lucide-react';
import { createDocument } from '@/app/actions/documents';
import type { DocFormPayload } from '@/app/actions/documents';
import type { DocType, PaymentMethod } from '@/lib/documents';

// ── constants ─────────────────────────────────────────────────────────────────

const DOC_TYPES: { value: DocType; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'invoice',     label: 'ใบเสร็จ / ใบกำกับภาษี', desc: 'บันทึกการขายที่ชำระแล้ว',         icon: <Receipt  size={18} /> },
  { value: 'quote',       label: 'ใบเสนอราคา',              desc: 'เสนอราคาให้ลูกค้าก่อนตัดสินใจ',   icon: <FileEdit size={18} /> },
  { value: 'credit_note', label: 'ใบลดหนี้',                desc: 'ลดยอดหนี้จากใบเสร็จที่ออกแล้ว',  icon: <FileMinus size={18} /> },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash',        label: 'เงินสด' },
  { value: 'transfer',    label: 'โอนเงินธนาคาร' },
  { value: 'credit_card', label: 'บัตรเครดิต' },
  { value: 'pending',     label: 'รอชำระ' },
];

// ── types ─────────────────────────────────────────────────────────────────────

interface LineItem {
  key:         number;
  description: string;
  qty:         number;
  unitPrice:   number;
  discount:    number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10 transition-colors placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400";

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center text-green-500">{icon}</div>
        <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
      {children}{required && <span className="text-green-500 ml-0.5">*</span>}
    </label>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function NewDocumentClient() {
  const [isPending, startTransition] = useTransition();

  // doc type
  const [docType, setDocType] = useState<DocType>('invoice');

  // customer
  const [customerName,  setCustomerName]  = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCar,   setCustomerCar]   = useState('');

  // line items
  const [lines, setLines] = useState<LineItem[]>([
    { key: 1, description: '', qty: 1, unitPrice: 0, discount: 0 },
  ]);

  // financial
  const [vatEnabled,     setVatEnabled]     = useState(true);
  const [paymentMethod,  setPaymentMethod]  = useState<PaymentMethod>('cash');

  // meta
  const [dueDate, setDueDate] = useState('');
  const [note,    setNote]    = useState('');

  // result / error
  const [result, setResult] = useState<string | null>(null);
  const [error,  setError]  = useState('');

  // ── line item helpers ──────────────────────────────────────────────────────

  const addLine = () =>
    setLines(p => [...p, { key: Date.now(), description: '', qty: 1, unitPrice: 0, discount: 0 }]);

  const removeLine = (key: number) =>
    setLines(p => p.filter(l => l.key !== key));

  const updateLine = (key: number, field: keyof Omit<LineItem, 'key'>, value: string | number) =>
    setLines(p => p.map(l => l.key === key ? { ...l, [field]: value } : l));

  // ── calculations ──────────────────────────────────────────────────────────

  const calc = useMemo(() => {
    const lineCalcs = lines.map(l => {
      const gross  = l.qty * l.unitPrice;
      const discAmt = gross * (l.discount / 100);
      return { gross, discAmt, net: gross - discAmt };
    });
    const subtotal      = lineCalcs.reduce((s, l) => s + l.gross, 0);
    const discountTotal = lineCalcs.reduce((s, l) => s + l.discAmt, 0);
    const afterDisc     = subtotal - discountTotal;
    const vatAmount     = vatEnabled ? afterDisc * 0.07 : 0;
    const grandTotal    = afterDisc + vatAmount;
    return { lineCalcs, subtotal, discountTotal, afterDisc, vatAmount, grandTotal };
  }, [lines, vatEnabled]);

  // ── validation ─────────────────────────────────────────────────────────────

  const isValid = !!customerName.trim() && lines.every(l => l.description.trim() && l.qty > 0 && l.unitPrice >= 0);

  // ── submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!isValid) return;
    setError('');
    startTransition(async () => {
      const payload: DocFormPayload = {
        type:         docType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerCar:   customerCar.trim(),
        items: lines.map((l, idx) => ({
          description: l.description,
          qty:         l.qty,
          unitPrice:   l.unitPrice,
          discount:    l.discount,
          lineTotal:   calc.lineCalcs[idx]?.net ?? 0,
        })),
        subtotal:      calc.subtotal,
        discountTotal: calc.discountTotal,
        vatRate:       vatEnabled ? 7 : 0,
        vatAmount:     calc.vatAmount,
        grandTotal:    calc.grandTotal,
        paymentMethod,
        note:          note.trim(),
        dueDate,
      };
      const res = await createDocument(payload);
      if (res.error) setError(res.error);
      else setResult(res.docNumber!);
    });
  };

  // ── success screen ──────────────────────────────────────────────────────────

  if (result) {
    const typeLabel = DOC_TYPES.find(t => t.value === docType)?.label ?? 'เอกสาร';
    return (
      <div className="max-w-md mx-auto mt-24 text-center px-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">สร้าง{typeLabel}สำเร็จ</h2>
        <p className="text-slate-500 mb-1">เลขที่เอกสาร</p>
        <p className="text-xl font-black text-green-600 mb-6">{result}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/admin/documents" className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
            กลับหน้ารายการ
          </Link>
          <button onClick={() => { setResult(null); setCustomerName(''); setCustomerPhone(''); setCustomerCar(''); setLines([{ key: 1, description: '', qty: 1, unitPrice: 0, discount: 0 }]); setNote(''); setDueDate(''); }}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700">
            สร้างเอกสารใหม่
          </button>
        </div>
      </div>
    );
  }

  // ── form ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/documents" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">สร้างเอกสารใหม่</h1>
            <p className="text-xs text-slate-400 mt-0.5">ออกเลขที่อัตโนมัติ &nbsp;·&nbsp; {today()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
              <AlertCircle size={13} /> {error}
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={15} /> {isPending ? 'กำลังบันทึก...' : 'สร้างเอกสาร'}
          </button>
        </div>
      </div>

      {/* Row 1: Type selector */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
          <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center text-green-500"><FileText size={14} /></div>
          <h2 className="font-bold text-slate-800 text-sm">ประเภทเอกสาร</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DOC_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setDocType(t.value)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                docType === t.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`mt-0.5 ${docType === t.value ? 'text-green-600' : 'text-slate-400'}`}>{t.icon}</div>
              <div>
                <p className={`font-bold text-sm ${docType === t.value ? 'text-green-700' : 'text-slate-700'}`}>{t.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Info + Customer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Doc info */}
        <Section title="ข้อมูลเอกสาร" icon={<Hash size={14} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>เลขที่เอกสาร</Label>
                <input value="ออกอัตโนมัติ" disabled className={inputCls} />
              </div>
              <div>
                <Label>วันที่ออกเอกสาร</Label>
                <input value={today()} disabled className={inputCls} />
              </div>
            </div>
            {(docType === 'quote') && (
              <div>
                <Label>วันหมดอายุ (ใบเสนอราคา)</Label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
              </div>
            )}
            <div>
              <Label>วิธีชำระเงิน</Label>
              <div className="relative">
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className={inputCls + ' appearance-none pr-9'}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="หมายเหตุเพิ่มเติม..." className={inputCls + ' resize-none'} />
            </div>
          </div>
        </Section>

        {/* Customer */}
        <Section title="ข้อมูลลูกค้า" icon={<User size={14} />}>
          <div className="space-y-4">
            <div>
              <Label required>ชื่อลูกค้า</Label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="ชื่อ-นามสกุล หรือชื่อบริษัท"
                  className={inputCls + ' pl-8'}
                />
              </div>
            </div>
            <div>
              <Label>เบอร์โทรศัพท์</Label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className={inputCls + ' pl-8'}
                />
              </div>
            </div>
            <div>
              <Label>รุ่นรถ / ปีรถ</Label>
              <div className="relative">
                <Car size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={customerCar}
                  onChange={e => setCustomerCar(e.target.value)}
                  placeholder="เช่น Toyota Camry 2022"
                  className={inputCls + ' pl-8'}
                />
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Row 3: Line items */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center text-green-500">
              <Hash size={14} />
            </div>
            <h2 className="font-bold text-slate-800 text-sm">รายการสินค้า / บริการ</h2>
            <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 font-semibold">{lines.length} รายการ</span>
          </div>
          <button onClick={addLine} className="flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg">
            <Plus size={13} /> เพิ่มรายการ
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-400 font-semibold border-b border-slate-100">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-3 py-3">รายการ / รุ่นยาง *</th>
                <th className="text-center px-3 py-3 w-24">จำนวน *</th>
                <th className="text-right px-3 py-3 w-36">ราคา/หน่วย (฿) *</th>
                <th className="text-right px-3 py-3 w-24">ส่วนลด (%)</th>
                <th className="text-right px-4 py-3 w-36">รวม (฿)</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lines.map((line, idx) => {
                const { net } = calc.lineCalcs[idx] ?? { net: 0 };
                return (
                  <tr key={line.key} className="group hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 text-xs text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <input
                        value={line.description}
                        onChange={e => updateLine(line.key, 'description', e.target.value)}
                        placeholder="เช่น Michelin Pilot Sport 4 225/45R17"
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 placeholder:text-slate-300"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number" min={1} value={line.qty}
                        onChange={e => updateLine(line.key, 'qty', Math.max(1, Number(e.target.value)))}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 text-center"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number" min={0} value={line.unitPrice || ''} placeholder="0"
                        onChange={e => updateLine(line.key, 'unitPrice', Number(e.target.value))}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 text-right placeholder:text-slate-300"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="relative">
                        <input
                          type="number" min={0} max={100} value={line.discount || ''} placeholder="0"
                          onChange={e => updateLine(line.key, 'discount', Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-full px-2.5 py-2 pr-6 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 text-right placeholder:text-slate-300"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-800 text-xs tabular-nums">
                      ฿{net.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        onClick={() => removeLine(line.key)}
                        disabled={lines.length === 1}
                        className="w-7 h-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center disabled:opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Summary */}
      <div className="flex justify-end">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden w-full max-w-sm">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center text-green-500"><Hash size={14} /></div>
            <h2 className="font-bold text-slate-800 text-sm">สรุปมูลค่า</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">ราคารวมก่อนหักส่วนลด</span>
              <span className="font-semibold tabular-nums">฿{calc.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
            {calc.discountTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">ส่วนลดรวม</span>
                <span className="font-semibold text-emerald-600 tabular-nums">-฿{calc.discountTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {calc.discountTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">ราคาหลังหักส่วนลด</span>
                <span className="font-semibold tabular-nums">฿{calc.afterDisc.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* VAT toggle */}
            <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-3">
              <span className="text-slate-500">ภาษีมูลค่าเพิ่ม VAT 7%</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVatEnabled(!vatEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${vatEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${vatEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className={`font-semibold tabular-nums ${vatEnabled ? '' : 'text-slate-300'}`}>
                  ฿{calc.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">มูลค่ารวมสุทธิ</span>
                <span className="text-2xl font-black text-green-600 tabular-nums">฿{calc.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {!isValid && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>กรุณากรอก: ชื่อลูกค้า และรายการสินค้า</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isValid || isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              <Send size={15} /> {isPending ? 'กำลังบันทึก...' : 'สร้างเอกสาร'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
