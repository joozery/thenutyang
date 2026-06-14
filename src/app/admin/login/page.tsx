'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-lg shadow-rose-500/20 mx-auto mb-4">
            N
          </div>
          <h1 className="text-white text-xl font-bold">The Nut Admin</h1>
          <p className="text-slate-400 text-sm mt-1">เข้าสู่ระบบจัดการร้านค้า</p>
        </div>

        <form action={formAction} className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 space-y-5">
          {state?.error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm text-center">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              name="username"
              required
              autoComplete="username"
              placeholder="admin"
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              รหัสผ่าน
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {pending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          เดอะนัททายางยนต์ © 2024
        </p>
      </div>
    </div>
  );
}
