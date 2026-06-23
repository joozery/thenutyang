import { getCarBrands, getCarModels } from '@/app/actions/car-data';
import { CarDataClient } from '@/components/admin/car-data-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ยี่ห้อ/รุ่นรถ | Admin' };

export default async function CarDataPage() {
  const [brands, models] = await Promise.all([getCarBrands(), getCarModels()]);
  return <CarDataClient initialBrands={brands} initialModels={models} />;
}
