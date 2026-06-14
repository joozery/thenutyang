import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createCustomerToken, CUSTOMER_COOKIE, CUSTOMER_MAX_AGE } from '@/lib/customer-session';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const jar = await cookies();
  const stored = jar.get('line_oauth_state')?.value;
  jar.delete('line_oauth_state');

  if (!code || !stored) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }

  let parsedState: { state: string; returnTo: string };
  try {
    parsedState = JSON.parse(stored);
  } catch {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }

  if (state !== parsedState.state) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }

  // แลก code → access token
  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/line/callback`,
      client_id: process.env.LINE_LOGIN_CLIENT_ID!,
      client_secret: process.env.LINE_LOGIN_CLIENT_SECRET!,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }

  const { access_token } = await tokenRes.json() as { access_token: string };

  // ดึงข้อมูล profile
  const profileRes = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!profileRes.ok) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }

  const { userId, displayName, pictureUrl } = await profileRes.json() as {
    userId: string;
    displayName: string;
    pictureUrl?: string;
  };

  const token = await createCustomerToken({ lineUserId: userId, displayName, pictureUrl });
  jar.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CUSTOMER_MAX_AGE,
    path: '/',
  });

  return NextResponse.redirect(new URL(parsedState.returnTo, request.url));
}
