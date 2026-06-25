'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, Save, Send,
  Building2, Phone, Mail, User, MapPin,
  Package, Hash, ChevronDown, AlertCircle, CheckCircle,
  Search, X,
} from 'lucide-react';
import type { SupplierRow } from '@/lib/purchasing';
import type { ProductRow } from '@/lib/products';
import { createPO, saveDraftPO, updatePO } from '@/app/actions/purchasing';
import type { POFormPayload } from '@/app/actions/purchasing';
import type { PORow } from '@/lib/purchasing';
import { createSupplier, type SupplierFormInput } from '@/app/actions/suppliers';
import { PickerModal } from '@/components/admin/picker-modal';

// ── constants ─────────────────────────────────────────────────────────────────

const UNITS = ['เส้น', 'ชุด', 'คู่', 'ชิ้น', 'กล่อง', 'แพ็ค'];

const PAYMENT_TERMS: Record<string, string> = {
  cash: 'ชำระทันที',
  '30': 'เครดิต 30 วัน',
  '45': 'เครดิต 45 วัน',
  '60': 'เครดิต 60 วัน',
};

const PAYMENT_METHODS: Record<string, string> = {
  transfer: 'โอนเงินธนาคาร',
  check:    'เช็คธนาคาร',
  cash:     'เงินสด',
};

type POType = 'standard' | 'urgent';

interface LineItem {
  key:         number;
  productName: string;
  unit:        string;
  qty:         number;
  unitPrice:   number;
  discount:    number;
  year:        string;
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

const EMPTY_SUPPLIER_FORM: SupplierFormInput = {
  name: '', address: '', contact: '', phone: '', email: '', taxId: '',
};

function SupplierModal({
  onClose, onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string, data: SupplierFormInput) => void;
}) {
  const [form, setForm] = useState<SupplierFormInput>(EMPTY_SUPPLIER_FORM);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function set<K extends keyof SupplierFormInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    setError('');
    startTransition(async () => {
      const res = await createSupplier(form);
      if (res.error || !res.id) { setError(res.error ?? 'เกิดข้อผิดพลาด'); return; }
      router.refresh();
      onCreated(res.id, form);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">เพิ่มซัพพลายเออร์ใหม่</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">ชื่อซัพพลายเออร์ <span className="text-green-500">*</span></label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="บริษัท ... จำกัด" className={inputCls} />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-1.5"><User size={11} /> ผู้ติดต่อ</label>
            <input value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="ชื่อผู้ติดต่อ" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-1.5"><Phone size={11} /> เบอร์โทร</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="02-XXX-XXXX" className={inputCls} />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-1.5"><Mail size={11} /> อีเมล</label>
              <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@supplier.com" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-1.5"><MapPin size={11} /> ที่อยู่</label>
            <textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} placeholder="ที่อยู่ซัพพลายเออร์" className={inputCls + ' resize-none'} />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-1.5"><Hash size={11} /> เลขที่ผู้เสียภาษี</label>
            <input value={form.taxId} onChange={(e) => set('taxId', e.target.value)} placeholder="0-0000-00000-00-0" className={inputCls} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">ยกเลิก</button>
          <button onClick={handleSubmit} disabled={isPending} className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50">
            {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function NewPurchasingClient({
  suppliers,
  products = [],
  initialData,
  poId,
}: {
  suppliers: SupplierRow[];
  products?: ProductRow[];
  initialData?: PORow;
  poId?: string;
}) {
  const isEditMode = !!poId;
  const [isPending, startTransition] = useTransition();

  // header
  const [poType, setPOType] = useState<POType>(initialData?.poType ?? 'standard');
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? initialData.dueDate.slice(0, 10) : '');

  // supplier
  const [supplierId, setSupplierId] = useState(initialData?.supplierSnapshot ? (suppliers.find(s => s.name === initialData.supplierSnapshot.name)?.id ?? '') : '');
  const [justCreatedSupplier, setJustCreatedSupplier] = useState<SupplierRow | null>(null);
  const supplier = suppliers.find(s => s.id === supplierId)
    ?? (justCreatedSupplier?.id === supplierId ? justCreatedSupplier : null);
  const [overrideAddress, setOverrideAddress] = useState(initialData?.supplierSnapshot.address ?? '');
  const [overrideContact, setOverrideContact] = useState(initialData?.supplierSnapshot.contact ?? '');
  const [overridePhone,   setOverridePhone]   = useState(initialData?.supplierSnapshot.phone ?? '');
  const [overrideEmail,   setOverrideEmail]   = useState(initialData?.supplierSnapshot.email ?? '');
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);

  function handleSupplierCreated(id: string, data: SupplierFormInput) {
    setJustCreatedSupplier({ id, ...data });
    setSupplierId(id);
    setOverrideAddress(data.address);
    setOverrideContact(data.contact);
    setOverridePhone(data.phone);
    setOverrideEmail(data.email);
    setSupplierModalOpen(false);
  }

  // line items
  const [lines, setLines] = useState<LineItem[]>(
    initialData?.items.length
      ? initialData.items.map((item, i) => ({ key: i + 1, ...item }))
      : [{ key: 1, productName: '', unit: 'เส้น', qty: 1, unitPrice: 0, discount: 0, year: '' }],
  );
  const [productPickerLineKey, setProductPickerLineKey] = useState<number | null>(null);

  function selectProduct(key: number, p: ProductRow) {
    setLines(prev => prev.map(l => l.key === key
      ? { ...l, productName: `${p.brand} ${p.model} ${p.size}`, unitPrice: p.costPrice || l.unitPrice, year: p.year || l.year }
      : l));
    setProductPickerLineKey(null);
  }

  // terms
  const [reference,       setReference]       = useState(initialData?.notes ?? '');
  const [paymentTerm,     setPaymentTerm]     = useState(initialData?.paymentTerm ?? '30');
  const [paymentDate,     setPaymentDate]     = useState('');
  const [paymentMethod,   setPaymentMethod]   = useState(initialData?.paymentMethod ?? 'transfer');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes,           setNotes]           = useState(initialData?.notes ?? '');
  const [specialTerms,    setSpecialTerms]    = useState('');

  // result
  const [result, setResult] = useState<{ poNumber: string; isDraft?: boolean } | null>(null);
  const [error, setError] = useState('');
  const [draftSaved, setDraftSaved] = useState('');

  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const s = suppliers.find(x => x.id === id);
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

  const addLine = () =>
    setLines(prev => [...prev, { key: Date.now(), productName: '', unit: 'เส้น', qty: 1, unitPrice: 0, discount: 0, year: '' }]);

  const removeLine = (key: number) =>
    setLines(prev => prev.filter(l => l.key !== key));

  const updateLine = (key: number, field: keyof Omit<LineItem, 'key'>, value: string | number) =>
    setLines(prev => prev.map(l => l.key === key ? { ...l, [field]: value } : l));

  const calc = useMemo(() => {
    const lineCalcs = lines.map(l => {
      const gross = l.qty * l.unitPrice;
      const discAmt = gross * (l.discount / 100);
      return { gross, discAmt, net: gross - discAmt };
    });
    const subtotal     = lineCalcs.reduce((s, l) => s + l.gross, 0);
    const totalDisc    = lineCalcs.reduce((s, l) => s + l.discAmt, 0);
    const afterDisc    = subtotal - totalDisc;
    const vat          = afterDisc * 0.07;
    const grand        = afterDisc + vat;
    return { lineCalcs, subtotal, totalDisc, afterDisc, vat, grand };
  }, [lines]);

  const isValid = !!supplierId && !!dueDate && lines.every(l => l.productName.trim() && l.qty > 0 && l.unitPrice > 0);

  function buildPayload(): POFormPayload {
    return {
      supplierId,
      supplierSnapshot: {
        name:    supplier?.name    ?? '',
        address: overrideAddress,
        contact: overrideContact,
        phone:   overridePhone,
        email:   overrideEmail,
        taxId:   supplier?.taxId  ?? '',
      },
      poType,
      reference,
      dueDate,
      items: lines.map((l, idx) => ({
        productName: l.productName,
        unit:        l.unit,
        qty:         l.qty,
        unitPrice:   l.unitPrice,
        discount:    l.discount,
        year:        l.year,
        lineTotal:   calc.lineCalcs[idx]?.net ?? 0,
      })),
      paymentTerm,
      paymentDate,
      paymentMethod,
      shippingAddress,
      notes,
      specialTerms,
      subtotal:      calc.subtotal,
      totalDiscount: calc.totalDisc,
      vat:           calc.vat,
      grandTotal:    calc.grand,
    };
  }

  const handleSubmit = () => {
    if (!isValid) return;
    setError('');
    startTransition(async () => {
      if (isEditMode) {
        const res = await updatePO(poId!, buildPayload(), 'pending');
        if (res.error) setError(res.error);
        else setResult({ poNumber: initialData!.poNumber });
      } else {
        const res = await createPO(buildPayload());
        if (res.error) setError(res.error);
        else setResult({ poNumber: res.poNumber! });
      }
    });
  };

  const handleSaveDraft = () => {
    setError('');
    startTransition(async () => {
      if (isEditMode) {
        const res = await updatePO(poId!, buildPayload(), 'draft');
        if (res.error) setError(res.error);
        else {
          setDraftSaved(`บันทึกร่าง ${initialData!.poNumber} แล้ว`);
          setTimeout(() => setDraftSaved(''), 3000);
        }
      } else {
        const res = await saveDraftPO(buildPayload());
        if (res.error) setError(res.error);
        else {
          setDraftSaved(`บันทึกร่าง ${res.poNumber} แล้ว`);
          setTimeout(() => setDraftSaved(''), 3000);
        }
      }
    });
  };

  // ── success screen ──────────────────────────────────────────────────────────

  if (result) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center px-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          {result.isDraft ? 'บันทึกร่างแล้ว' : 'สร้างใบสั่งซื้อสำเร็จ'}
        </h2>
        <p className="text-slate-500 mb-1">เลขที่ใบสั่งซื้อ</p>
        <p className="text-xl font-black text-green-600 mb-6">{result.poNumber}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/admin/purchasing" className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
            กลับหน้ารายการ
          </Link>
          <button onClick={() => setResult(null)} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700">
            สร้างใบสั่งซื้อใหม่
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
          <Link href="/admin/purchasing" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">
              {isEditMode ? `แก้ไข ${initialData!.poNumber}` : 'สร้างใบสั่งซื้อใหม่'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditMode ? initialData!.poNumber : 'ออกเลขที่อัตโนมัติ'} &nbsp;·&nbsp; {today()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {draftSaved && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle size={13} /> {draftSaved}
            </span>
          )}
          {error && <span className="text-xs text-red-600 font-semibold">{error}</span>}
          <button
            onClick={handleSaveDraft}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <Save size={15} /> บันทึกร่าง
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={15} /> {isPending ? 'กำลังบันทึก...' : 'ยืนยันสร้าง PO'}
          </button>
        </div>
      </div>

      {/* Row 1: General + Supplier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* General info */}
        <Section title="ข้อมูลทั่วไป" icon={<Hash size={14} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>เลขที่ใบสั่งซื้อ</Label>
                <input value="ออกอัตโนมัติ" disabled className={inputCls} />
              </div>
              <div>
                <Label>วันที่สั่งซื้อ</Label>
                <input value={today()} disabled className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>กำหนดรับสินค้า</Label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <Label>เลขที่อ้างอิง</Label>
                <input
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="เช่น INV-2025-001, QT-0045"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div />
              <div>
                <Label>ประเภทการสั่งซื้อ</Label>
                <div className="flex gap-2 mt-0.5">
                  {(['standard', 'urgent'] as POType[]).map(k => (
                    <button
                      key={k}
                      onClick={() => setPOType(k)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        poType === k
                          ? k === 'urgent' ? 'bg-green-600 text-white border-green-600' : 'bg-slate-800 text-white border-slate-800'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {k === 'standard' ? 'ปกติ' : 'เร่งด่วน'}
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
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select value={supplierId} onChange={e => handleSupplierChange(e.target.value)} className={inputCls + ' appearance-none pr-9'}>
                    <option value="">-- เลือกซัพพลายเออร์ --</option>
                    {justCreatedSupplier && !suppliers.some(s => s.id === justCreatedSupplier.id) && (
                      <option value={justCreatedSupplier.id}>{justCreatedSupplier.name}</option>
                    )}
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <button
                  type="button" onClick={() => setSupplierModalOpen(true)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition-colors"
                  title="เพิ่มซัพพลายเออร์ใหม่"
                >
                  <Plus size={14} /> เพิ่มใหม่
                </button>
              </div>
              {supplier && <p className="text-xs text-slate-400 mt-1">เลขที่ผู้เสียภาษี: {supplier.taxId || '—'}</p>}
            </div>
            {supplierId ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>ที่อยู่</Label>
                  <textarea value={overrideAddress} onChange={e => setOverrideAddress(e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="ที่อยู่ซัพพลายเออร์" />
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
            ) : (
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
            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center text-green-500"><Package size={14} /></div>
            <h2 className="font-bold text-slate-800 text-sm">รายการสินค้า</h2>
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
                <th className="text-left px-3 py-3">ชื่อสินค้า / รุ่น *</th>
                <th className="text-center px-3 py-3 w-20">ปี (Year)</th>
                <th className="text-center px-3 py-3 w-20">หน่วย</th>
                <th className="text-center px-3 py-3 w-24">จำนวน *</th>
                <th className="text-right px-3 py-3 w-32">ราคา/หน่วย (฿) *</th>
                <th className="text-right px-3 py-3 w-24">ส่วนลด (%)</th>
                <th className="text-right px-4 py-3 w-32">รวม (฿)</th>
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
                      <div className="flex gap-1.5">
                        <input value={line.productName} onChange={e => updateLine(line.key, 'productName', e.target.value)} placeholder="พิมพ์ชื่อสินค้า หรือกดค้นหา"
                          className="flex-1 px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 placeholder:text-slate-300" />
                        <button
                          type="button" onClick={() => setProductPickerLineKey(line.key)}
                          className="shrink-0 w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:border-green-300 hover:text-green-600 hover:bg-green-50 flex items-center justify-center transition-colors"
                          title="ค้นหาสินค้าจากคลัง"
                        >
                          <Search size={13} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <input value={line.year} onChange={e => updateLine(line.key, 'year', e.target.value)} placeholder="เช่น 24" maxLength={4}
                        className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 text-center placeholder:text-slate-300" />
                    </td>
                    <td className="px-3 py-2.5">
                      <select value={line.unit} onChange={e => updateLine(line.key, 'unit', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 text-center">
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <input type="number" min={1} value={line.qty} onChange={e => updateLine(line.key, 'qty', Math.max(1, Number(e.target.value)))}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 text-center" />
                    </td>
                    <td className="px-3 py-2.5">
                      <input type="number" min={0} value={line.unitPrice || ''} placeholder="0" onChange={e => updateLine(line.key, 'unitPrice', Number(e.target.value))}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 text-right placeholder:text-slate-300" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="relative">
                        <input type="number" min={0} max={100} value={line.discount || ''} placeholder="0"
                          onChange={e => updateLine(line.key, 'discount', Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-full px-2.5 py-2 pr-6 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 text-right placeholder:text-slate-300" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-800 text-xs tabular-nums">
                      ฿{net.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-2.5">
                      <button onClick={() => removeLine(line.key)} disabled={lines.length === 1}
                        className="w-7 h-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center disabled:opacity-0 group-hover:opacity-100">
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
        <div className="lg:col-span-3 space-y-5">
          <Section title="เงื่อนไขการสั่งซื้อ" icon={<MapPin size={14} />}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>เงื่อนไขชำระเงิน</Label>
                  <div className="relative">
                    <select value={paymentTerm} onChange={e => setPaymentTerm(e.target.value)} className={inputCls + ' appearance-none pr-9'}>
                      {Object.entries(PAYMENT_TERMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label>วันที่ชำระ (ตัวเลือก)</Label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <Label>วิธีการชำระเงิน</Label>
                  <div className="relative">
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputCls + ' appearance-none pr-9'}>
                      {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <Label>ที่อยู่จัดส่งสินค้า</Label>
                <textarea value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} rows={2} placeholder="ระบุที่อยู่จัดส่ง หรือ ใช้ที่อยู่ร้าน" className={inputCls + ' resize-none'} />
              </div>
              <div>
                <Label>หมายเหตุ</Label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="เช่น กรุณาจัดส่งในบรรจุภัณฑ์มาตรฐาน" className={inputCls + ' resize-none'} />
              </div>
              <div>
                <Label>เงื่อนไขพิเศษ</Label>
                <textarea value={specialTerms} onChange={e => setSpecialTerms(e.target.value)} rows={2} placeholder="เช่น รับประกันสินค้า, เงื่อนไขการคืนสินค้า" className={inputCls + ' resize-none'} />
              </div>
            </div>
          </Section>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden sticky top-4">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
              <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center text-green-500"><Hash size={14} /></div>
              <h2 className="font-bold text-slate-800 text-sm">สรุปมูลค่า</h2>
            </div>
            <div className="p-5 space-y-3">
              {[
                ['ราคารวมก่อนหักส่วนลด', `฿${calc.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`],
                ['ส่วนลดรวม', `-${calc.totalDisc > 0 ? `฿${calc.totalDisc.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '฿0.00'}`, 'emerald'],
                ['ราคาหลังหักส่วนลด', `฿${calc.afterDisc.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`],
                ['ภาษีมูลค่าเพิ่ม (VAT 7%)', `฿${calc.vat.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`],
              ].map(([label, value, color]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className={`font-semibold tabular-nums ${color === 'emerald' ? 'text-emerald-600' : 'text-slate-800'}`}>{value}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">มูลค่ารวมสุทธิ</span>
                  <span className="text-2xl font-black text-green-600 tabular-nums">฿{calc.grand.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="text-xs text-slate-400 text-right mt-1">รวมภาษีมูลค่าเพิ่มแล้ว</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 mt-2 space-y-2 text-xs text-slate-500">
                <div className="flex justify-between"><span>เงื่อนไขชำระเงิน</span><span className="font-semibold text-slate-700">{PAYMENT_TERMS[paymentTerm]}</span></div>
                <div className="flex justify-between"><span>วิธีชำระเงิน</span><span className="font-semibold text-slate-700">{PAYMENT_METHODS[paymentMethod]}</span></div>
                {poType === 'urgent' && (
                  <div className="flex justify-between"><span>ประเภท</span><span className="font-bold text-green-600">เร่งด่วน</span></div>
                )}
              </div>

              {!isValid && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  <span>กรุณากรอก: ซัพพลายเออร์, กำหนดรับสินค้า และรายการสินค้า</span>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button onClick={handleSubmit} disabled={!isValid || isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Send size={15} /> {isPending ? 'กำลังบันทึก...' : 'ยืนยันสร้าง PO'}
                </button>
                <button onClick={handleSaveDraft} disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-40">
                  <Save size={14} /> บันทึกร่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {supplierModalOpen && (
        <SupplierModal
          onClose={() => setSupplierModalOpen(false)}
          onCreated={handleSupplierCreated}
        />
      )}

      {productPickerLineKey !== null && (
        <PickerModal
          title="เลือกสินค้า / ยาง"
          placeholder="ค้นหายี่ห้อ รุ่น หรือขนาดยาง..."
          items={products}
          filterFn={(p, q) => `${p.brand} ${p.model} ${p.size}`.toLowerCase().includes(q)}
          renderItem={(p) => (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{p.brand} {p.model}</p>
                <p className="text-xs text-slate-400">{p.size}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-amber-600">
                  {p.costPrice ? `ต้นทุน ฿${p.costPrice.toLocaleString()}` : 'ยังไม่มีราคาต้นทุน'}
                </p>
                <p className="text-[11px] text-slate-400">ราคาขาย ฿{p.priceCash.toLocaleString()}</p>
                <p className={`text-[10px] font-semibold ${p.stock === 0 ? 'text-red-500' : 'text-slate-400'}`}>สต็อก {p.stock}</p>
              </div>
            </div>
          )}
          onSelect={(p) => selectProduct(productPickerLineKey, p)}
          onClose={() => setProductPickerLineKey(null)}
        />
      )}
    </div>
  );
}
