import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { HomepageSettings } from '@/models/HomepageSettings';

export async function GET() {
  await connectDB();
  const doc = await HomepageSettings.findOne().lean();
  return NextResponse.json(doc ?? { error: 'ไม่พบ document ใน DB' });
}
