'use client';

import { useActionState, useTransition, useState, useEffect } from 'react';
import { createAdminUser, deleteAdminUser, toggleAdminUserActive, updateAdminUser, changeAdminPassword } from '@/app/actions/admin-users';
import { Trash2, UserPlus, Shield, ShieldCheck, Search, Edit2, Lock, ToggleLeft, ToggleRight, X, Check, Clock } from 'lucide-react';

interface AdminUserRow {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone: string;
  role: 'super' | 'admin';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface Props {
  users: AdminUserRow[];
  currentUsername: string;
}

// ─── Modal Components ──────────────────────────────────────
function EditModal({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(updateAdminUser, null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Edit2 size={16} className="text-green-500" />แก้ไขข้อมูลผู้ใช้</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form action={async (fd) => { await formAction(fd); if (!state?.error) onClose(); }} className="p-5 space-y-4">
          <input type="hidden" name="id" value={user.id} />
          {state?.error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{state.error}</div>}
          {state?.success && <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-3 py-2.5 rounded-xl flex items-center gap-2"><Check size={14}/>บันทึกสำเร็จ</div>}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่อที่แสดง *</label>
            <input type="text" name="displayName" defaultValue={user.displayName} required className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">อีเมล</label>
            <input type="email" name="email" defaultValue={user.email} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">เบอร์โทร</label>
            <input type="tel" name="phone" defaultValue={user.phone} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">บทบาท</label>
            <select name="role" defaultValue={user.role} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white">
              <option value="admin">Admin</option>
              <option value="super">Super Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-xl text-sm hover:bg-slate-50 transition">ยกเลิก</button>
            <button type="submit" disabled={pending} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition">
              {pending ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordModal({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(changeAdminPassword, null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Lock size={16} className="text-amber-500" />เปลี่ยนรหัสผ่าน</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form action={async (fd) => { await formAction(fd); }} className="p-5 space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <p className="text-sm text-slate-500">ตั้งรหัสผ่านใหม่ให้ <span className="font-semibold text-slate-700">{user.displayName}</span></p>
          {state?.error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{state.error}</div>}
          {state?.success && <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-3 py-2.5 rounded-xl flex items-center gap-2"><Check size={14}/>เปลี่ยนรหัสผ่านสำเร็จ</div>}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">รหัสผ่านใหม่ *</label>
            <input type="password" name="newPassword" required placeholder="อย่างน้อย 6 ตัวอักษร" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-xl text-sm hover:bg-slate-50 transition">ยกเลิก</button>
            <button type="submit" disabled={pending} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition">
              {pending ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────
function CreateModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createAdminUser, null);

  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => onClose(), 1200);
      return () => clearTimeout(t);
    }
  }, [state?.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><UserPlus size={16} className="text-green-500" />เพิ่มบัญชีใหม่</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-5">
          {state?.error && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{state.error}</div>}
          {state?.success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-600 text-sm flex items-center gap-2">
              <Check size={14} />เพิ่มบัญชีสำเร็จแล้ว! กำลังปิดหน้าต่าง...
            </div>
          )}
          <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Username *</label>
              <input type="text" name="username" required placeholder="เช่น staff01" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่อที่แสดง *</label>
              <input type="text" name="displayName" required placeholder="เช่น คุณสมชาย" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">อีเมล</label>
              <input type="email" name="email" placeholder="example@email.com" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">เบอร์โทร</label>
              <input type="tel" name="phone" placeholder="08x-xxx-xxxx" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">รหัสผ่าน * (อย่างน้อย 6 ตัว)</label>
              <input type="password" name="password" required placeholder="••••••••" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">บทบาท</label>
              <select name="role" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white">
                <option value="admin">Admin</option>
                <option value="super">Super Admin</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" onClick={onClose} className="border border-slate-200 text-slate-600 font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition">ยกเลิก</button>
              <button type="submit" disabled={pending} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
                <UserPlus size={16} />
                {pending ? 'กำลังเพิ่ม...' : 'เพิ่มบัญชี'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function AdminUsersClient({ users, currentUsername }: Props) {
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [passwordUser, setPasswordUser] = useState<AdminUserRow | null>(null);

  const filtered = users.filter(u =>
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(id: string, name: string) {
    if (!confirm(`ยืนยันการลบบัญชี "${name}"?`)) return;
    startTransition(() => deleteAdminUser(id, currentUsername));
  }

  function handleToggle(id: string) {
    startTransition(() => toggleAdminUserActive(id, currentUsername));
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'ยังไม่เคย Login';
    const d = new Date(dateStr);
    return d.toLocaleString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      {/* Modals */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      {editUser && <EditModal user={editUser} onClose={() => setEditUser(null)} />}
      {passwordUser && <PasswordModal user={passwordUser} onClose={() => setPasswordUser(null)} />}

      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'ทั้งหมด', value: users.length, color: 'bg-slate-50 text-slate-700' },
            { label: 'Super Admin', value: users.filter(u => u.role === 'super').length, color: 'bg-amber-50 text-amber-700' },
            { label: 'Admin', value: users.filter(u => u.role === 'admin').length, color: 'bg-blue-50 text-blue-700' },
            { label: 'ใช้งานอยู่', value: users.filter(u => u.isActive).length, color: 'bg-green-50 text-green-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-4 border border-slate-100`}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>

        {/* User List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <h2 className="font-bold text-slate-800">บัญชีผู้ดูแลระบบ ({users.length})</h2>
            <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, username, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-green-400 w-64"
              />
            </div>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors whitespace-nowrap"
              >
                <UserPlus size={15} /> เพิ่มบัญชี
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">ผู้ใช้</th>
                  <th className="px-5 py-3 text-left">Username</th>
                  <th className="px-5 py-3 text-left">บทบาท</th>
                  <th className="px-5 py-3 text-left">Login ล่าสุด</th>
                  <th className="px-5 py-3 text-left">สถานะ</th>
                  <th className="px-5 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">ไม่พบผู้ใช้งาน</td></tr>
                )}
                {filtered.map(user => (
                  <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${!user.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {user.displayName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                            {user.displayName}
                            {user.username === currentUsername && (
                              <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">คุณ</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{user.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{user.username}</td>
                    <td className="px-5 py-3.5">
                      {user.role === 'super' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                          <ShieldCheck size={11} /> Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          <Shield size={11} /> Admin
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />{formatDate(user.lastLoginAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {user.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        {/* Edit */}
                        <button onClick={() => setEditUser(user)} title="แก้ไข" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={15} />
                        </button>
                        {/* Change password */}
                        <button onClick={() => setPasswordUser(user)} title="เปลี่ยนรหัสผ่าน" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <Lock size={15} />
                        </button>
                        {/* Toggle active */}
                        {user.username !== currentUsername && (
                          <button onClick={() => handleToggle(user.id)} title={user.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} className={`p-1.5 rounded-lg transition-colors ${user.isActive ? 'text-slate-400 hover:text-orange-500 hover:bg-orange-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}>
                            {user.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          </button>
                        )}
                        {/* Delete */}
                        {user.username !== currentUsername && (
                          <button onClick={() => handleDelete(user.id, user.displayName)} title="ลบบัญชี" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


      </div>
    </>
  );
}
