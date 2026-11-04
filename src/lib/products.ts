import connectDB from './mongodb';
import { Product, IProduct } from '@/models/Product';

export type ProductRow = IProduct & { id: string };
export type ProductCostRow = Pick<IProduct, 'brand' | 'model' | 'size' | 'costPrice'>;
export type ProductAdminListOptions = {
  productType?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  size?: string;
  brand?: string;
  category?: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
};

export type ProductAdminListResult = {
  products: ProductRow[];
  totalItems: number;
  page: number;
  pageSize: number;
};

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
  productType?: string;
  q?: string;
}): Promise<ProductRow[]> {
  await connectDB();
  const query: Record<string, unknown> = { published: true };

  // ค้นหาอิสระ — แต่ละคำต้องเจอใน ยี่ห้อ/รุ่น/ขนาด (พิมพ์ '265/60R18' หรือ '265-60-18' ก็เจอ)
  if (filters?.q?.trim()) {
    query.$and = filters.q.trim().split(/\s+/).slice(0, 5).map((token) => {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(escaped.replace(/[/-]/g, '[/\\-R ]?'), 'i');
      return { $or: [{ brand: rx }, { model: rx }, { size: rx }] };
    });
  }
  if (filters?.brand)       query.brand   = new RegExp(`^${filters.brand}$`, 'i');
  if (filters?.rimSize)     query.rimSize = filters.rimSize;
  if (filters?.category)    query.category = filters.category;
  if (filters?.productType) query.productType = filters.productType;
  
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

export async function getProductAdminPage(options: ProductAdminListOptions = {}): Promise<ProductAdminListResult> {
  await connectDB();
  const pageSize = Math.max(1, Math.min(options.pageSize ?? 15, 100));
  const requestedPage = Math.max(1, options.page ?? 1);
  const typeQuery: Record<string, unknown> = !options.productType
    ? {}
    : options.productType === 'tires'
      ? { $or: [{ productType: 'tires' }, { productType: { $exists: false } }, { productType: null }] }
      : { productType: options.productType };
  const query: Record<string, unknown> = { $and: [typeQuery] };

  if (options.search?.trim()) {
    const rx = new RegExp(options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    (query.$and as Record<string, unknown>[]).push({ $or: [{ brand: rx }, { model: rx }, { size: rx }] });
  }
  if (options.size) query.size = options.size;
  if (options.brand) query.brand = options.brand;
  if (options.category) query.category = options.category;

  const allowedSortKeys = new Set(['brand', 'model', 'size', 'costPrice', 'priceCash', 'priceCredit', 'priceInstallment', 'stock']);
  const sortKey = allowedSortKeys.has(options.sortKey ?? '') ? options.sortKey! : 'brand';
  const direction = options.sortDir === 'desc' ? -1 : 1;

  const [totalItems, docs] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .sort({ [sortKey]: direction, _id: 1 })
      .skip((requestedPage - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const pageDocs = page === requestedPage ? docs : await Product.find(query)
    .sort({ [sortKey]: direction, _id: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return { products: pageDocs.map(d => normalize(d as Record<string, unknown>)), totalItems, page, pageSize };
}

export async function getProductFilterOptions(productType?: string) {
  await connectDB();
  const query = !productType
    ? {}
    : productType === 'tires'
      ? { $or: [{ productType: 'tires' }, { productType: { $exists: false } }, { productType: null }] }
      : { productType };
  const [sizes, brands, sizeRows] = await Promise.all([
    Product.distinct('size', query),
    Product.distinct('brand', query),
    Product.aggregate([{ $match: query }, { $group: { _id: '$size', count: { $sum: 1 } } }]),
  ]);
  return {
    sizes: sizes.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })),
    brands: brands.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), 'th')),
    sizeCounts: Object.fromEntries(sizeRows.filter((row) => row._id).map((row) => [String(row._id), row.count])),
  };
}

export async function getProductAdminSummary(productType?: string) {
  await connectDB();
  const query = !productType
    ? {}
    : productType === 'tires'
      ? { $or: [{ productType: 'tires' }, { productType: { $exists: false } }, { productType: null }] }
      : { productType };
  const [summary, categories] = await Promise.all([
    Product.aggregate([
      { $match: query },
      { $group: {
        _id: null,
        totalStock: { $sum: { $ifNull: ['$stock', 0] } },
        lowStockCount: { $sum: { $cond: [
          { $and: [{ $gt: [{ $ifNull: ['$stock', 0] }, 0] }, { $lte: ['$stock', 5] }] },
          1,
          0,
        ] } },
      } },
    ]),
    Product.aggregate([{ $match: query }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  return {
    totalStock: summary[0]?.totalStock ?? 0,
    lowStockCount: summary[0]?.lowStockCount ?? 0,
    totalItems: await Product.countDocuments(query),
    categoryCounts: Object.fromEntries(categories.map((row) => [String(row._id), row.count])),
  };
}

export async function getProductCostRows(): Promise<ProductCostRow[]> {
  await connectDB();
  return Product.find({}, { brand: 1, model: 1, size: 1, costPrice: 1, _id: 0 })
    .lean() as unknown as ProductCostRow[];
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
