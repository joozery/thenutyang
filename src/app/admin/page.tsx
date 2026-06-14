import { SummaryCards } from '@/components/admin/summary-cards';
import { SalesChart } from '@/components/admin/sales-chart';
import { CategoryChart } from '@/components/admin/category-chart';
import { Notifications } from '@/components/admin/notifications';
import { RecentInvoices } from '@/components/admin/recent-invoices';
import { LowStock } from '@/components/admin/low-stock';
import { TopCustomers } from '@/components/admin/top-customers';
import { Calendar } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
          <div className="text-sm text-slate-500 font-medium mt-1">หน้าหลัก / Dashboard</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-3 text-sm font-medium text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
          <Calendar size={16} className="text-slate-500" />
          <span>วันนี้ (9 พ.ค. 2567)</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <SummaryCards />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="lg:col-span-1">
          <CategoryChart />
        </div>
        <div className="lg:col-span-1">
          <Notifications />
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-2">
          <RecentInvoices />
        </div>
        <div className="lg:col-span-1">
          <LowStock />
        </div>
        <div className="lg:col-span-1">
          <TopCustomers />
        </div>
      </div>
      
      <div className="text-xs text-slate-400 mt-8 mb-2 flex justify-between">
        <span>© 2024 เดอะนัทยางยนต์ สงวนลิขสิทธิ์ทุกประการ</span>
        <span>เวอร์ชั่น 1.0.0</span>
      </div>
    </div>
  );
}
