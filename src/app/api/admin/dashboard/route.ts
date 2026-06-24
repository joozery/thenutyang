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
    const dateParam = searchParams.get('date');
    
    let now = new Date();
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        now = parsed;
      }
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // ─── Today's invoices (paid only) ───────────────────────────
    const [todayDocs, yesterdayDocs, monthDocs] = await Promise.all([
      FinancialDocument.find({
        type: 'invoice',
        createdAt: { $gte: todayStart, $lt: tomorrowStart },
      }).lean(),
      FinancialDocument.find({
        type: 'invoice',
        createdAt: { $gte: yesterdayStart, $lt: todayStart },
      }).lean(),
      FinancialDocument.find({
        type: 'invoice',
        createdAt: { $gte: monthStart, $lt: nextMonthStart },
      }).lean(),
    ]);

    const todayRevenue = todayDocs.filter(d => d.status === 'paid').reduce((s, d) => s + d.grandTotal, 0);
    const yesterdayRevenue = yesterdayDocs.filter(d => d.status === 'paid').reduce((s, d) => s + d.grandTotal, 0);
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

    const todayBills = todayDocs.length;
    const yesterdayBills = yesterdayDocs.length;

    const revenueTrend = yesterdayRevenue > 0
      ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)
      : null;
    const billTrend = todayBills - yesterdayBills;

    // ─── Low stock products ──────────────────────────────────────
    const lowStock = await Product.find({ stock: { $lt: 5 }, published: true })
      .sort({ stock: 1 })
      .limit(5)
      .lean();

    // ─── Pending bookings ────────────────────────────────────────
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: todayStart, $lt: tomorrowStart },
    });

    // ─── Recent invoices ─────────────────────────────────────────
    const recentInvoices = await FinancialDocument.find({ type: 'invoice', createdAt: { $gte: todayStart, $lt: tomorrowStart } })
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
        todayRevenue,
        yesterdayRevenue,
        revenueTrend,
        todayBills,
        yesterdayBills,
        billTrend,
        monthRevenue,
        pendingBookings,
        todayBookings,
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
