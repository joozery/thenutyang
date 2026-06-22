import PromotionsClient from '@/components/admin/promotions-client';

export const metadata = { title: 'จัดการโปรโมชั่น | Admin' };

export default function AdminPromotionsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">จัดการโปรโมชั่น</h1>
      <PromotionsClient />
    </div>
  );
}
