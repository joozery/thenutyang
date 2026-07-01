'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Shield, CheckCircle2, Circle, Loader2,
  Printer, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { ClaimRow } from '@/lib/warranty-claims';
import { STATUS_LABEL, STATUS_COLOR } from '@/lib/warranty-claims-constants';
import {
  updateSupplierStep,
  updateAdvanceStep,
  updateResultStep,
  deleteWarrantyClaim,
} from '@/app/actions/warranty-claims';

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtMoney(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
}

const STEP_ORDER = ['customer_filed', 'sent_to_supplier', 'waiting_result', 'resolved'];

function stepDone(current: string, step: string) {
  return STEP_ORDER.indexOf(current) >= STEP_ORDER.indexOf(step);
}

// ─── Step Panel ──────────────────────────────────────────────────────────────

function StepPanel({
  title, done, children,
}: {
  title: string; done: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!done);
  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${done ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-white'}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          {done ? (
            <CheckCircle2 size={20} className="text-green-500 shrink-0" />
          ) : (
            <Circle size={20} className="text-slate-300 shrink-0" />
          )}
          <span className={`font-bold text-sm ${done ? 'text-green-700' : 'text-slate-700'}`}>{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WarrantyClaimDetailClient({ claim }: { claim: ClaimRow }) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSupplier(fd: FormData) {
    startTransition(() => updateSupplierStep(claim.id, fd));
  }

  function handleAdvance(fd: FormData) {
    startTransition(() => updateAdvanceStep(claim.id, fd));
  }

  function handleResult(fd: FormData) {
    startTransition(() => updateResultStep(claim.id, fd));
  }

  function handleDelete() {
    startTransition(() => deleteWarrantyClaim(claim.id));
  }

  const isDone = (step: string) => stepDone(claim.status, step);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/warranty-claims" className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <ArrowLeft size={18} className="text-slate-600" />
          </Link>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5">
            <Shield size={22} className="text-orange-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono">{claim.claimNumber}</h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[claim.status]}`}>
                {STATUS_LABEL[claim.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500">เปิดเคส: {fmtDate(claim.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/warranty-claims/${claim.id}/print/customer`}
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Printer size={14} /> เอกสารลูกค้า
          </Link>
          {claim.supplierName && (
            <Link
              href={`/admin/warranty-claims/${claim.id}/print/supplier`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Printer size={14} /> เอกสารบริษัท
            </Link>
          )}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-3 py-2 border border-red-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} /> ลบเคส
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-bold">ยืนยันลบ?</span>
              <button
                onClick={handleDelete}
                disabled={pending}
                className="px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? <Loader2 size={13} className="animate-spin" /> : 'ลบ'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">
                ยกเลิก
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step 1 — ข้อมูลลูกค้า (read-only summary) */}
      <StepPanel title="ขั้นตอนที่ 1 — ข้อมูลการเครมจากลูกค้า" done>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          {[
            ['ชื่อลูกค้า', claim.customerName || '—'],
            ['เบอร์โทร', claim.customerPhone || '—'],
            ['ทะเบียนรถ', claim.licensePlate || '—'],
            ['วันที่เข้าเครม', fmtDate(claim.claimDate)],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs text-slate-500 mb-0.5">{k}</div>
              <div className="font-medium text-slate-800">{v}</div>
            </div>
          ))}
          <div className="col-span-2">
            <div className="text-xs text-slate-500 mb-1">รายการสินค้าที่เครม</div>
            <div className="space-y-1">
              {claim.items.map((it, i) => (
                <div key={i} className="flex gap-2 text-sm bg-white rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-slate-400 text-xs w-5 shrink-0">{i + 1}.</span>
                  <span className="flex-1">
                    <span className="font-medium">{it.productName}</span>
                    {it.brand && <span className="text-slate-500"> ({it.brand} {it.size})</span>}
                    <span className="text-slate-500"> ×{it.quantity}</span>
                  </span>
                  {it.reason && <span className="text-orange-600 text-xs">{it.reason}</span>}
                </div>
              ))}
            </div>
          </div>
          {claim.customerNotes && (
            <div className="col-span-2">
              <div className="text-xs text-slate-500 mb-0.5">หมายเหตุ</div>
              <div className="text-slate-700">{claim.customerNotes}</div>
            </div>
          )}
        </div>
      </StepPanel>

      {/* Step 2 — ส่งเครมบริษัท */}
      <StepPanel title="ขั้นตอนที่ 2 — เดอะนัทส่งเครมไปบริษัท" done={isDone('sent_to_supplier')}>
        {isDone('sent_to_supplier') && claim.supplierName ? (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {[
              ['บริษัทที่ส่งเครม', claim.supplierName],
              ['วันที่ส่ง', fmtDate(claim.supplierSentDate)],
              ['เลขที่อ้างอิง (บริษัท)', claim.supplierRef || '—'],
              ['หมายเหตุ', claim.supplierNotes || '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-slate-500 mb-0.5">{k}</div>
                <div className="font-medium text-slate-800">{v}</div>
              </div>
            ))}
          </div>
        ) : (
          <form action={handleSupplier} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  บริษัทที่ส่งเครม <span className="text-red-500">*</span>
                </label>
                <input
                  name="supplierName" required defaultValue={claim.supplierName}
                  placeholder="เช่น บริดจสโตน ไทยแลนด์"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันที่ส่ง <span className="text-red-500">*</span>
                </label>
                <input
                  type="date" name="supplierSentDate" required
                  defaultValue={claim.supplierSentDate ? claim.supplierSentDate.split('T')[0] : new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เลขที่อ้างอิง (บริษัท)
                </label>
                <input
                  name="supplierRef" defaultValue={claim.supplierRef} placeholder="เลขที่เคสของบริษัท"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุ</label>
                <input
                  name="supplierNotes" defaultValue={claim.supplierNotes} placeholder="รายละเอียดเพิ่มเติม"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>
            <button
              type="submit" disabled={pending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {pending && <Loader2 size={14} className="animate-spin" />}
              บันทึก — ส่งเครมแล้ว
            </button>
          </form>
        )}
      </StepPanel>

      {/* Step 3 — สำรองจ่ายก่อน */}
      <StepPanel title="ขั้นตอนที่ 3 — สถานะระหว่างรอผล (สำรองจ่ายก่อนหรือไม่)" done={isDone('waiting_result')}>
        {isDone('waiting_result') ? (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">เดอะนัทสำรองจ่าย</div>
              <div className={`font-bold ${claim.isAdvanced ? 'text-orange-600' : 'text-slate-600'}`}>
                {claim.isAdvanced ? 'สำรองจ่ายก่อน' : 'รอคำตอบบริษัท'}
              </div>
            </div>
            {claim.isAdvanced && (
              <>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">จำนวนที่สำรองจ่าย</div>
                  <div className="font-medium text-slate-800">{fmtMoney(claim.advanceAmount)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">วันที่สำรองจ่าย</div>
                  <div className="font-medium text-slate-800">{fmtDate(claim.advanceDate)}</div>
                </div>
              </>
            )}
            {claim.advanceNotes && (
              <div className="col-span-2">
                <div className="text-xs text-slate-500 mb-0.5">หมายเหตุ</div>
                <div className="text-slate-700">{claim.advanceNotes}</div>
              </div>
            )}
          </div>
        ) : (
          <form action={handleAdvance} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-2">สถานะการสำรองจ่าย</label>
                <div className="flex gap-3">
                  {[
                    { value: 'true', label: 'สำรองจ่ายให้ลูกค้าก่อน' },
                    { value: 'false', label: 'รอคำตอบจากบริษัทก่อน' },
                  ].map((o) => (
                    <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="isAdvanced" value={o.value} defaultChecked={o.value === 'false'} className="accent-green-500" />
                      <span className="text-sm font-medium text-slate-700">{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">จำนวนที่สำรองจ่าย (บาท)</label>
                <input
                  type="number" name="advanceAmount" min={0} step={0.01} defaultValue={claim.advanceAmount || ''}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">วันที่สำรองจ่าย</label>
                <input
                  type="date" name="advanceDate"
                  defaultValue={claim.advanceDate ? claim.advanceDate.split('T')[0] : new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุ</label>
                <input
                  name="advanceNotes" defaultValue={claim.advanceNotes} placeholder="รายละเอียดเพิ่มเติม"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>
            <button
              type="submit" disabled={pending}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {pending && <Loader2 size={14} className="animate-spin" />}
              บันทึก — รอผลจากบริษัท
            </button>
          </form>
        )}
      </StepPanel>

      {/* Step 4 — ผลออก */}
      <StepPanel title="ขั้นตอนที่ 4 — ผลการเครม" done={isDone('resolved')}>
        {isDone('resolved') ? (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {[
              ['วันที่ผลออก', fmtDate(claim.resultDate)],
              ['ผลที่ได้รับ', claim.resultType === 'replacement' ? 'ได้ยาง/อะไหล่ทดแทน' : 'ได้เงินทดแทน'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-slate-500 mb-0.5">{k}</div>
                <div className="font-medium text-slate-800">{v}</div>
              </div>
            ))}
            {claim.resultType === 'replacement' && claim.replacementDescription && (
              <div className="col-span-2">
                <div className="text-xs text-slate-500 mb-0.5">รายการที่ได้รับทดแทน</div>
                <div className="text-slate-700">{claim.replacementDescription}</div>
              </div>
            )}
            {claim.resultType === 'money' && (
              <div>
                <div className="text-xs text-slate-500 mb-0.5">จำนวนเงินทดแทน</div>
                <div className="font-bold text-green-700">{fmtMoney(claim.compensationAmount)}</div>
              </div>
            )}
            <div className="col-span-2 border-t border-slate-100 pt-4">
              <div className="text-xs font-bold text-slate-500 mb-2">การคืนให้ลูกค้า</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">วันที่คืนให้ลูกค้า</div>
                  <div className="font-medium text-slate-800">{fmtDate(claim.customerResolutionDate)}</div>
                </div>
                {claim.customerResolutionNotes && (
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">หมายเหตุ</div>
                    <div className="text-slate-700">{claim.customerResolutionNotes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form action={handleResult} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันที่ผลออก <span className="text-red-500">*</span>
                </label>
                <input
                  type="date" name="resultDate" required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  ผลที่ได้รับ <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'replacement', label: 'ยาง/อะไหล่ทดแทน' },
                    { value: 'money', label: 'เงินทดแทน' },
                  ].map((o) => (
                    <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="resultType" value={o.value} required className="accent-green-500" />
                      <span className="text-sm font-medium text-slate-700">{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  รายการที่ได้รับทดแทน (กรณียาง/อะไหล่)
                </label>
                <input
                  name="replacementDescription" placeholder="เช่น ยาง Bridgestone 205/55R16 1 เส้น"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  จำนวนเงินทดแทน (กรณีเงิน) (บาท)
                </label>
                <input
                  type="number" name="compensationAmount" min={0} step={0.01} placeholder="0.00"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-4">
                <div className="text-xs font-bold text-slate-500 mb-3">การคืนให้ลูกค้า</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">วันที่คืนให้ลูกค้า</label>
                    <input
                      type="date" name="customerResolutionDate"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุการคืน</label>
                    <input
                      name="customerResolutionNotes" placeholder="เช่น คืนยางทดแทนให้ลูกค้าแล้ว"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>
              </div>
            </div>
            <button
              type="submit" disabled={pending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {pending && <Loader2 size={14} className="animate-spin" />}
              บันทึก — ปิดเคสเครม
            </button>
          </form>
        )}
      </StepPanel>
    </div>
  );
}
