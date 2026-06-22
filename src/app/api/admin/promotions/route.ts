import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Promotion } from '@/models/Promotion';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const promotions = await Promotion.find().sort({ order: 1, createdAt: -1 });
    return NextResponse.json(promotions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    await connectDB();
    const promotion = await Promotion.create(data);
    return NextResponse.json(promotion);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
