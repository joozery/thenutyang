import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { FinancialDocument } from '@/models/FinancialDocument';
import { Product } from '@/models/Product';
import { Booking } from '@/models/Booking';
import { Income } from '@/models/Income';
import { Expense } from '@/models/Expense';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    // ช่วงที่เลือก: ไม่ใส่อะไรเลย = วันนี้, ใส่แค่ฝั่งเดียว = วันเดียว, ใส่ทั้งคู่ = ช่วง
    const dateFrom = dateFromParam || dateToParam || new Date().toISOString().slice(0, 10);
    const dateTo   = dateToParam   || dateFromParam || new Date().toISOString().slice(0, 10);
    const isRange  = dateFrom !== dateTo;

    // "now" ใช้คำนวณเดือนปัจจุบัน (การ์ดเดือนนี้ไม่ขึ้นกับช่วงที่เลือก ยึดท้ายช่วงเป็นจุดอ้างอิง)
    const now = new Date(dateTo);

    const rangeStart = new Date(dateFrom);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(dateTo);
    rangeEnd.setHours(23, 59, 59, 999);
    const rangeDays = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1;

    const prevDayStart = new Date(rangeStart);
    prevDayStart.setDate(prevDayStart.getDate() - 1);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // ─── ยอดขายในช่วงที่เลือก (+ เมื่อเลือกวันเดียว เทียบกับวันก่อนหน้า) ───
    const [rangeDocs, prevDayDocs, monthDocs] = await Promise.all([
      FinancialDocument.find({
        type: 'invoice',
        createdAt: { $gte: rangeStart, $lte: rangeEnd },
      }).lean(),
      isRange ? Promise.resolve([]) : FinancialDocument.find({
        type: 'invoice',
        createdAt: { $gte: prevDayStart, $lt: rangeStart },
      }).lean(),
      FinancialDocument.find({
        type: 'invoice',
        createdAt: { $gte: monthStart, $lt: nextMonthStart },
      }).lean(),
    ]);

    const rangeRevenue = rangeDocs.filter(d => d.status === 'paid').reduce((s, d) => s + d.grandTotal, 0);
    const rangeBills = rangeDocs.length;
    const prevDayRevenue = prevDayDocs.filter(d => d.status === 'paid').reduce((s, d) => s + d.grandTotal, 0);
    const prevDayBills = prevDayDocs.length;
    const monthRevenue = monthDocs.filter(d => d.status === 'paid').reduce((s, d) => s + d.grandTotal, 0);

    const [monthIncomes, monthExpenses] = await Promise.all([
      Income.aggregate([
        { $match: { incomeDate: { $gte: monthStart, $lt: nextMonthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { expenseDate: { $gte: monthStart, $lt: nextMonthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    const totalIncomeMonth = monthIncomes[0]?.total ?? 0;
    const totalExpenseMonth = monthExpenses[0]?.total ?? 0;

    // เทียบเปอร์เซ็นต์ได้เฉพาะตอนเลือกวันเดียว (เทียบกับวันก่อนหน้า) — ช่วงหลายวันเทียบกับช่วงก่อนหน้าไม่สมเหตุ จึงไม่แสดง
    const revenueTrend = !isRange && prevDayRevenue > 0
      ? (((rangeRevenue - prevDayRevenue) / prevDayRevenue) * 100).toFixed(1)
      : null;
    const billTrend = isRange ? null : rangeBills - prevDayBills;

    // ─── Low stock products ──────────────────────────────────────
    const lowStock = await Product.find({ stock: { $lt: 5 }, published: true })
      .sort({ stock: 1 })
      .limit(5)
      .lean();

    // ─── Pending bookings ────────────────────────────────────────
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const rangeBookings = await Booking.countDocuments({
      createdAt: { $gte: rangeStart, $lte: rangeEnd },
    });

    // ─── Recent invoices (ในช่วงที่เลือก) ─────────────────────────
    const recentInvoices = await FinancialDocument.find({ type: 'invoice', createdAt: { $gte: rangeStart, $lte: rangeEnd } })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    // ─── Monthly chart data (last 6 months) ──────────────────────
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const docs = await FinancialDocument.find({
        type: 'invoice',
        status: 'paid',
        createdAt: { $gte: mStart, $lt: mEnd },
      }).lean();
      const total = docs.reduce((s, d) => s + d.grandTotal, 0);
      const thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
      chartData.push({ month: thMonths[mStart.getMonth()], revenue: total, count: docs.length });
    }

    // ─── Category breakdown ───────────────────────────────────────
    const categoryData = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, stock: { $sum: '$stock' } } }
    ]);

    // ─── Top products by stock sold (approximate from invoices) ──
    const totalProducts = await Product.countDocuments({ published: true });
    const totalStock = await Product.aggregate([
      { $group: { _id: null, total: { $sum: '$stock' } } }
    ]);

    return NextResponse.json({
      summary: {
        isRange,
        rangeDays,
        rangeRevenue,
        rangeBills,
        revenueTrend,
        billTrend,
        monthRevenue,
        pendingBookings,
        rangeBookings,
        totalProducts,
        totalStock: totalStock[0]?.total ?? 0,
        totalIncomeMonth,
        totalExpenseMonth,
      },
      recentInvoices: recentInvoices.map(inv => ({
        id: inv._id.toString(),
        docNumber: inv.docNumber,
        customerName: inv.customerName,
        grandTotal: inv.grandTotal,
        status: inv.status,
        paymentMethod: inv.paymentMethod,
        createdAt: inv.createdAt,
      })),
      lowStock: lowStock.map(p => ({
        id: p._id.toString(),
        name: `${p.brand} ${p.model} ${p.size}`,
        stock: p.stock,
        category: p.category,
      })),
      chartData,
      categoryData: categoryData.map(c => ({
        name: c._id,
        count: c.count,
        stock: c.stock,
      })),
    });
  } catch (err) {
    console.error('[dashboard]', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
