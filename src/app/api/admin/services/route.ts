import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Service } from '@/models/Service';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const services = await Service.find().sort({ order: 1, createdAt: -1 });
    return NextResponse.json(services);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    await connectDB();
    
    // Auto-increment order
    if (data.order === undefined || data.order === 0) {
      const lastService = await Service.findOne().sort({ order: -1 });
      data.order = lastService ? lastService.order + 1 : 1;
    }
    
    const service = await Service.create(data);
    return NextResponse.json(service);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
