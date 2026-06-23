'use client';

import { useState } from 'react';
import type { CustomerSession } from '@/lib/customer-session';
import type { CustomerProfile } from '@/lib/customer-profile';
import type { CarBrandRow, CarModelRow } from '@/app/actions/car-data';
import { useCart } from './cart-context';
import { CarCombobox } from './car-combobox';

type CustomerType = 'individual' | 'corporate';

export function CartCheckoutForm({
  customer,
  profile,
  formId,
  formAction,
  carBrands,
  carModels,
}: {
  customer?: CustomerSession | null;
  profile?: CustomerProfile | null;
  formId: string;
  formAction: (formData: FormData) => void;
  carBrands: CarBrandRow[];
  carModels: CarModelRow[];
}) {
  const { items } = useCart();
  const [customerType, setCustomerType] = useState<CustomerType>('individual');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');

  const brandOptions = carBrands.map((b) => ({ id: b.id, label: b.name }));
  const matchedBrand = carBrands.find((b) => b.name.toLowerCase() === carBrand.trim().toLowerCase());
  const modelOptions = matchedBrand
    ? carModels.filter((m) => m.brandId === matchedBrand.id).map((m) => ({ id: m.id, label: m.name }))
    : [];

  const itemsJson = JSON.stringify(
    items.map((i) => ({ id: i.id, name: `${i.brand} ${i.model} ${i.size}`, price: i.price, quantity: i.quantity }))
  );

  return (
    <form id={formId} action={formAction} className="space-y-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
      <input type="hidden" name="items" value={itemsJson} />
      {customer && <input type="hidden" name="lineUserId" value={customer.lineUserId} />}

      {!customer && (
        <div>
          <a
            href="/api/auth/line?returnTo=/cart"
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

      <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-100">ข้อมูลลูกค้า</h3>

      <input type="hidden" name="customerType" value={customerType} />
      <div className="grid grid-cols-2 gap-2">
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
              type="text" name="companyName" required placeholder="บริษัท ... จำกัด"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {customerType === 'corporate' ? 'ชื่อผู้ติดต่อ' : 'ชื่อ'} {customerType === 'individual' && <span className="text-green-500">*</span>}
          </label>
          <input
            type="text" name="firstName" required={customerType === 'individual'} placeholder="สมชาย" defaultValue={profile?.firstName ?? ''}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">นามสกุล</label>
          <input
            type="text" name="lastName" placeholder="ใจดี" defaultValue={profile?.lastName ?? ''}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            เบอร์โทรศัพท์ <span className="text-green-500">*</span>
          </label>
          <input
            type="tel" name="phone" required placeholder="081-234-5678" pattern="[0-9]{9,10}" defaultValue={profile?.phone ?? ''}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>

        {customer ? (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">LINE</label>
            <div className="flex items-center gap-3 bg-[#06C755]/10 border border-[#06C755]/30 rounded-xl px-4 py-3">
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#06C755]" xmlns="http://www.w3.org/2000/svg">
                <title>LINE</title>
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
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
                type="text" name="lineId" placeholder="yourlineid"
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
            name="address" rows={2} placeholder="ที่อยู่สำหรับออกเอกสาร"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition resize-none"
          />
        </div>

        {customerType === 'corporate' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              เลขที่ผู้เสียภาษี <span className="text-xs text-slate-400 font-normal">(ไม่บังคับ)</span>
            </label>
            <input
              type="text" name="taxId" placeholder="0-0000-00000-00-0"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">ข้อมูลรถ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">ยี่ห้อรถ</label>
            <CarCombobox
              name="carBrand"
              options={brandOptions}
              placeholder="พิมพ์ค้นหา เช่น Toyota"
              value={carBrand}
              onChange={(v) => { setCarBrand(v); setCarModel(''); }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">รุ่นรถ</label>
            <CarCombobox
              name="carModel"
              options={modelOptions}
              placeholder={matchedBrand ? 'พิมพ์ค้นหา เช่น Vios' : 'เลือกยี่ห้อรถก่อน'}
              value={carModel}
              onChange={setCarModel}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">ทะเบียนรถ</label>
            <input
              type="text" name="licensePlate" placeholder="กข 1234 กรุงเทพมหานคร"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">เลขไมล์ปัจจุบัน</label>
            <input
              type="number" name="mileageBefore" min={0} placeholder="50000"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">ไม่บังคับ — ใส่เพื่อให้ทีมงานบันทึกประวัติการเข้ารับบริการของรถคุณ</p>
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">นัดหมายเข้ารับบริการ</h3>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          วันที่ต้องการ <span className="text-green-500">*</span>
        </label>
        <input
          type="date" name="appointmentDate" required min={new Date().toISOString().split('T')[0]}
          className="w-full md:w-64 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
        />
        <p className="text-xs text-slate-400 mt-1.5">ร้านเปิด จันทร์–อาทิตย์ 08:00–18:00 น.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">หมายเหตุ (ถ้ามี)</label>
        <textarea
          name="note" rows={3} placeholder="เช่น ต้องการตั้งศูนย์ถ่วงล้อด้วย..."
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition resize-none"
        />
      </div>
    </form>
  );
}
