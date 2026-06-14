import connectDB from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import { cookies } from 'next/headers';
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';
import { AdminUsersClient } from '@/components/admin/admin-users-client';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  await connectDB();

  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value ?? '';
  const session = await verifySessionToken(token);
  const currentUsername = session?.username ?? '';

  const users = await AdminUser.find().sort({ createdAt: 1 }).lean();

  const serialized = users.map(u => ({
    id: u._id.toString(),
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">จัดการ Admin</h1>
        <p className="text-slate-500 text-sm mt-1">เพิ่มหรือลบบัญชีผู้ดูแลระบบ</p>
      </div>
      <AdminUsersClient users={serialized} currentUsername={currentUsername} />
    </div>
  );
}
