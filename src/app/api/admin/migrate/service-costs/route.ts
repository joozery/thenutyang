import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { FinancialDocument } from '@/models/FinancialDocument';
import { ServiceItem } from '@/models/ServiceItem';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await connectDB();

    // ดึงชื่อบริการทั้งหมด
    const services = await ServiceItem.find({}).lean();
    const serviceNames = new Set(services.map((s) => s.name));

    if (serviceNames.size === 0) {
      return NextResponse.json({ ok: true, updated: 0, message: 'ไม่พบข้อมูลบริการ' });
    }

    // ดึงเอกสารทั้งหมด
    const docs = await FinancialDocument.find({}).lean() as {
      _id: unknown;
      costPrice: number;
      items: { description: string; qty: number; unitPrice: number }[];
    }[];

    let updated = 0;

    for (const doc of docs) {
      // คำนวณต้นทุนบริการที่หายไป (ที่เคย lineCostPrice = 0)
      const serviceCostToAdd = doc.items.reduce((sum, item) => {
        if (serviceNames.has(item.description)) {
          return sum + item.unitPrice * item.qty * 0.5;
        }
        return sum;
      }, 0);

      if (serviceCostToAdd > 0) {
        await FinancialDocument.findByIdAndUpdate(doc._id, {
          $inc: { costPrice: serviceCostToAdd },
        });
        updated++;
      }
    }

    return NextResponse.json({ ok: true, updated, total: docs.length });
  } catch (err) {
    console.error('[migrate/service-costs]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
