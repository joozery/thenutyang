import connectDB from './mongodb';
import { Product, IProduct } from '@/models/Product';

export type ProductRow = IProduct & { id: string };

function normalize(doc: Record<string, unknown>): ProductRow {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest } as unknown as ProductRow;
}

export async function getProducts(filters?: {
  brand?: string;
  rimSize?: number;
  category?: string;
  size?: string;
  width?: string;
  series?: string;
  rim?: string;
}): Promise<ProductRow[]> {
  await connectDB();
  const query: Record<string, unknown> = { published: true };
  if (filters?.brand)    query.brand   = new RegExp(`^${filters.brand}$`, 'i');
  if (filters?.rimSize)  query.rimSize = filters.rimSize;
  if (filters?.category) query.category = filters.category;
  
  if (filters?.width && filters?.series && filters?.rim) {
    // Matches: 205/55R16, 265/60-18, 195R14C (if series is 80)
    query.size = new RegExp(`^${filters.width}(?:/)?(?:${filters.series})?[^0-9]*${filters.rim}`, 'i');
  } else if (filters?.size) {
    query.size = filters.size;
  }

  const docs = await Product.find(query).sort({ brand: 1, model: 1 }).lean();
  return docs.map(normalize);
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  await connectDB();
  try {
    const doc = await Product.findById(id).lean();
    if (!doc) return null;
    return normalize(doc as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getAllProductsAdmin(productType?: string): Promise<ProductRow[]> {
  await connectDB();
  // ยางเก่าที่ถูกสร้างก่อนมี productType field จะไม่มีค่านี้ใน DB
  // ให้นับว่าเป็น 'tires' (ค่า default) เพื่อให้แสดงในแท็บยางตามปกติ
  const query = !productType ? {}
    : productType === 'tires'
      ? { $or: [{ productType: 'tires' }, { productType: { $exists: false } }, { productType: null }] }
      : { productType };
  const docs = await Product.find(query).sort({ brand: 1, size: 1, model: 1 }).lean();
  return docs.map(normalize);
}

export async function getPopularProducts(
  limit = 4,
  rimFilter?: { rimSize?: number; minRimSize?: number }
): Promise<ProductRow[]> {
  await connectDB();
  const match: Record<string, unknown> = { published: true };
  if (rimFilter?.rimSize)        match.rimSize = rimFilter.rimSize;
  else if (rimFilter?.minRimSize) match.rimSize = { $gte: rimFilter.minRimSize };

  const badged = await Product.find({ ...match, badge: { $exists: true, $nin: ['', null] } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  if (badged.length >= limit) return badged.map(normalize);

  const rest = await Product.find({ ...match, _id: { $nin: badged.map(d => d._id) } })
    .sort({ createdAt: -1 })
    .limit(limit - badged.length)
    .lean();

  return [...badged, ...rest].map(normalize);
}

export function rimFromSize(size: string): number {
  const m = size.match(/R(\d+)$/i);
  return m ? Number(m[1]) : 15;
}
