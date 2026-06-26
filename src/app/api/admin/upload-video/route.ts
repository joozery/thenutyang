import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';

export const maxDuration = 120; // 2 นาที สำหรับไฟล์ใหญ่

const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const MAX_MB  = 300;

export async function POST(req: NextRequest) {
  try {
    const formData   = await req.formData();
    const file       = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 });

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'รองรับเฉพาะ MP4, WebM, MOV, AVI' }, { status: 400 });
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `ไฟล์ต้องไม่เกิน ${MAX_MB}MB` }, { status: 400 });
    }

    const ext    = file.name.split('.').pop() ?? 'mp4';
    const key    = `videos/homepage-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url    = await uploadToR2(buffer, key, file.type);

    return NextResponse.json({ url });
  } catch (e) {
    console.error('[upload-video]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
