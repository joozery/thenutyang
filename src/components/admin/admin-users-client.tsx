'use client';

import { useActionState, useTransition } from 'react';
import { createAdminUser, deleteAdminUser } from '@/app/actions/admin-users';
import { Trash2, UserPlus, Shield, ShieldCheck } from 'lucide-react';

interface AdminUserRow {
  id: string;
  username: string;
  displayName: string;
  role: 'super' | 'admin';
  createdAt: string;
}

interface Props {
  users: AdminUserRow[];
  currentUsername: string;
}

export function AdminUsersClient({ users, currentUsername }: Props) {
  const [state, formAction, pending] = useActionState(createAdminUser, null);
  const [, startDelete] = useTransition();

  function handleDelete(id: string) {
    if (!confirm('ยืนยันการลบบัญชีนี้?')) return;
    startDelete(() => deleteAdminUser(id, currentUsername));
  }

  return (
    <div className="space-y-6">
      {/* รายชื่อ Admin */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">บัญชีผู้ดูแลระบบ ({users.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">ชื่อ</th>
              <th className="px-6 py-3 text-left">Username</th>
              <th className="px-6 py-3 text-left">บทบาท</th>
              <th className="px-6 py-3 text-left">สร้างเมื่อ</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs">
                      {user.displayName[0]?.toUpperCase()}
                    </div>
                    {user.displayName}
                    {user.username === currentUsername && (
                      <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">คุณ</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 font-mono">{user.username}</td>
                <td className="px-6 py-4">
                  {user.role === 'super' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      <ShieldCheck size={12} /> Super Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                      <Shield size={12} /> Admin
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs">
                  {new Date(user.createdAt).toLocaleDateString('th-TH')}
                </td>
                <td className="px-6 py-4 text-right">
                  {user.username !== currentUsername && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ฟอร์มเพิ่ม Admin */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <UserPlus size={18} className="text-rose-500" />
          <h2 className="font-bold text-slate-800">เพิ่มบัญชีใหม่</h2>
        </div>

        {state?.error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-600 text-sm">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-600 text-sm">
            เพิ่มบัญชีสำเร็จแล้ว
          </div>
        )}

        <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Username</label>
            <input type="text" name="username" required placeholder="เช่น staff01"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่อที่แสดง</label>
            <input type="text" name="displayName" required placeholder="เช่น คุณสมชาย"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">รหัสผ่าน</label>
            <input type="password" name="password" required placeholder="อย่างน้อย 6 ตัว"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">บทบาท</label>
            <select name="role"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400 bg-white">
              <option value="admin">Admin</option>
              <option value="super">Super Admin</option>
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={pending}
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
              <UserPlus size={16} />
              {pending ? 'กำลังเพิ่ม...' : 'เพิ่มบัญชี'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
