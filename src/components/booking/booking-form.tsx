'use client';

import { useActionState, useState } from 'react';
import { createBooking } from '@/app/actions/booking';
import type { CustomerSession } from '@/lib/customer-session';
import Image from 'next/image';
import { BRAND_LOGOS } from '@/lib/tires';

type BookingTire = {
  id: string;
  brand: string;
  model: string;
  size: string;
  image: string;
  price: number;
};

type CustomerType = 'individual' | 'corporate';

interface Props {
  tire?: BookingTire;
  customer?: CustomerSession | null;
}

export function BookingForm({ tire, customer }: Props) {
  const [state, formAction, isPending] = useActionState(createBooking, null);
  const [customerType, setCustomerType] = useState<CustomerType>('individual');

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-600 text-sm font-medium">
          {state.error}
        </div>
      )}
      {/* Hidden fields */}
      <input type="hidden" name="tireId" value={tire?.id ?? ''} />
      <input type="hidden" name="tireName" value={tire ? `${tire.brand} ${tire.model} ${tire.size}` : 'ไม่ระบุ'} />
      <input type="hidden" name="tirePrice" value={tire?.price ?? 0} />
      {customer && (
        <input type="hidden" name="lineUserId" value={customer.lineUserId} />
      )}

      {/* Selected tire preview */}
      {tire && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-4">
          <img src={tire.image} alt={tire.model} className="h-20 w-auto object-contain shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 mb-1.5 flex items-center">
              <Image
                src={BRAND_LOGOS[tire.brand]}
                alt={tire.brand}
                width={60}
                height={16}
                className={`h-full w-auto object-contain max-w-[60px]
                  ${['MICHELIN', 'BRIDGESTONE', 'PIRELLI'].includes(tire.brand) ? 'scale-[1.8] origin-left' : 'origin-left'}`}
              />
            </div>
            <p className="font-bold text-slate-800 text-sm mt-2">{tire.model}</p>
            <p className="text-xs text-slate-500">{tire.size}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-green-600">฿{tire.price.toLocaleString()}</p>
            <p className="text-xs text-slate-400">/เส้น</p>
          </div>
        </div>
      )}

      {/* จำนวน */}
      {tire && (
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">จำนวนยาง</label>
          <div className="flex gap-3">
            {[1, 2, 4].map(n => (
              <label key={n} className="flex-1">
                <input type="radio" name="quantity" value={n} defaultChecked={n === 4} className="peer sr-only" />
                <div className="text-center py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 cursor-pointer peer-checked:border-green-600 peer-checked:bg-green-600 peer-checked:text-white transition-all">
                  {n} เส้น
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {!customer && (
        <div>
          <a
            href="/api/auth/line?returnTo=/booking"
            className="w-full bg-[#00B900] hover:bg-[#009900] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#00B900]/30 hover:shadow-xl hover:-translate-y-0.5 transform duration-200"
          >
            <span className="text-xl font-black leading-none">LINE</span>
            <span className="text-base">เข้าสู่ระบบด้วย LINE</span>
          </a>
          <p className="text-xs text-slate-400 text-center mt-2.5">เข้าสู่ระบบเพื่อรับใบเสนอราคาทันทีทาง LINE ไม่ต้องกรอกข้อมูลซ้ำ</p>
          <div className="flex items-center gap-3 pt-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">หรือกรอกข้อมูลด้วยตัวเอง</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>
        </div>
      )}

      {/* ข้อมูลส่วนตัว */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">ข้อมูลลูกค้า</h3>

        <input type="hidden" name="customerType" value={customerType} />
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button" onClick={() => setCustomerType('individual')}
            className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-colors ${customerType === 'individual' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500'}`}
          >
            บุคคลธรรมดา
          </button>
          <button
            type="button" onClick={() => setCustomerType('corporate')}
            className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-colors ${customerType === 'corporate' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500'}`}
          >
            นิติบุคคล
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customerType === 'corporate' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                ชื่อบริษัท <span className="text-green-500">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                required
                placeholder="บริษัท ... จำกัด"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {customerType === 'corporate' ? 'ชื่อผู้ติดต่อ' : 'ชื่อ'} {customerType === 'individual' && <span className="text-green-500">*</span>}
            </label>
            <input
              type="text"
              name="firstName"
              required={customerType === 'individual'}
              placeholder="สมชาย"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">นามสกุล</label>
            <input
              type="text"
              name="lastName"
              placeholder="ใจดี"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              เบอร์โทรศัพท์ <span className="text-green-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="081-234-5678"
              pattern="[0-9]{9,10}"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>

          {/* LINE ID: ซ่อนถ้า login ด้วย LINE แล้ว */}
          {customer ? (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">LINE</label>
              <div className="flex items-center gap-3 bg-[#06C755]/10 border border-[#06C755]/30 rounded-xl px-4 py-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.301.079.767.038 1.076-.003.016-.046.284-.046.284s-.142.859-.172 1.034c-.049.289-.228 1.127 1.01.606 1.238-.521 6.678-3.929 8.924-7.069C23.013 14.28 24 12.395 24 10.304zm-14.73 2.946H6.602a.852.852 0 0 1-.852-.853V7.276a.852.852 0 0 1 1.704 0v4.269h1.816a.852.852 0 0 1 0 1.705zm2.768-.853a.853.853 0 0 1-1.705 0V7.276a.853.853 0 0 1 1.705 0v5.121zm4.869 0a.853.853 0 0 1-.853.853h-2.557a.853.853 0 0 1-.853-.853V7.276a.852.852 0 0 1 .853-.853h2.557a.853.853 0 1 1 0 1.705h-1.704v.852h1.704a.853.853 0 0 1 0 1.705h-1.704v.853h1.704a.852.852 0 0 1 .853.852zm3.308-5.121v5.121a.852.852 0 0 1-1.704 0V8.718l-2.457 3.422a.846.846 0 0 1-.689.379.852.852 0 0 1-.852-.853V6.544a.853.853 0 0 1 1.705 0v3.68l2.457-3.422a.846.846 0 0 1 .689-.379.852.852 0 0 1 .851.853z" />
                </svg>
                {customer.pictureUrl && (
                  <img src={customer.pictureUrl} alt={customer.displayName} className="w-8 h-8 rounded-full object-cover" />
                )}
                <div>
                  <p className="text-sm font-bold text-slate-800">{customer.displayName}</p>
                  <p className="text-xs text-[#06C755]">เชื่อมต่อ LINE แล้ว — ใบเสนอราคาจะถูกส่งทันที</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                LINE ID <span className="text-xs text-slate-400 font-normal">(ไม่บังคับ)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                <input
                  type="text"
                  name="lineId"
                  placeholder="yourlineid"
                  className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                ไม่มี LINE ก็จองได้ — ทีมงานจะโทรติดต่อกลับตามเบอร์ที่ให้ไว้ หรือเพิ่มเพื่อน LINE ภายหลังเพื่อรับใบเสนอราคาทันที
              </p>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              ที่อยู่ <span className="text-xs text-slate-400 font-normal">(ไม่บังคับ — สำหรับออกใบเสนอราคา)</span>
            </label>
            <textarea
              name="address"
              rows={2}
              placeholder="ที่อยู่สำหรับออกเอกสาร"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition resize-none"
            />
          </div>

          {customerType === 'corporate' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                เลขที่ผู้เสียภาษี <span className="text-xs text-slate-400 font-normal">(ไม่บังคับ)</span>
              </label>
              <input
                type="text"
                name="taxId"
                placeholder="0-0000-00000-00-0"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
              />
            </div>
          )}
        </div>
      </div>

      {/* นัดหมาย */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">นัดหมายเข้ารับบริการ</h3>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            วันที่ต้องการ <span className="text-green-500">*</span>
          </label>
          <input
            type="date"
            name="appointmentDate"
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full md:w-64 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
          <p className="text-xs text-slate-400 mt-1.5">ร้านเปิด จันทร์–อาทิตย์ 08:00–18:00 น.</p>
        </div>
      </div>

      {/* หมายเหตุ */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">หมายเหตุ (ถ้ามี)</label>
        <textarea
          name="note"
          rows={3}
          placeholder="เช่น ต้องการตั้งศูนย์ถ่วงล้อด้วย, ต้องการยางรุ่นอื่นเพิ่มเติม..."
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition resize-none"
        />
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-green-200 text-base"
        >
          {isPending
            ? 'กำลังส่งข้อมูล...'
            : customer
              ? 'ยืนยันการจอง — รับใบเสนอราคาทาง LINE ทันที'
              : 'ยืนยันการจอง'}
        </button>
        <p className="text-xs text-slate-400 text-center mt-3">
          ทีมงานจะติดต่อยืนยันการจองผ่าน LINE ภายใน 30 นาที (ในเวลาทำการ)
        </p>
      </div>
    </form>
  );
}
