import ServicesClient from '@/components/admin/services-client';

export const metadata = { title: 'จัดการบริการหลังการขาย | Admin' };

export default function AdminServicesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">จัดการบริการหลังการขาย</h1>
      <ServicesClient />
    </div>
  );
}
