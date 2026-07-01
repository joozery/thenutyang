'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Send, FileText,
  User, Phone, Mail, Hash, ChevronDown,
  AlertCircle, Receipt, FileEdit, FileMinus, FileClock, BookMarked,
  Search, X, Building2, MapPin, Car, UserPlus, Wrench, PackageSearch, Gauge, HardHat, Banknote, Check,
} from 'lucide-react';
import { createDocument, updateDocument } from '@/app/actions/documents';
import type { DocFormPayload } from '@/app/actions/documents';
import type { DocType, PaymentMethod } from '@/lib/documents';
import type { UnifiedCustomerRow } from '@/lib/customers';
import type { VehicleEntry } from '@/app/actions/customers';
import { addVehicleToCustomer } from '@/app/actions/customers';
import type { ProductRow } from '@/lib/products';
import type { ServiceItemRow } from '@/lib/service-items';
import type { getActiveEmployees } from '@/lib/employees';
type ActiveEmployee = Awaited<ReturnType<typeof getActiveEmployees>>[number];
import { createServiceItem } from '@/app/actions/service-items';
import { createCarBrand, createCarModel } from '@/app/actions/car-data';
import type { CarBrandRow, CarModelRow } from '@/app/actions/car-data';
import { PickerModal } from '@/components/admin/picker-modal';
import { CustomerModal } from '@/components/admin/customers-client';
import { parseCarInfo, composeCarInfo } from '@/lib/car-info';

// ── constants ─────────────────────────────────────────────────────────────────

const DOC_TYPES: { value: DocType; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'invoice',      label: 'ใบเสร็จ / ใบกำกับภาษี', desc: 'บันทึกการขายที่ชำระแล้ว',         icon: <Receipt  size={18} /> },
  { value: 'quote',        label: 'ใบเสนอราคา',              desc: 'เสนอราคาให้ลูกค้าก่อนตัดสินใจ',   icon: <FileEdit size={18} /> },
  { value: 'billing_note', label: 'ใบแจ้งหนี้',              desc: 'บิลเครดิต ออกก่อนรับเงิน รอลูกค้าชำระ (จ่ายเป็นงวดได้)', icon: <FileClock size={18} /> },
  { value: 'credit_note',  label: 'ใบลดหนี้',                desc: 'ลดยอดหนี้จากใบเสร็จที่ออกแล้ว',  icon: <FileMinus   size={18} /> },
  { value: 'booking_note', label: 'ใบจอง',                  desc: 'จองสินค้าล่วงหน้า รับมัดจำ นัดวันรับรถ', icon: <BookMarked size={18} /> },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash',        label: 'เงินสด' },
  { value: 'transfer',    label: 'โอนเงินธนาคาร' },
  { value: 'credit_card', label: 'บัตรเครดิต' },
  { value: 'pending',     label: 'รอชำระ' },
];

// ── types ─────────────────────────────────────────────────────────────────────

interface LineItem {
  key:           number;
  description:   string;
  qty:           number;
  unitPrice:     number;
  discount:      number;
  lineCostPrice: number;
}

export type DocPrefill = {
  docType: DocType;
  customerName:    string;
  customerPhone:   string;
  customerCar:     string;
  bookingRef:      string;
  customerAddress: string;
  customerTaxId:   string;
  items: { description: string; qty: number; unitPrice: number; discount: number }[];
  vatRate:       number;
  paymentMethod: PaymentMethod;
  technicianName?: string;
  note:          string;
  showPaymentInfo?:   boolean;
  dueDate?:           string;
  sourceDocId:        string;
  sourceDocNumber:    string;
  sourceDocTypeLabel: string;
  depositAmount?:     number;
};

// ใช้ตอนแก้ไขเอกสารที่มีอยู่แล้ว — แยกจาก prefill (ที่ใช้กับ flow "สร้างเอกสารอ้างอิงใบนี้") เพราะความหมายต่างกัน:
// edit = บันทึกทับเอกสารเดิม ไม่สร้างใบใหม่ ไม่เปลี่ยนประเภทเอกสาร
export type DocEditTarget = {
  docId:     string;
  docNumber: string;
};

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}
function displayDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
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

export function NewDocumentClient({
  customers = [],
  products = [],
  serviceItems = [],
  employees = [],
  carBrands = [],
  carModels = [],
  prefill,
  editTarget,
}: {
  customers?: UnifiedCustomerRow[];
  products?: ProductRow[];
  serviceItems?: ServiceItemRow[];
  employees?: ActiveEmployee[];
  carBrands?: CarBrandRow[];
  carModels?: CarModelRow[];
  prefill?: DocPrefill;
  editTarget?: DocEditTarget;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEditMode = !!editTarget;

  // doc type
  const [docType, setDocType] = useState<DocType>(prefill?.docType ?? 'invoice');

  // customer
  const [customerName,    setCustomerName]    = useState(prefill?.customerName ?? '');
  const [customerPhone,   setCustomerPhone]   = useState(prefill?.customerPhone ?? '');
  const prefillCar = parseCarInfo(prefill?.customerCar ?? '');
  const [carBrand,     setCarBrand]     = useState(prefillCar.carBrand);
  const [carModel,     setCarModel]     = useState(prefillCar.carModel);
  const [carColor,     setCarColor]     = useState(prefillCar.carColor);
  const [licensePlate, setLicensePlate] = useState(prefillCar.licensePlate);
  const [mileage,      setMileage]      = useState(prefillCar.mileage);
  const [chassisNo,    setChassisNo]    = useState(prefillCar.chassisNo);
  const [bookingRef]                          = useState(prefill?.bookingRef ?? '');
  const [customerAddress, setCustomerAddress] = useState(prefill?.customerAddress ?? '');
  const [customerTaxId,   setCustomerTaxId]   = useState(prefill?.customerTaxId ?? '');
  const [customerEmail,   setCustomerEmail]   = useState('');
  const [customerLineId,  setCustomerLineId]  = useState('');
  const [customerSelected, setCustomerSelected] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [saveVehiclePending, setSaveVehiclePending] = useState(false);
  const [saveVehicleMsg, setSaveVehicleMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [customerVehicles, setCustomerVehicles] = useState<VehicleEntry[]>([]);
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);

  // car brand/model combobox UI state
  const [brandDropOpen,  setBrandDropOpen]  = useState(false);
  const [modelDropOpen,  setModelDropOpen]  = useState(false);
  const [localBrands,    setLocalBrands]    = useState<CarBrandRow[]>(carBrands);
  const [localModels,    setLocalModels]    = useState<CarModelRow[]>(carModels);
  const [brandSearch,    setBrandSearch]    = useState('');
  const [modelSearch,    setModelSearch]    = useState('');

  const filteredBrands = useMemo(() => {
    const q = brandSearch.toLowerCase();
    return localBrands.filter(b => b.name.toLowerCase().includes(q));
  }, [localBrands, brandSearch]);

  const selectedBrandId = useMemo(() =>
    localBrands.find(b => b.name.toLowerCase() === carBrand.toLowerCase())?.id ?? null,
    [localBrands, carBrand]
  );

  const filteredModels = useMemo(() => {
    const q = modelSearch.toLowerCase();
    const base = selectedBrandId ? localModels.filter(m => m.brandId === selectedBrandId) : localModels;
    return base.filter(m => m.name.toLowerCase().includes(q));
  }, [localModels, modelSearch, selectedBrandId]);

  async function pickBrand(name: string) {
    setCarBrand(name);
    setBrandSearch(name);
    setBrandDropOpen(false);
    setCarModel('');
    setModelSearch('');
    // save to DB if new
    if (!localBrands.find(b => b.name.toLowerCase() === name.toLowerCase())) {
      const fd = new FormData();
      fd.append('name', name);
      const res = await createCarBrand(null, fd);
      if (res.ok || res.error?.includes('มีอยู่แล้ว')) {
        // re-use existing or just add locally
        const existing = localBrands.find(b => b.name.toLowerCase() === name.toLowerCase());
        if (!existing) setLocalBrands(prev => [...prev, { id: name, name }]);
      }
    }
  }

  async function pickModel(name: string, brandId?: string) {
    setCarModel(name);
    setModelSearch(name);
    setModelDropOpen(false);
    const bid = brandId ?? selectedBrandId ?? '';
    if (bid && !localModels.find(m => m.name.toLowerCase() === name.toLowerCase() && m.brandId === bid)) {
      const res = await createCarModel(bid, name);
      if (res.ok || res.error?.includes('มีอยู่แล้ว')) {
        setLocalModels(prev => [...prev, { id: name, name, brandId: bid }]);
      }
    }
  }

  function applyVehicle(v: VehicleEntry) {
    setCarBrand(v.carBrand);
    setCarModel(v.carModel);
    setCarColor(v.carColor);
    setLicensePlate(v.licensePlate);
    setMileage(v.mileage);
    setChassisNo(v.chassisNo);
  }

  function selectCustomer(c: UnifiedCustomerRow) {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerAddress(c.address);
    setCustomerTaxId(c.taxId);
    setCustomerSelected(true);
    setSelectedCustomerId(c.id);
    setSaveVehicleMsg(null);

    if (c.vehicles && c.vehicles.length > 0) {
      setCustomerVehicles(c.vehicles);
      setSelectedVehicleIdx(0);
      applyVehicle(c.vehicles[0]);
    } else {
      setCustomerVehicles([]);
      setSelectedVehicleIdx(0);
      const car = parseCarInfo(c.carInfo);
      setCarBrand(car.carBrand);
      setCarModel(car.carModel);
      setCarColor(car.carColor);
      setLicensePlate(car.licensePlate);
      setMileage(car.mileage);
      setChassisNo(car.chassisNo);
    }
  }

  function clearCustomerSelection() {
    setCustomerSelected(false);
    setSelectedCustomerId(null);
    setSaveVehicleMsg(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerTaxId('');
    setCustomerVehicles([]);
    setSelectedVehicleIdx(0);
    setCarBrand('');
    setCarModel('');
    setCarColor('');
    setLicensePlate('');
    setMileage('');
    setChassisNo('');
  }

  function handleNewCustomerSaved(c?: { id: string; name: string; phone: string; address: string; taxId: string; carInfo: string; vehicles: VehicleEntry[] }) {
    setAddCustomerOpen(false);
    if (!c) return;
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerAddress(c.address);
    setCustomerTaxId(c.taxId);
    setCustomerSelected(true);
    setSelectedCustomerId(c.id);
    setSaveVehicleMsg(null);

    if (c.vehicles && c.vehicles.length > 0) {
      setCustomerVehicles(c.vehicles);
      setSelectedVehicleIdx(0);
      applyVehicle(c.vehicles[0]);
    } else {
      setCustomerVehicles([]);
      setSelectedVehicleIdx(0);
      const car = parseCarInfo(c.carInfo);
      setCarBrand(car.carBrand);
      setCarModel(car.carModel);
      setCarColor(car.carColor);
      setLicensePlate(car.licensePlate);
      setMileage(car.mileage);
      setChassisNo(car.chassisNo);
    }
  }

  async function handleSaveVehicleToCustomer() {
    if (!selectedCustomerId) return;
    setSaveVehiclePending(true);
    setSaveVehicleMsg(null);
    const result = await addVehicleToCustomer(selectedCustomerId, {
      carBrand, carModel, carColor, licensePlate, mileage, chassisNo,
    });
    setSaveVehiclePending(false);
    if (result.ok) {
      setCustomerVehicles(prev => [...prev, { carBrand, carModel, carColor, licensePlate, mileage, chassisNo }]);
      setSaveVehicleMsg({ ok: true, text: 'บันทึกรถไว้กับลูกค้าแล้ว' });
    } else {
      setSaveVehicleMsg({ ok: false, text: result.error ?? 'บันทึกไม่สำเร็จ' });
    }
  }

  // line items
  const [lines, setLines] = useState<LineItem[]>(
    prefill?.items.length
      ? prefill.items.map((it, idx) => ({ key: idx + 1, ...it, lineCostPrice: 0 }))
      : [{ key: 1, description: '', qty: 1, unitPrice: 0, discount: 0, lineCostPrice: 0 }]
  );
  const [productPickerLineKey, setProductPickerLineKey] = useState<number | null>(null);

  // รวมสินค้า (ยาง) + บริการ/ค่าแรง เป็นรายการเดียวให้เลือกจากช่องค้นหาเดียวกัน
  const [serviceItemsState, setServiceItemsState] = useState<ServiceItemRow[]>(serviceItems);
  type PickerEntry = { kind: 'product'; data: ProductRow } | { kind: 'service'; data: ServiceItemRow };
  const pickerEntries = useMemo<PickerEntry[]>(() => [
    ...products.map((p) => ({ kind: 'product' as const, data: p })),
    ...serviceItemsState.map((s) => ({ kind: 'service' as const, data: s })),
  ], [products, serviceItemsState]);

  function selectPickerEntry(key: number, entry: PickerEntry) {
    setLines((prev) => prev.map((l) => l.key !== key ? l : entry.kind === 'product'
      ? { ...l, description: `${entry.data.brand} ${entry.data.model} ${entry.data.size}`, unitPrice: entry.data.priceCash, lineCostPrice: entry.data.costPrice ?? 0 }
      : { ...l, description: entry.data.name, unitPrice: entry.data.price, lineCostPrice: 0 }
    ));
    setProductPickerLineKey(null);
  }

  // เพิ่มบริการใหม่แบบรวดเร็วจากในช่องค้นหา ไม่ต้องออกไปหน้าตั้งค่า
  const [newServiceName,  setNewServiceName]  = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [quickAddPending, setQuickAddPending] = useState(false);
  const [quickAddError,   setQuickAddError]   = useState('');

  async function handleQuickAddService(key: number) {
    if (!newServiceName.trim()) return;
    setQuickAddPending(true);
    setQuickAddError('');
    const price = Number(newServicePrice) || 0;
    const res = await createServiceItem({ name: newServiceName.trim(), price, unit: 'ครั้ง', note: '' });
    setQuickAddPending(false);
    if (res.error || !res.item) { setQuickAddError(res.error ?? 'เพิ่มไม่สำเร็จ'); return; }
    setServiceItemsState((prev) => [...prev, { id: res.item!.id, name: res.item!.name, price: res.item!.price, unit: res.item!.unit, note: res.item!.note }]);
    selectPickerEntry(key, { kind: 'service', data: { id: res.item.id, name: res.item.name, price: res.item.price, unit: res.item.unit, note: res.item.note } });
    setNewServiceName('');
    setNewServicePrice('');
  }

  // financial
  type VatMode = 'none' | 'included' | 'extra';
  const initVatMode = (): VatMode => {
    if (prefill && prefill.vatRate === 0) return 'none';
    return 'included';
  };
  const [vatMode,        setVatMode]        = useState<VatMode>(initVatMode());
  const [paymentMethod,  setPaymentMethod]  = useState<PaymentMethod>(prefill?.paymentMethod ?? 'cash');

  // meta
  const [issuedDate,      setIssuedDate]      = useState(today());
  const [dueDate,         setDueDate]         = useState(prefill?.dueDate ?? '');
  const [depositAmount,   setDepositAmount]   = useState(prefill?.depositAmount ?? 0);
  const [globalDiscount,  setGlobalDiscount]  = useState(0);
  const [note,            setNote]            = useState(prefill?.note ?? '');
  const [technicianName,  setTechnicianName]  = useState(prefill?.technicianName ?? '');
  const [showPaymentInfo, setShowPaymentInfo] = useState(prefill?.showPaymentInfo ?? false);

  // error
  const [error, setError] = useState('');

  // ── line item helpers ──────────────────────────────────────────────────────

  const addLine = () =>
    setLines(p => [...p, { key: Date.now(), description: '', qty: 1, unitPrice: 0, discount: 0, lineCostPrice: 0 }]);

  // เพิ่มแถวใหม่พร้อมเปิดตัวเลือก สินค้า/บริการ ทันที ไม่ต้องกดค้นหาซ้ำอีกที
  const addLineAndOpenPicker = () => {
    const key = Date.now();
    setLines(p => [...p, { key, description: '', qty: 1, unitPrice: 0, discount: 0, lineCostPrice: 0 }]);
    setProductPickerLineKey(key);
  };

  const removeLine = (key: number) =>
    setLines(p => p.filter(l => l.key !== key));

  const updateLine = (key: number, field: keyof Omit<LineItem, 'key'>, value: string | number) =>
    setLines(p => p.map(l => l.key === key ? { ...l, [field]: value } : l));

  // ── calculations ──────────────────────────────────────────────────────────

  const calc = useMemo(() => {
    const lineCalcs = lines.map(l => {
      const gross   = l.qty * l.unitPrice;
      const discAmt = gross * (l.discount / 100);
      return { gross, discAmt, net: gross - discAmt };
    });
    const subtotal      = lineCalcs.reduce((s, l) => s + l.gross, 0);
    const lineDiscTotal = lineCalcs.reduce((s, l) => s + l.discAmt, 0);
    const afterLineDisc = subtotal - lineDiscTotal;
    const globalDiscAmt = Math.min(globalDiscount, afterLineDisc);
    const discountTotal = lineDiscTotal + globalDiscAmt;
    const afterDisc     = afterLineDisc - globalDiscAmt;
    // none: ไม่มี VAT | included: ถอด 7/107 จากราคาที่กรอก | extra: บวก 7% เพิ่มจากราคาที่กรอก
    const vatAmount = vatMode === 'none' ? 0
      : vatMode === 'included' ? afterDisc - afterDisc / 1.07
      : afterDisc * 0.07;
    const grandTotal   = vatMode === 'extra' ? afterDisc + vatAmount : afterDisc;
    const preVatAmount = vatMode === 'included' ? afterDisc / 1.07 : afterDisc;
    return { lineCalcs, subtotal, discountTotal, afterDisc, vatAmount, preVatAmount, grandTotal };
  }, [lines, vatMode, globalDiscount]);

  // ── validation ─────────────────────────────────────────────────────────────

  const effectiveCustomerName = customerName.trim() || (vatMode === 'none' && licensePlate.trim() ? licensePlate.trim() : '');
  const isValid = !!effectiveCustomerName && lines.every(l => l.description.trim() && l.qty > 0 && l.unitPrice >= 0);

  // ── submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!isValid) return;
    setError('');
    startTransition(async () => {
      const payload: DocFormPayload = {
        type:         docType,
        customerName:   effectiveCustomerName,
        customerPhone:  customerPhone.trim(),
        customerEmail:  customerEmail.trim(),
        customerLineId: customerLineId.trim(),
        customerCar:    composeCarInfo({ carBrand, carModel, carColor, licensePlate, mileage, chassisNo }),
        bookingRef:    bookingRef,
        customerAddress: customerAddress.trim(),
        customerTaxId:   customerTaxId.trim(),
        items: lines.map((l, idx) => ({
          description: l.description,
          qty:         l.qty,
          unitPrice:   l.unitPrice,
          discount:    l.discount,
          lineTotal:   calc.lineCalcs[idx]?.net ?? 0,
        })),
        subtotal:      calc.subtotal,
        discountTotal: calc.discountTotal,
        vatRate:       vatMode === 'none' ? 0 : 7,
        vatAmount:     calc.vatAmount,
        grandTotal:    calc.grandTotal,
        paymentMethod,
        technicianName: technicianName.trim(),
        depositAmount,
        costPrice: lines.reduce((sum, l) => sum + l.lineCostPrice * l.qty, 0),
        note:          note.trim(),
        showPaymentInfo,
        dueDate,
        issuedDate,
        ...(prefill && !isEditMode ? { relatedDocId: prefill.sourceDocId, relatedDocNumber: prefill.sourceDocNumber } : {}),
      };

      if (isEditMode) {
        const res = await updateDocument(editTarget.docId, payload);
        if (res.error) setError(res.error);
        else router.push(`/admin/documents/${editTarget.docId}/print`);
        return;
      }

      const res = await createDocument(payload);
      if (res.error) setError(res.error);
      // ไปหน้าตัวอย่างก่อนพิมพ์ในแท็บเดิมเลย ไม่เปิดแท็บใหม่ — กดปุ่ม "พิมพ์เอกสาร" ในหน้านั้นได้ทันที
      else if (res.id) router.push(`/admin/documents/${res.id}/print`);
      else router.push('/admin/documents');
    });
  };

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
            <h1 className="text-xl font-black text-slate-900">{isEditMode ? 'แก้ไขเอกสาร' : 'สร้างเอกสารใหม่'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditMode ? <>เลขที่เอกสาร <span className="font-bold text-slate-600">{editTarget.docNumber}</span></> : 'ออกเลขที่อัตโนมัติ'} &nbsp;·&nbsp; {displayDate(issuedDate)}
            </p>
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
            <Send size={15} /> {isPending ? 'กำลังบันทึก...' : isEditMode ? 'บันทึกการแก้ไข' : 'สร้างเอกสาร'}
          </button>
        </div>
      </div>

      {prefill && !isEditMode && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm">
          <FileEdit size={15} className="text-blue-500 shrink-0" />
          <span className="text-blue-700 font-medium">
            ดึงข้อมูลมาจาก <span className="font-bold">{prefill.sourceDocTypeLabel} {prefill.sourceDocNumber}</span> — ตรวจสอบและแก้ไขได้ก่อนบันทึก
          </span>
        </div>
      )}

      {/* Row 1: Type selector */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
          <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center text-green-500"><FileText size={14} /></div>
          <h2 className="font-bold text-slate-800 text-sm">ประเภทเอกสาร</h2>
          {isEditMode && <span className="text-[11px] text-slate-400 font-medium">(เปลี่ยนประเภทไม่ได้ตอนแก้ไข)</span>}
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DOC_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => !isEditMode && setDocType(t.value)}
              disabled={isEditMode && docType !== t.value}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                docType === t.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed'
              }`}
            >
              <div className={`mt-0.5 ${docType === t.value ? 'text-green-600' : 'text-slate-400'}`}>{t.icon}</div>
              <div>
                <p className={`font-bold text-sm ${docType === t.value ? 'text-green-700' : 'text-slate-700'}`}>
                  {t.value === 'invoice' ? (vatMode !== 'none' ? 'ใบเสร็จรับเงิน/ใบกำกับภาษี' : 'ใบเสร็จรับเงิน') : t.label}
                </p>
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
                <input value={isEditMode ? editTarget.docNumber : 'ออกอัตโนมัติ'} disabled className={inputCls} />
              </div>
              <div>
                <Label>วันที่ออกเอกสาร</Label>
                <input
                  type="date"
                  value={issuedDate}
                  onChange={e => setIssuedDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            {(docType === 'quote' || docType === 'billing_note' || docType === 'booking_note') && (
              <div>
                <Label>
                  {docType === 'billing_note' ? 'วันครบกำหนดชำระ'
                    : docType === 'booking_note' ? 'วันนัดรับรถ / คาดว่าสินค้าจะถึง'
                    : 'วันหมดอายุ (ใบเสนอราคา)'}
                </Label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
              </div>
            )}
            {docType === 'booking_note' && (
              <div>
                <Label>มัดจำที่รับแล้ว (฿)</Label>
                <div className="relative">
                  <Banknote size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="number"
                    min={0}
                    value={depositAmount || ''}
                    onChange={e => setDepositAmount(Number(e.target.value))}
                    placeholder="0 = ยังไม่ได้รับมัดจำ"
                    className={inputCls + ' pl-8'}
                  />
                </div>
                {depositAmount > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    ยอดคงเหลือที่ต้องชำระ: <span className="font-bold text-slate-700">฿{Math.max(0, (calc.grandTotal - depositAmount)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </p>
                )}
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
              <Label>ช่างผู้รับผิดชอบ</Label>
              <div className="relative">
                <HardHat size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={technicianName}
                  onChange={e => setTechnicianName(e.target.value)}
                  className={inputCls + ' appearance-none pl-8 pr-9'}
                >
                  <option value="">— ไม่ระบุ —</option>
                  {Object.entries(
                    employees.reduce<Record<string, ActiveEmployee[]>>((acc, emp) => {
                      (acc[emp.role] ??= []).push(emp);
                      return acc;
                    }, {})
                  ).map(([role, list]) => (
                    <optgroup key={role} label={role}>
                      {list.map(emp => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name}{emp.nickname ? ` (${emp.nickname})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="หมายเหตุเพิ่มเติม..." className={inputCls + ' resize-none'} />
            </div>
            <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={showPaymentInfo}
                onChange={e => setShowPaymentInfo(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-700">แสดงข้อมูลการรับชำระ</span>
                <span className="block text-xs text-slate-400">เพิ่มหน้าที่ 2 ต่อจากเอกสารนี้ แสดงเลขบัญชี/พร้อมเพย์/QR ตามที่ตั้งค่าไว้</span>
              </span>
            </label>
          </div>
        </Section>

        {/* Customer */}
        <Section title="ข้อมูลลูกค้า" icon={<User size={14} />}>
          <div className="space-y-4">
            <div>
              <Label required>ชื่อลูกค้า</Label>
              {customerSelected ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-green-200 bg-green-50">
                    <span className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
                      <Search size={13} /> {customerName} <span className="text-[11px] text-green-500 font-normal">(เลือกจากรายชื่อลูกค้า)</span>
                    </span>
                    <button type="button" onClick={clearCustomerSelection} className="text-green-600 hover:text-green-800">
                      <X size={14} />
                    </button>
                  </div>
                  {customerVehicles.length > 1 && (
                    <div className="flex items-center gap-2">
                      <Car size={13} className="text-slate-400 shrink-0" />
                      <select
                        value={selectedVehicleIdx}
                        onChange={e => {
                          const idx = Number(e.target.value);
                          setSelectedVehicleIdx(idx);
                          applyVehicle(customerVehicles[idx]);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-green-400 bg-white"
                      >
                        {customerVehicles.map((v, i) => (
                          <option key={i} value={i}>
                            {[v.carBrand, v.carModel, v.carColor, v.licensePlate].filter(Boolean).join(' ') || `รถคันที่ ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="พิมพ์ชื่อลูกค้า หรือกดค้นหา"
                      className={inputCls + ' pl-8'}
                    />
                  </div>
                  <button
                    type="button" onClick={() => setCustomerPickerOpen(true)}
                    className="shrink-0 w-11 h-11 rounded-xl border border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-600 hover:bg-green-50 flex items-center justify-center transition-colors"
                    title="ค้นหาลูกค้าจากระบบ"
                  >
                    <Search size={16} />
                  </button>
                  <button
                    type="button" onClick={() => setAddCustomerOpen(true)}
                    className="shrink-0 w-11 h-11 rounded-xl border border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-600 hover:bg-green-50 flex items-center justify-center transition-colors"
                    title="เพิ่มลูกค้าใหม่"
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
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
                <Label>LINE @</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-[10px] text-green-600 leading-none">LINE</span>
                  <input
                    value={customerLineId}
                    onChange={e => setCustomerLineId(e.target.value)}
                    placeholder="@lineid"
                    className={inputCls + ' pl-10'}
                  />
                </div>
              </div>
              <div>
                <Label>อีเมล</Label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
                    className={inputCls + ' pl-8'}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <Label>ยี่ห้อรถ</Label>
                <div className="relative">
                  <input
                    value={brandSearch || carBrand}
                    onChange={e => { setBrandSearch(e.target.value); setCarBrand(e.target.value); setBrandDropOpen(true); }}
                    onFocus={() => { setBrandSearch(''); setBrandDropOpen(true); }}
                    onBlur={() => setTimeout(() => setBrandDropOpen(false), 150)}
                    placeholder="Toyota"
                    autoComplete="off"
                    className={inputCls + ' pr-8'}
                  />
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {brandDropOpen && (
                  <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredBrands.length === 0 && brandSearch.trim() ? (
                      <button
                        type="button"
                        onMouseDown={() => pickBrand(brandSearch.trim())}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-green-700 hover:bg-green-50 font-bold"
                      >
                        <Plus size={14} /> เพิ่ม "{brandSearch.trim()}"
                      </button>
                    ) : (
                      filteredBrands.map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onMouseDown={() => pickBrand(b.name)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-slate-50 ${
                            b.name.toLowerCase() === carBrand.toLowerCase() ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-700'
                          }`}
                        >
                          {b.name.toLowerCase() === carBrand.toLowerCase() && <Check size={12} className="text-green-600" />}
                          {b.name}
                        </button>
                      ))
                    )}
                    {filteredBrands.length > 0 && brandSearch.trim() &&
                      !filteredBrands.find(b => b.name.toLowerCase() === brandSearch.toLowerCase()) && (
                      <button
                        type="button"
                        onMouseDown={() => pickBrand(brandSearch.trim())}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-green-700 hover:bg-green-50 font-bold border-t border-slate-100"
                      >
                        <Plus size={14} /> เพิ่ม "{brandSearch.trim()}"
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <Label>รุ่นรถ</Label>
                <div className="relative">
                  <input
                    value={modelSearch || carModel}
                    onChange={e => { setModelSearch(e.target.value); setCarModel(e.target.value); setModelDropOpen(true); }}
                    onFocus={() => { setModelSearch(''); setModelDropOpen(true); }}
                    onBlur={() => setTimeout(() => setModelDropOpen(false), 150)}
                    placeholder="Camry"
                    autoComplete="off"
                    className={inputCls + ' pr-8'}
                  />
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {modelDropOpen && (
                  <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredModels.length === 0 && modelSearch.trim() ? (
                      <button
                        type="button"
                        onMouseDown={() => pickModel(modelSearch.trim())}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-green-700 hover:bg-green-50 font-bold"
                      >
                        <Plus size={14} /> เพิ่ม "{modelSearch.trim()}"
                      </button>
                    ) : (
                      filteredModels.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onMouseDown={() => pickModel(m.name, m.brandId)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-slate-50 ${
                            m.name.toLowerCase() === carModel.toLowerCase() ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-700'
                          }`}
                        >
                          {m.name.toLowerCase() === carModel.toLowerCase() && <Check size={12} className="text-green-600" />}
                          {m.name}
                        </button>
                      ))
                    )}
                    {filteredModels.length > 0 && modelSearch.trim() &&
                      !filteredModels.find(m => m.name.toLowerCase() === modelSearch.toLowerCase()) && (
                      <button
                        type="button"
                        onMouseDown={() => pickModel(modelSearch.trim())}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-green-700 hover:bg-green-50 font-bold border-t border-slate-100"
                      >
                        <Plus size={14} /> เพิ่ม "{modelSearch.trim()}"
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label>สีรถ</Label>
                <input
                  value={carColor}
                  onChange={e => setCarColor(e.target.value)}
                  placeholder="ขาว"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ทะเบียนรถ</Label>
                <div className="relative">
                  <Car size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={licensePlate}
                    onChange={e => setLicensePlate(e.target.value)}
                    placeholder="กก-1234 กรุงเทพฯ"
                    className={inputCls + ' pl-8'}
                  />
                </div>
              </div>
              <div>
                <Label>ไมล์ปัจจุบัน (กม.)</Label>
                <div className="relative">
                  <Gauge size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={mileage}
                    onChange={e => setMileage(e.target.value.replace(/[^\d,]/g, ''))}
                    placeholder="45,000"
                    className={inputCls + ' pl-8'}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>เลขที่ตัวถัง (Chassis No.)</Label>
              <div className="relative">
                <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={chassisNo}
                  onChange={e => setChassisNo(e.target.value)}
                  placeholder="เช่น JTMHX3JH50D000001"
                  className={inputCls + ' pl-8'}
                />
              </div>
            </div>

            {selectedCustomerId && (carBrand || licensePlate) && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSaveVehicleToCustomer}
                  disabled={saveVehiclePending}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-blue-300 text-blue-600 text-xs font-semibold hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 transition-colors"
                >
                  <Car size={13} />
                  {saveVehiclePending ? 'กำลังบันทึก...' : 'บันทึกรถนี้ไว้กับลูกค้า'}
                </button>
                {saveVehicleMsg && (
                  <p className={`text-xs mt-1.5 text-center font-medium ${saveVehicleMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {saveVehicleMsg.text}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>ที่อยู่ (สำหรับออกเอกสาร)</Label>
              <div className="relative">
                <MapPin size={13} className="absolute left-3 top-3 text-slate-400" />
                <textarea
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  rows={2}
                  placeholder="ที่อยู่ลูกค้า"
                  className={inputCls + ' pl-8 resize-none'}
                />
              </div>
            </div>
            <div>
              <Label>เลขที่ผู้เสียภาษี</Label>
              <div className="relative">
                <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={customerTaxId}
                  onChange={e => setCustomerTaxId(e.target.value)}
                  placeholder="สำหรับลูกค้านิติบุคคล"
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
          <div className="flex items-center gap-2">
            <button onClick={addLineAndOpenPicker} className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg">
              <Wrench size={13} /> เพิ่มบริการ / ค่าแรง
            </button>
            <button onClick={addLine} className="flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg">
              <Plus size={13} /> เพิ่มรายการ
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-400 font-semibold border-b border-slate-100">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-3 py-3">รายการ / รุ่นยาง *</th>
                <th className="text-center px-3 py-3 w-24">จำนวน *</th>
                <th className="text-right px-3 py-3 w-32">ราคา/หน่วย (฿) *</th>
                <th className="text-right px-3 py-3 w-24">ส่วนลด (%)</th>
                <th className="text-center px-3 py-3 w-16">VAT</th>
                <th className="text-right px-4 py-3 w-32">มูลค่าก่อนภาษี</th>
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
                        <input
                          value={line.description}
                          onChange={e => updateLine(line.key, 'description', e.target.value)}
                          placeholder="พิมพ์ชื่อรายการ หรือกดค้นหา (ยาง/สินค้า หรือ บริการ)"
                          className="flex-1 px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 placeholder:text-slate-300"
                        />
                        <button
                          type="button" onClick={() => setProductPickerLineKey(line.key)}
                          className="shrink-0 w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:border-green-300 hover:text-green-600 hover:bg-green-50 flex items-center justify-center transition-colors"
                          title="ค้นหาสินค้า/ยาง หรือบริการ"
                        >
                          <Search size={13} />
                        </button>
                      </div>
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
                    <td className="px-3 py-2.5 text-center text-xs font-medium text-slate-500">
                      {vatMode !== 'none' ? '7%' : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-800 text-xs tabular-nums">
                      {(vatMode === 'included' ? net / 1.07 : net).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <span className="text-slate-500">{vatMode !== 'none' ? 'มูลค่าสินค้า (ไม่รวม VAT)' : 'ราคารวมก่อนหักส่วนลด'}</span>
              <span className="font-semibold tabular-nums">฿{(vatMode === 'included' ? calc.preVatAmount : calc.subtotal).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
            {/* ส่วนลดรวมทั้งบิล */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">ส่วนลด (฿)</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-sm">฿</span>
                <input
                  type="number"
                  min={0}
                  value={globalDiscount || ''}
                  onChange={e => setGlobalDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-28 px-2 py-1 text-right rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-green-400 tabular-nums"
                />
              </div>
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

            {/* VAT mode selector */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">VAT</span>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[11px] font-semibold">
                  {([
                    { value: 'none',     label: 'ไม่มี VAT' },
                    { value: 'included', label: 'รวมในราคา' },
                    { value: 'extra',    label: 'บวก 7%' },
                  ] as const).map(opt => (
                    <button key={opt.value}
                      onClick={() => setVatMode(opt.value)}
                      className={`px-3 py-1.5 transition-colors ${vatMode === opt.value ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {vatMode !== 'none' && (
                <div className="space-y-1.5 bg-slate-50 rounded-lg px-3 py-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{vatMode === 'included' ? 'ถอด VAT 7/107 จากยอดขาย' : 'บวก VAT 7% จากยอดขาย'}</span>
                    <span className="font-medium tabular-nums text-slate-600">฿{calc.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {vatMode === 'extra' && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">ยอดรวม (รวม VAT แล้ว)</span>
                      <span className="font-semibold tabular-nums text-green-700">฿{calc.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              )}
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
              <Send size={15} /> {isPending ? 'กำลังบันทึก...' : isEditMode ? 'บันทึกการแก้ไข' : 'สร้างเอกสาร'}
            </button>
          </div>
        </div>
      </div>

      {customerPickerOpen && (
        <PickerModal
          title="เลือกลูกค้า"
          placeholder="ค้นหาทะเบียนรถ, ชื่อ หรือเบอร์โทร..."
          items={customers}
          filterFn={(c, q) => {
            const plates = c.vehicles?.map(v => v.licensePlate.toLowerCase()).join(' ') ?? '';
            const legacy = c.carInfo?.toLowerCase() ?? '';
            return plates.includes(q) || legacy.includes(q) || c.name.toLowerCase().includes(q) || c.phone.includes(q);
          }}
          renderItem={(c) => {
            const plates = c.vehicles?.filter(v => v.licensePlate).map(v => v.licensePlate).join(', ')
              || c.carInfo || '';
            return (
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.customerType === 'corporate' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                  {c.customerType === 'corporate' ? <Building2 size={15} /> : <User size={15} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{c.name || <span className="text-slate-400 italic">ไม่มีชื่อ</span>}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {plates && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {plates}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{c.phone || ''}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${c.source === 'online' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                  {c.source === 'online' ? 'ออนไลน์' : 'หน้าร้าน'}
                </span>
              </div>
            );
          }}
          onSelect={(c) => { selectCustomer(c); setCustomerPickerOpen(false); }}
          onClose={() => setCustomerPickerOpen(false)}
        />
      )}

      {addCustomerOpen && (
        <CustomerModal
          initial={null}
          carBrands={localBrands}
          carModels={localModels}
          onClose={() => setAddCustomerOpen(false)}
          onSaved={handleNewCustomerSaved}
        />
      )}

      {productPickerLineKey !== null && (
        <PickerModal
          title="เลือกสินค้า / ยาง / บริการ"
          placeholder="ค้นหายี่ห้อ รุ่น ขนาดยาง หรือชื่อบริการ..."
          items={pickerEntries}
          filterFn={(entry, q) => entry.kind === 'product'
            ? `${entry.data.brand} ${entry.data.model} ${entry.data.size}`.toLowerCase().includes(q)
            : entry.data.name.toLowerCase().includes(q)}
          renderItem={(entry) => entry.kind === 'product' ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{entry.data.brand} {entry.data.model}</p>
                <p className="text-xs text-slate-400">{entry.data.size}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-green-600">฿{entry.data.priceCash.toLocaleString()}</p>
                <p className={`text-[10px] font-semibold ${entry.data.stock === 0 ? 'text-red-500' : 'text-slate-400'}`}>สต็อก {entry.data.stock}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2">
                <span className="shrink-0 w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center"><Wrench size={12} /></span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{entry.data.name}</p>
                  <p className="text-[10px] font-bold text-amber-600 tracking-wide">บริการ</p>
                </div>
              </div>
              <p className="text-sm font-bold text-green-600 shrink-0">฿{entry.data.price.toLocaleString()} / {entry.data.unit}</p>
            </div>
          )}
          onSelect={(entry) => selectPickerEntry(productPickerLineKey, entry)}
          onClose={() => { setProductPickerLineKey(null); setNewServiceName(''); setNewServicePrice(''); setQuickAddError(''); }}
          footer={
            <div className="space-y-2">
              {quickAddError && <p className="text-xs text-red-500">{quickAddError}</p>}
              <div className="flex items-center gap-2">
                <Wrench size={13} className="text-slate-400 shrink-0" />
                <input
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="ไม่เจอที่ต้องการ? พิมพ์ชื่อบริการใหม่..."
                  className="flex-1 px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400"
                />
                <input
                  type="number" min={0} value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  placeholder="ราคา"
                  className="w-20 px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-green-400 text-right"
                />
                <button
                  type="button"
                  disabled={!newServiceName.trim() || quickAddPending}
                  onClick={() => handleQuickAddService(productPickerLineKey)}
                  className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 disabled:opacity-40"
                >
                  <PackageSearch size={13} /> เพิ่ม
                </button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
