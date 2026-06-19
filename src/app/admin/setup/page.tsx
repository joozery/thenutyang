'use client';

import { useActionState } from 'react';
import { setupFirstAdmin } from '@/app/actions/admin-users';

export default function SetupPage() {
  const [state, formAction, pending] = useActionState(setupFirstAdmin, null);

  return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-lg shadow-green-500/20 mx-auto mb-4">N</div>
          <h1 className="text-white text-xl font-bold">ตั้งค่าระบบครั้งแรก</h1>
          <p className="text-slate-400 text-sm mt-1">สร้างบัญชี Admin หลักของระบบ</p>
        </div>

        <form action={formAction} className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 space-y-4">
          {state?.error && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm text-center">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">ชื่อผู้ใช้ (username)</label>
            <input type="text" name="username" required placeholder="admin"
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">ชื่อที่แสดง</label>
            <input type="text" name="displayName" required placeholder="ผู้ดูแลระบบ"
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">รหัสผ่าน (อย่างน้อย 6 ตัว)</label>
            <input type="password" name="password" required placeholder="••••••••"
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition text-sm" />
          </div>

          <button type="submit" disabled={pending}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm mt-2">
            {pending ? 'กำลังสร้าง...' : 'สร้างบัญชี Admin หลัก'}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-4">
          หน้านี้จะใช้ได้เฉพาะครั้งแรกที่ยังไม่มี Admin ในระบบ
        </p>
      </div>
    </div>
  );
}
