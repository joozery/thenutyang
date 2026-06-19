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
}): Promise<ProductRow[]> {
  await connectDB();
  const query: Record<string, unknown> = { published: true };
  if (filters?.brand)    query.brand   = filters.brand;
  if (filters?.rimSize)  query.rimSize = filters.rimSize;
  if (filters?.category) query.category = filters.category;
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

export async function getAllProductsAdmin(): Promise<ProductRow[]> {
  await connectDB();
  const docs = await Product.find({}).sort({ brand: 1, size: 1, model: 1 }).lean();
  return docs.map(normalize);
}

export function rimFromSize(size: string): number {
  const m = size.match(/R(\d+)$/i);
  return m ? Number(m[1]) : 15;
}
