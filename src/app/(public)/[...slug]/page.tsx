import Link from 'next/link';
import { Clock, ArrowLeft } from 'lucide-react';
import { getProducts } from '@/lib/products';
import { getBrands } from '@/app/actions/brands';
import { ProductGridClient } from '@/components/products/product-grid-client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type ProductCategory = {
  label: string;
  labelEn: string;
  description: string;
};

const PRODUCT_CATEGORIES: Record<string, ProductCategory> = {
  wheels:      { label: 'ล้อแม็ก',       labelEn: 'Alloy Wheels',      description: 'ล้อแม็กคุณภาพสูง หลากหลายยี่ห้อและดีไซน์' },
  accessories: { label: 'ของแต่ง',       labelEn: 'Car Accessories',   description: 'อุปกรณ์แต่งรถ ครบครันทุกประเภท' },
  brakes:      { label: 'เบรค',           labelEn: 'Brake System',      description: 'ผ้าเบรค จานเบรค และชิ้นส่วนระบบเบรค' },
  shock:       { label: 'โช๊คอัพ',        labelEn: 'Shock Absorbers',   description: 'โช๊คอัพคุณภาพดี นุ่ม เงียบ ทนทาน' },
  oil:         { label: 'น้ำมันเครื่อง', labelEn: 'Engine Oil',        description: 'น้ำมันเครื่องทุกยี่ห้อ เกรด และประเภท' },
};

const OTHER_LABELS: Record<string, string> = {
  promotions: 'โปรโมชั่น',
  articles:   'บทความ',
  contact:    'ติดต่อเรา',
  faq:        'คำถามที่พบบ่อย',
  privacy:    'นโยบายความเป็นส่วนตัว',
  terms:      'เงื่อนไขการให้บริการ',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const key = slug[0] ?? '';
  const cat = PRODUCT_CATEGORIES[key];
  if (cat) return { title: `${cat.label} | THENUTTIRE` };
  return { title: `${OTHER_LABELS[key] ?? key} | THENUTTIRE` };
}

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ brand?: string }>;
}) {
  const { slug } = await params;
  const { brand } = await searchParams;
  const key = slug[0] ?? '';

  const cat = PRODUCT_CATEGORIES[key];

  // หน้าหมวดหมู่สินค้าจริง
  if (cat) {
    const [products, brands] = await Promise.all([
      getProducts({ productType: key, brand }),
      getBrands(key),
    ]);

    return (
      <div className="bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-slate-100">
          <div className="container mx-auto px-4 md:px-8 py-6">
            <p className="text-xs text-slate-400 mb-1 font-medium">{cat.labelEn}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{cat.label}</h1>
            <p className="text-slate-500 text-sm mt-1">{cat.description}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-8 py-8">
          <ProductGridClient
            initialProducts={products}
            initialBrands={brands}
            categoryLabel={cat.label}
          />
        </div>
      </div>
    );
  }

  // หน้า Coming Soon สำหรับ route อื่น
  const label = OTHER_LABELS[key] ?? 'หน้านี้';
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
        <Clock className="w-10 h-10 text-green-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{label}</h1>
      <p className="text-slate-500 mb-8 max-w-sm">
        กำลังอยู่ระหว่างการพัฒนา เร็วๆ นี้จะเปิดให้บริการค่ะ
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
