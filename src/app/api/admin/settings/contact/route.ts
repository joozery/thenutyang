import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ContactSettings from '@/models/ContactSettings';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    let settings = await ContactSettings.findOne({});
    
    if (!settings) {
      // Create default settings if not exists
      settings = await ContactSettings.create({});
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching contact settings:', error);
    return NextResponse.json({ error: 'Failed to fetch contact settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();
    
    let settings = await ContactSettings.findOne({});
    
    if (settings) {
      settings = await ContactSettings.findOneAndUpdate({}, data, { new: true });
    } else {
      settings = await ContactSettings.create(data);
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating contact settings:', error);
    return NextResponse.json({ error: 'Failed to update contact settings' }, { status: 500 });
  }
}
