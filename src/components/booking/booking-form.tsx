'use client';

import { useActionState } from 'react';
import { createBooking } from '@/app/actions/booking';
import type { Tire } from '@/lib/tires';
import type { CustomerSession } from '@/lib/customer-session';
import Image from 'next/image';
import { BRAND_LOGOS } from '@/lib/tires';

interface Props {
  tire?: Tire;
  customer?: CustomerSession | null;
}

export function BookingForm({ tire, customer }: Props) {
  const [state, formAction, isPending] = useActionState(createBooking, null);

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

      {/* ข้อมูลส่วนตัว */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">ข้อมูลลูกค้า</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              ชื่อ-นามสกุล <span className="text-green-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="สมชาย ใจดี"
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
                LINE ID <span className="text-green-500">*</span>
                <span className="ml-2 text-xs text-slate-400 font-normal">(ระบบจะส่งใบเสนอราคาผ่าน LINE)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                <input
                  type="text"
                  name="lineId"
                  required
                  placeholder="yourlineid"
                  className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                หรือ{' '}
                <a href="/api/auth/line?returnTo=/booking" className="text-[#06C755] font-bold hover:underline">
                  เข้าสู่ระบบด้วย LINE
                </a>
                {' '}เพื่อรับใบเสนอราคาทันทีโดยไม่ต้องส่ง ref
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ข้อมูลรถ */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">ข้อมูลรถ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              รุ่นรถ <span className="text-green-500">*</span>
            </label>
            <input
              type="text"
              name="carModel"
              required
              placeholder="Toyota Camry / Honda Civic"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              ปีรถ <span className="text-green-500">*</span>
            </label>
            <input
              type="number"
              name="carYear"
              required
              min="1990"
              max="2030"
              placeholder="2022"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>
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
              : 'ยืนยันการจอง — รับใบเสนอราคาผ่าน LINE'}
        </button>
        <p className="text-xs text-slate-400 text-center mt-3">
          ทีมงานจะติดต่อยืนยันการจองผ่าน LINE ภายใน 30 นาที (ในเวลาทำการ)
        </p>
      </div>
    </form>
  );
}
