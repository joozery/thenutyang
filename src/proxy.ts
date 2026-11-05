import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login' || pathname === '/admin/setup') return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const ok = token ? await verifySessionToken(token) : false;

  if (!ok) {
    // API หลังบ้าน: ตอบ 401 แบบ JSON (fetch ฝั่ง client จะได้ไม่ไปตาม redirect ได้ HTML หน้า login)
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
