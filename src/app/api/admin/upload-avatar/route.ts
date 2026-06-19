import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import { uploadToR2 } from '@/lib/r2';

export async function POST(req: NextRequest) {
  try {
    // Verify session
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value ?? '';
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์รูปภาพ' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'รองรับเฉพาะ JPG, PNG, WebP, GIF เท่านั้น' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'ไฟล์ต้องมีขนาดไม่เกิน 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.type.split('/')[1];
    const key = `avatars/admin-${session.username}-${Date.now()}.${ext}`;

    const url = await uploadToR2(buffer, key, file.type);

    // Update database
    await connectDB();
    await AdminUser.findOneAndUpdate(
      { username: session.username },
      { avatar: url }
    );

    return NextResponse.json({ url });
  } catch (err) {
    console.error('[upload-avatar]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
