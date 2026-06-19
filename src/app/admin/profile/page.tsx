import connectDB from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import { cookies } from 'next/headers';
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminProfileClient } from '@/components/admin/admin-profile-client';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  await connectDB();

  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value ?? '';
  const session = await verifySessionToken(token);
  if (!session) redirect('/admin/login');

  const user = await AdminUser.findOne({ username: session.username }).lean();
  if (!user) redirect('/admin/login');

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">โปรไฟล์ของฉัน</h1>
        <p className="text-slate-500 text-sm mt-1">จัดการข้อมูลส่วนตัวและรหัสผ่าน</p>
      </div>
      <AdminProfileClient
        user={{
          id: user._id.toString(),
          username: user.username,
          displayName: user.displayName,
          email: user.email ?? '',
          phone: user.phone ?? '',
          avatar: user.avatar ?? '',
          role: user.role,
          isActive: user.isActive !== false,
          lastLoginAt: user.lastLoginAt instanceof Date ? user.lastLoginAt.toISOString() : null,
          createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
        }}
      />
    </div>
  );
}
