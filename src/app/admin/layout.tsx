import { cookies } from 'next/headers';
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';
import { AdminLayoutShell } from '@/components/admin/layout-shell';
import connectDB from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return <>{children}</>;
  }

  // Fetch real user data
  await connectDB();
  const user = await AdminUser.findOne({ username: session.username }).lean();

  const adminUser = user ? {
    displayName: user.displayName,
    username: user.username,
    role: user.role,
    avatar: user.avatar ?? '',
  } : {
    displayName: session.username,
    username: session.username,
    role: 'admin' as const,
    avatar: '',
  };

  return <AdminLayoutShell adminUser={adminUser}>{children}</AdminLayoutShell>;
}
