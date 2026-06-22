'use client';

import { useActionState } from 'react';
import { updateCustomerProfile } from '@/app/actions/customer-auth';
import type { CustomerProfile } from '@/lib/customer-profile';

export function ProfileForm({ profile }: { profile: CustomerProfile | null }) {
  const [state, formAction, isPending] = useActionState(updateCustomerProfile, null);

  return (
    <form action={formAction} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6 space-y-4">
      <h3 className="font-bold text-slate-800">ข้อมูลส่วนตัว</h3>

      {state?.error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-red-600 text-sm">{state.error}</div>
      )}
      {state?.ok && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-green-600 text-sm">บันทึกข้อมูลแล้ว</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">ชื่อ</label>
          <input
            type="text" name="firstName" defaultValue={profile?.firstName ?? ''} placeholder="ชื่อ"
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">นามสกุล</label>
          <input
            type="text" name="lastName" defaultValue={profile?.lastName ?? ''} placeholder="นามสกุล"
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">เบอร์โทรศัพท์</label>
        <input
          type="tel" name="phone" defaultValue={profile?.phone ?? ''} placeholder="081-234-5678" pattern="[0-9]{9,10}"
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
      >
        {isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
      </button>
    </form>
  );
}
