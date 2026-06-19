'use client';

import { useActionState, useState, useRef } from 'react';
import { updateMyProfile, changeMyPassword } from '@/app/actions/admin-users';
import { User, Lock, Shield, ShieldCheck, Clock, Phone, Mail, Check, AlertCircle, Camera, Loader2, CalendarDays, Key } from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'super' | 'admin';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

function StatusMessage({ state }: { state: { error?: string; success?: boolean } | null }) {
  if (!state) return null;
  if (state.error) return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
      <AlertCircle size={15} /> {state.error}
    </div>
  );
  if (state.success) return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-xl">
      <Check size={15} /> บันทึกสำเร็จ!
    </div>
  );
  return null;
}

export function AdminProfileClient({ user }: { user: UserProfile }) {
  const [profileState, profileAction, profilePending] = useActionState(updateMyProfile, null);
  const [passwordState, passwordAction, passwordPending] = useActionState(changeMyPassword, null);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError('');
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await fetch('/api/admin/upload-avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setAvatarError(data.error || 'อัปโหลดไม่สำเร็จ'); return; }
      setAvatarUrl(data.url);
    } catch {
      setAvatarError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setAvatarUploading(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'ยังไม่เคย Login';
    return new Date(dateStr).toLocaleString('th-TH', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      {/* LEFT COLUMN — Profile Card */}
      <div className="xl:col-span-1 flex flex-col gap-6">

        {/* Avatar Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative group mb-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.displayName}
                className="w-28 h-28 rounded-2xl object-cover shadow-lg ring-4 ring-slate-100"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-black text-5xl shadow-lg ring-4 ring-green-100">
                {user.displayName[0]?.toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 rounded-2xl bg-black/50 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {avatarUploading
                ? <Loader2 size={22} className="text-white animate-spin" />
                : <><Camera size={22} className="text-white" /><span className="text-white text-[10px] font-medium">เปลี่ยนรูป</span></>}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>

          {avatarError && <p className="text-xs text-red-500 mb-2 flex items-center gap-1"><AlertCircle size={11}/>{avatarError}</p>}

          <h2 className="text-xl font-black text-slate-800">{user.displayName}</h2>
          <p className="text-slate-400 text-sm font-mono mt-0.5">@{user.username}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            {user.role === 'super' ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                <ShieldCheck size={12} /> Super Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                <Shield size={12} /> Admin
              </span>
            )}
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {user.isActive ? '● ใช้งานอยู่' : '● ปิดใช้งาน'}
            </span>
          </div>

          <div className="w-full mt-5 pt-5 border-t border-slate-100 space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><Mail size={14} /></div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">อีเมล</p>
                <p className="font-medium text-slate-700 truncate">{user.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><Phone size={14} /></div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">เบอร์โทร</p>
                <p className="font-medium text-slate-700">{user.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><Clock size={14} /></div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Login ล่าสุด</p>
                <p className="font-medium text-slate-700 text-xs leading-relaxed">{formatDate(user.lastLoginAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><CalendarDays size={14} /></div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">สมัครเมื่อ</p>
                <p className="font-medium text-slate-700 text-xs">{new Date(user.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Key size={12}/>ข้อมูลบัญชี</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs text-slate-500">User ID</span>
              <span className="text-xs font-mono text-slate-400 truncate max-w-[120px]">{user.id}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs text-slate-500">สิทธิ์การเข้าถึง</span>
              <span className="text-xs font-medium text-slate-700">{user.role === 'super' ? 'ทุกส่วน' : 'ระดับ Admin'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-slate-500">สถานะ</span>
              <span className={`text-xs font-semibold ${user.isActive ? 'text-green-600' : 'text-red-500'}`}>{user.isActive ? 'ใช้งานปกติ' : 'ถูกระงับ'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — Forms */}
      <div className="xl:col-span-2 flex flex-col gap-6">

        {/* Edit Profile Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <User size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">แก้ไขข้อมูลส่วนตัว</h3>
              <p className="text-xs text-slate-400">อัปเดตชื่อ อีเมล และเบอร์โทร</p>
            </div>
          </div>

          <StatusMessage state={profileState} />

          <form action={profileAction} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">ชื่อที่แสดง *</label>
                <input type="text" name="displayName" defaultValue={user.displayName} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Username</label>
                <input type="text" value={user.username} disabled className="w-full border border-slate-100 rounded-xl px-4 py-3 text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">อีเมล</label>
                <input type="email" name="email" defaultValue={user.email} placeholder="example@email.com" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">เบอร์โทร</label>
                <input type="tel" name="phone" defaultValue={user.phone} placeholder="08x-xxx-xxxx" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button type="submit" disabled={profilePending} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-md shadow-blue-600/20">
                {profilePending ? <><Loader2 size={15} className="animate-spin" />กำลังบันทึก...</> : 'บันทึกข้อมูล'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Lock size={16} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h3>
              <p className="text-xs text-slate-400">ต้องใส่รหัสผ่านปัจจุบันก่อนทำการเปลี่ยน</p>
            </div>
          </div>

          <StatusMessage state={passwordState} />

          <form action={passwordAction} className="mt-4 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">รหัสผ่านปัจจุบัน *</label>
              <input type="password" name="currentPassword" required placeholder="••••••••" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">รหัสผ่านใหม่ * <span className="font-normal text-slate-400">(อย่างน้อย 6 ตัว)</span></label>
                <input type="password" name="newPassword" required placeholder="••••••••" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">ยืนยันรหัสผ่านใหม่ *</label>
                <input type="password" name="confirmPassword" required placeholder="••••••••" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={passwordPending} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-md shadow-amber-500/20">
                <Lock size={15} />
                {passwordPending ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
