"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Save, Send,
  Building2, Phone, Mail, User, MapPin,
  Package, Hash, ChevronDown, AlertCircle,
  CheckCircle,
} from 'lucide-react';

// --- Types ---
interface Supplier {
  id: string;
  name: string;
  address: string;
  contact: string;
  phone: string;
  email: string;
  taxId: string;
}

interface LineItem {
  key: number;
  productCode: string;
  productName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  discount: number;
}

type PaymentTerm = '30' | '45' | '60' | 'cash';
type PaymentMethod = 'transfer' | 'check' | 'cash';
type POType = 'standard' | 'urgent';

// --- Mock suppliers — TODO: replace with GET /api/suppliers ---
const SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    name: 'บริษัท มิชลิน (ประเทศไทย) จำกัด',
    address: '689 ภิรัช ทาวเวอร์ แอท เอ็มควอเทียร์ ชั้น 21 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
    contact: 'คุณสมชาย วงศ์ไทย',
    phone: '02-XXX-XXXX',
    email: 'sales.th@michelin.com',
    taxId: '0105534001234',
  },
  {
    id: 'sup-002',
    name: 'บริดจสโตน เซลส์ (ประเทศไทย) จำกัด',
    address: '175 อาคารสาทรซิตี้ทาวเวอร์ ชั้น 20 ถ.สาทรใต้ แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพฯ 10120',
    contact: 'คุณวิชัย ประสงค์ดี',
    phone: '02-XXX-XXXX',
    email: 'sales@bridgestone.co.th',
    taxId: '0105534005678',
  },
  {
    id: 'sup-003',
    name: 'ยางโยโกฮาม่า ไทย จำกัด',
    address: '388 ถ.สี่พระยา แขวงสี่พระยา เขตบางรัก กรุงเทพฯ 10500',
    contact: 'คุณนิรันดร์ รุ่งเรือง',
    phone: '02-XXX-XXXX',
    email: 'sales@yokohama.co.th',
    taxId: '0105534009012',
  },
  {
    id: 'sup-004',
    name: 'ดันลอป ไทร์ ประเทศไทย จำกัด',
    address: '62/1 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310',
    contact: 'คุณสุดาพร มั่นคง',
    phone: '02-XXX-XXXX',
    email: 'sales@dunlop.co.th',
    taxId: '0105534003456',
  },
  {
    id: 'sup-005',
    name: 'บริษัท กู๊ดเยียร์ ไทยแลนด์ จำกัด',
    address: '1 ซ.เฉยพ่วง ถ.วิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
    contact: 'คุณประเสริฐ ชำนาญ',
    phone: '02-XXX-XXXX',
    email: 'sales@goodyear.co.th',
    taxId: '0105534007890',
  },
  {
    id: 'sup-006',
    name: 'ปิเรลลี่ ไทยแลนด์ จำกัด',
    address: '345 อาคารพาร์คเวนเชอร์ ชั้น 15 ถ.วิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330',
    contact: 'คุณอรรถพล บุญมี',
    phone: '02-XXX-XXXX',
    email: 'sales@pirelli.co.th',
    taxId: '0105534002345',
  },
  {
    id: 'sup-007',
    name: 'คอนติเนนทัล ไทร์ส (ประเทศไทย) จำกัด',
    address: '191 อาคารซิลลิค ชั้น 22 ถ.สีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500',
    contact: 'คุณธีรยุทธ สุขใจ',
    phone: '02-XXX-XXXX',
    email: 'sales@continental.co.th',
    taxId: '0105534006789',
  },
];

const UNITS = ['เส้น', 'ชุด', 'คู่', 'ชิ้น', 'กล่อง', 'แพ็ค'];

const PAYMENT_TERMS: Record<PaymentTerm, string> = {
  cash: 'ชำระทันที',
  '30': 'เครดิต 30 วัน',
  '45': 'เครดิต 45 วัน',
  '60': 'เครดิต 60 วัน',
};

const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  transfer: 'โอนเงินธนาคาร',
  check: 'เช็คธนาคาร',
  cash: 'เงินสด',
};

const PO_TYPES: Record<POType, { label: string; color: string }> = {
  standard: { label: 'ปกติ', color: 'bg-slate-100 text-slate-600' },
  urgent: { label: 'เร่งด่วน', color: 'bg-rose-100 text-rose-600' },
};

function generatePONumber() {
  return `PO-2024-${String(Math.floor(Math.random() * 10) + 90).padStart(3, '0')}`;
}

function today() {
  return new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

// --- Reusable Section wrapper ---
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500">
          {icon}
        </div>
        <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
      {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 transition-colors placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400";

// --- Main Page ---
export default function NewPurchasingPage() {
  const router = useRouter();

  // PO header
  const [poNumber] = useState(generatePONumber);
  const [poType, setPOType] = useState<POType>('standard');
  const [dueDate, setDueDate] = useState('');

  // Supplier
  const [supplierId, setSupplierId] = useState('');
  const supplier = SUPPLIERS.find(s => s.id === supplierId) ?? null;
  const [overrideAddress, setOverrideAddress] = useState('');
  const [overrideContact, setOverrideContact] = useState('');
  const [overridePhone, setOverridePhone] = useState('');
  const [overrideEmail, setOverrideEmail] = useState('');

  // Line items
  const [lines, setLines] = useState<LineItem[]>([
    { key: 1, productCode: '', productName: '', unit: 'เส้น', qty: 1, unitPrice: 0, discount: 0 },
  ]);

  // Terms
  const [paymentTerm, setPaymentTerm] = useState<PaymentTerm>('30');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [specialTerms, setSpecialTerms] = useState('');

  // UI state
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync supplier fields when supplier selected
  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const s = SUPPLIERS.find(x => x.id === id);
    if (s) {
      setOverrideAddress(s.address);
      setOverrideContact(s.contact);
      setOverridePhone(s.phone);
      setOverrideEmail(s.email);
    } else {
      setOverrideAddress('');
      setOverrideContact('');
      setOverridePhone('');
      setOverrideEmail('');
    }
  };

  // Line item operations
  const addLine = () =>
    setLines(prev => [...prev, { key: Date.now(), productCode: '', productName: '', unit: 'เส้น', qty: 1, unitPrice: 0, discount: 0 }]);

  const removeLine = (key: number) =>
    setLines(prev => prev.filter(l => l.key !== key));

  const updateLine = (key: number, field: keyof Omit<LineItem, 'key'>, value: string | number) =>
    setLines(prev => prev.map(l => l.key === key ? { ...l, [field]: value } : l));

  // Calculations
  const calc = useMemo(() => {
    const lineCalcs = lines.map(l => {
      const gross = l.qty * l.unitPrice;
      const discAmt = gross * (l.discount / 100);
      return { gross, discAmt, net: gross - discAmt };
    });
    const subtotal = lineCalcs.reduce((s, l) => s + l.gross, 0);
    const totalDisc = lineCalcs.reduce((s, l) => s + l.discAmt, 0);
    const afterDisc = subtotal - totalDisc;
    const vat = afterDisc * 0.07;
    const grand = afterDisc + vat;
    return { lineCalcs, subtotal, totalDisc, afterDisc, vat, grand };
  }, [lines]);

  const isValid = supplierId && dueDate && lines.every(l => l.productName.trim() && l.qty > 0 && l.unitPrice > 0);

  // TODO: replace with POST /api/purchase-orders
  const handleSubmit = () => {
    if (!isValid) return;
    setSubmitted(true);
  };

  // TODO: replace with POST /api/purchase-orders { status: 'draft' }
  const handleSaveDraft = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center px-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">สร้างใบสั่งซื้อสำเร็จ</h2>
        <p className="text-slate-500 mb-1">เลขที่ใบสั่งซื้อ</p>
        <p className="text-xl font-black text-rose-600 mb-6">{poNumber}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/admin/purchasing" className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            กลับหน้ารายการ
          </Link>
          <button onClick={() => setSubmitted(false)} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors">
            สร้างใบสั่งซื้อใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/purchasing"
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">สร้างใบสั่งซื้อใหม่</h1>
            <p className="text-xs text-slate-400 mt-0.5">{poNumber} &nbsp;·&nbsp; {today()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle size={13} /> บันทึกร่างแล้ว
            </span>
          )}
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Save size={15} /> บันทึกร่าง
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={15} /> ยืนยันสร้าง PO
          </button>
        </div>
      </div>

      {/* Row 1: General info + Supplier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* General info */}
        <Section title="ข้อมูลทั่วไป" icon={<Hash size={14} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>เลขที่ใบสั่งซื้อ</Label>
                <input value={poNumber} disabled className={inputCls} />
              </div>
              <div>
                <Label>วันที่สั่งซื้อ</Label>
                <input value={today()} disabled className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>กำหนดรับสินค้า</Label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label>ประเภทการสั่งซื้อ</Label>
                <div className="flex gap-2 mt-0.5">
                  {(Object.entries(PO_TYPES) as [POType, { label: string; color: string }][]).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setPOType(k)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        poType === k
                          ? k === 'urgent'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-800 text-white border-slate-800'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Supplier */}
        <Section title="ข้อมูลซัพพลายเออร์" icon={<Building2 size={14} />}>
          <div className="space-y-3">
            <div>
              <Label required>ซัพพลายเออร์</Label>
              <div className="relative">
                <select
                  value={supplierId}
                  onChange={e => handleSupplierChange(e.target.value)}
                  className={inputCls + ' appearance-none pr-9'}
                >
                  <option value="">-- เลือกซัพพลายเออร์ --</option>
                  {SUPPLIERS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {supplier && (
                <p className="text-xs text-slate-400 mt-1">เลขที่ผู้เสียภาษี: {supplier.taxId}</p>
              )}
            </div>

            {supplierId && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>ที่อยู่</Label>
                  <textarea
                    value={overrideAddress}
                    onChange={e => setOverrideAddress(e.target.value)}
                    rows={2}
                    className={inputCls + ' resize-none'}
                    placeholder="ที่อยู่ซัพพลายเออร์"
                  />
                </div>
                <div>
                  <Label>ผู้ติดต่อ</Label>
                  <div className="relative">
                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={overrideContact} onChange={e => setOverrideContact(e.target.value)} className={inputCls + ' pl-8'} placeholder="ชื่อผู้ติดต่อ" />
                  </div>
                </div>
                <div>
                  <Label>เบอร์โทรศัพท์</Label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={overridePhone} onChange={e => setOverridePhone(e.target.value)} className={inputCls + ' pl-8'} placeholder="02-XXX-XXXX" />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>อีเมล</Label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={overrideEmail} onChange={e => setOverrideEmail(e.target.value)} className={inputCls + ' pl-8'} placeholder="email@supplier.com" />
                  </div>
                </div>
              </div>
            )}

            {!supplierId && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
                <AlertCircle size={14} className="shrink-0" />
                เลือกซัพพลายเออร์เพื่อกรอกข้อมูล
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Row 2: Line items */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500">
              <Package size={14} />
            </div>
            <h2 className="font-bold text-slate-800 text-sm">รายการสินค้า</h2>
            <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 font-semibold">
              {lines.length} รายการ
            </span>
          </div>
          <button
            onClick={addLine}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={13} /> เพิ่มรายการ
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-400 font-semibold border-b border-slate-100">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-3 py-3 w-24">รหัสสินค้า</th>
                <th className="text-left px-3 py-3">ชื่อสินค้า / รุ่น *</th>
                <th className="text-center px-3 py-3 w-24">หน่วย</th>
                <th className="text-center px-3 py-3 w-24">จำนวน *</th>
                <th className="text-right px-3 py-3 w-32">ราคา/หน่วย (฿) *</th>
                <th className="text-right px-3 py-3 w-24">ส่วนลด (%)</th>
                <th className="text-right px-4 py-3 w-32">รวม (฿)</th>
                <th className="w-10 px-2 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lines.map((line, idx) => {
                const { net } = calc.lineCalcs[idx] ?? { net: 0 };
                return (
                  <tr key={line.key} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <input
                        value={line.productCode}
                        onChange={e => updateLine(line.key, 'productCode', e.target.value)}
                        placeholder="SKU-XXXX"
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-500/10 placeholder:text-slate-300"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={line.productName}
                        onChange={e => updateLine(line.key, 'productName', e.target.value)}
                        placeholder="เช่น Michelin Pilot Sport 4 225/45R17"
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-500/10 placeholder:text-slate-300"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={line.unit}
                        onChange={e => updateLine(line.key, 'unit', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-rose-400 text-center"
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={e => updateLine(line.key, 'qty', Math.max(1, Number(e.target.value)))}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-rose-400 text-center"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        min={0}
                        value={line.unitPrice || ''}
                        placeholder="0"
                        onChange={e => updateLine(line.key, 'unitPrice', Number(e.target.value))}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-rose-400 text-right placeholder:text-slate-300"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={line.discount || ''}
                          placeholder="0"
                          onChange={e => updateLine(line.key, 'discount', Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-full px-2.5 py-2 pr-6 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-rose-400 text-right placeholder:text-slate-300"
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
                        className="w-7 h-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-0 group-hover:opacity-100"
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

      {/* Row 3: Terms + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Terms */}
        <div className="lg:col-span-3 space-y-5">
          <Section title="เงื่อนไขการสั่งซื้อ" icon={<MapPin size={14} />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>เงื่อนไขการชำระเงิน</Label>
                  <div className="relative">
                    <select
                      value={paymentTerm}
                      onChange={e => setPaymentTerm(e.target.value as PaymentTerm)}
                      className={inputCls + ' appearance-none pr-9'}
                    >
                      {(Object.entries(PAYMENT_TERMS) as [PaymentTerm, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label>วิธีการชำระเงิน</Label>
                  <div className="relative">
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className={inputCls + ' appearance-none pr-9'}
                    >
                      {(Object.entries(PAYMENT_METHODS) as [PaymentMethod, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <Label>ที่อยู่จัดส่งสินค้า</Label>
                <textarea
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  rows={2}
                  placeholder="ระบุที่อยู่จัดส่ง หรือ ใช้ที่อยู่ร้าน"
                  className={inputCls + ' resize-none'}
                />
              </div>
              <div>
                <Label>หมายเหตุ / ข้อกำหนดพิเศษ</Label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="เช่น กรุณาจัดส่งในบรรจุภัณฑ์มาตรฐาน"
                  className={inputCls + ' resize-none'}
                />
              </div>
              <div>
                <Label>เงื่อนไขพิเศษเพิ่มเติม</Label>
                <textarea
                  value={specialTerms}
                  onChange={e => setSpecialTerms(e.target.value)}
                  rows={2}
                  placeholder="เช่น รับประกันสินค้า, เงื่อนไขการคืนสินค้า"
                  className={inputCls + ' resize-none'}
                />
              </div>
            </div>
          </Section>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden sticky top-4">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
              <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500">
                <Hash size={14} />
              </div>
              <h2 className="font-bold text-slate-800 text-sm">สรุปมูลค่า</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">ราคารวมก่อนหักส่วนลด</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  ฿{calc.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">ส่วนลดรวม</span>
                <span className="font-semibold text-emerald-600 tabular-nums">
                  -{calc.totalDisc > 0 ? `฿${calc.totalDisc.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '฿0.00'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">ราคาหลังหักส่วนลด</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  ฿{calc.afterDisc.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  ฿{calc.vat.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">มูลค่ารวมสุทธิ</span>
                  <span className="text-2xl font-black text-rose-600 tabular-nums">
                    ฿{calc.grand.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 text-right mt-1">รวมภาษีมูลค่าเพิ่มแล้ว</p>
              </div>

              {/* Summary info */}
              <div className="bg-slate-50 rounded-xl p-3 mt-2 space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>เงื่อนไขชำระเงิน</span>
                  <span className="font-semibold text-slate-700">{PAYMENT_TERMS[paymentTerm]}</span>
                </div>
                <div className="flex justify-between">
                  <span>วิธีชำระเงิน</span>
                  <span className="font-semibold text-slate-700">{PAYMENT_METHODS[paymentMethod]}</span>
                </div>
                {poType === 'urgent' && (
                  <div className="flex justify-between">
                    <span>ประเภท</span>
                    <span className="font-bold text-rose-600">เร่งด่วน</span>
                  </div>
                )}
              </div>

              {/* Validation hint */}
              {!isValid && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  <span>กรุณากรอกข้อมูลที่จำเป็น: ซัพพลายเออร์, กำหนดรับสินค้า และรายการสินค้า</span>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={15} /> ยืนยันสร้าง PO
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Save size={14} /> บันทึกร่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
