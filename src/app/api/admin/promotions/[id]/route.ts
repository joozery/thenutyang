import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Promotion } from '@/models/Promotion';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const data = await req.json();
    await connectDB();
    
    const promotion = await Promotion.findByIdAndUpdate(params.id, data, { new: true });
    if (!promotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }
    
    return NextResponse.json(promotion);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectDB();
    const promotion = await Promotion.findByIdAndDelete(params.id);
    
    if (!promotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
