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

  // ดึงเฉพาะฟิลด์ที่หน้า grid ใช้ — ไม่ส่ง description/images/specs (หนัก) และ costPrice (ข้อมูลภายใน) ไปหน้าร้าน
  const docs = await Product.find(query)
    .select(PUBLIC_LIST_FIELDS)
    .sort({ brand: 1, model: 1 })
    .lean();
  return docs.map(normalize);
}

const PUBLIC_LIST_FIELDS =
  'brand model size rimSize type category productType priceCash priceCredit priceInstallment oldPrice image stock year badge note published';

// ─── หน้าร้าน /tires — แบ่งหน้า + กรองฝั่ง server ─────────────────────────────

export const TIRE_PAGE_SIZE = 16;
export const TIRE_SORTS = ['recommended', 'priceAsc', 'priceDesc', 'size'] as const;
export type TireSort = (typeof TIRE_SORTS)[number];

export type TireListingFilters = {
  /** ขนาดแบบตรงตัว (จาก dropdown ในหน้า) เช่น 215/55R17 */
  size?: string;
  brand?: string;
  q?: string;
  rim?: string;
  width?: string;
  series?: string;
  category?: string;
  sort?: TireSort;
  page?: number;
};

export type TireListingResult = {
  products: ProductRow[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  /** ขนาดทั้งหมดที่มีในตัวกรองหลัก (ไม่รวม size/brand ที่เลือก) — ใช้ทำ dropdown */
  sizes: string[];
  /** ยี่ห้อที่มีในขนาดที่เลือก — ใช้ทำ dropdown */
  brands: string[];
};

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** ยางเก่าที่ไม่มี productType ให้นับเป็นยาง (เหมือนฝั่งแอดมิน) */
const TIRE_TYPE_QUERY = { $or: [{ productType: 'tires' }, { productType: { $exists: false } }, { productType: null }] };

/**
 * คำค้นแต่ละคำต้องเจอใน ยี่ห้อ/รุ่น/ขนาด
 * ขนาดยางพิมพ์ได้หลายแบบ: 215/55R17, 215-55-17, 2155517 → เทียบแบบไม่สนตัวคั่น
 */
function searchClauses(q: string) {
  return q.trim().split(/\s+/).slice(0, 5).map((token) => {
    const textRx = new RegExp(escapeRx(token), 'i');
    const bare = token.replace(/[/\-\sRr]/g, '');
    const sizeRx = bare
      ? new RegExp(bare.split('').map(escapeRx).join('[/\\-Rr ]*'), 'i')
      : textRx;
    return { $or: [{ brand: textRx }, { model: textRx }, { size: sizeRx }] };
  });
}

export async function getTireListingPage(filters: TireListingFilters = {}): Promise<TireListingResult> {
  await connectDB();

  // ตัวกรองหลัก (มาจากเมนู/ลิงก์ค้นหาขนาด) — ใช้คำนวณตัวเลือกใน dropdown
  const base: Record<string, unknown>[] = [{ published: true }, TIRE_TYPE_QUERY];
  if (filters.q?.trim()) base.push(...searchClauses(filters.q));
  if (filters.category) base.push({ category: filters.category });
  if (filters.width && filters.series && filters.rim) {
    // Matches: 205/55R16, 265/60-18, 195R14C (if series is 80)
    base.push({
      size: new RegExp(`^${escapeRx(filters.width)}(?:/)?(?:${escapeRx(filters.series)})?[^0-9]*${escapeRx(filters.rim)}`, 'i'),
    });
  } else if (filters.rim && Number(filters.rim)) {
    base.push({ rimSize: Number(filters.rim) });
  }

  const sizeClause = filters.size ? [{ size: filters.size }] : [];
  const brandClause = filters.brand ? [{ brand: new RegExp(`^${escapeRx(filters.brand)}$`, 'i') }] : [];

  const listQuery = { $and: [...base, ...sizeClause, ...brandClause] };

  const sort: Record<string, 1 | -1> =
    filters.sort === 'priceAsc'  ? { priceCash: 1, _id: 1 } :
    filters.sort === 'priceDesc' ? { priceCash: -1, _id: 1 } :
    filters.sort === 'size'      ? { size: 1, _id: 1 } :
                                   { brand: 1, model: 1, _id: 1 };

  // นับก่อน เพื่อหนีบเลขหน้าไม่ให้เกินหน้าสุดท้าย
  const [total, sizes, brands] = await Promise.all([
    Product.countDocuments(listQuery),
    Product.distinct('size', { $and: base }),
    Product.distinct('brand', { $and: [...base, ...sizeClause] }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / TIRE_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.floor(filters.page ?? 1)), totalPages);

  let find = Product.find(listQuery)
    .select(PUBLIC_LIST_FIELDS)
    .sort(sort)
    .skip((page - 1) * TIRE_PAGE_SIZE)
    .limit(TIRE_PAGE_SIZE);
  // เรียงขนาดแบบตัวเลข (205 < 1000) ไม่ใช่ตัวอักษร
  if (filters.sort === 'size') find = find.collation({ locale: 'en', numericOrdering: true });

  const docs = await find.lean();

  const clean = (arr: unknown[]) =>
    arr.filter((v): v is string => typeof v === 'string' && v.trim() !== '');

  return {
    products: docs.map((d) => normalize(d as Record<string, unknown>)),
    total,
    page,
    totalPages,
    pageSize: TIRE_PAGE_SIZE,
    sizes: clean(sizes).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    brands: clean(brands).sort(),
  };
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

export type ProductPickerRow = Pick<ProductRow, 'id' | 'brand' | 'model' | 'size' | 'costPrice' | 'priceCash' | 'stock' | 'year'>;

/**
 * ค้นหาสินค้าสำหรับ picker แบบแบ่งหน้า — ดึงเฉพาะฟิลด์ที่ต้องใช้
 * (ห้ามโหลดสินค้าทั้งหมดไปฝั่ง client: ~6k รายการ = หลาย MB และช้ามากบน Atlas)
 * ค้นได้หลายคำ แต่ละคำต้องเจอใน ยี่ห้อ/รุ่น/ขนาด เช่น "michelin 205/55"
 */
export async function searchProductsForPicker(search = '', page = 1, pageSize = 20): Promise<ProductPickerRow[]> {
  await connectDB();
  const tokens = search.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  const query = tokens.length
    ? {
        $and: tokens.map((token) => {
          const rx = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          return { $or: [{ brand: rx }, { model: rx }, { size: rx }] };
        }),
      }
    : {};
  const size = Math.max(1, Math.min(pageSize, 50));
  const docs = await Product.find(query)
    .select('brand model size costPrice priceCash stock year')
    .sort({ brand: 1, model: 1, size: 1, _id: 1 })
    .skip((Math.max(1, page) - 1) * size)
    .limit(size)
    .lean();
  return docs.map((d) => ({
    id: String(d._id),
    brand: d.brand ?? '',
    model: d.model ?? '',
    size: d.size ?? '',
    costPrice: d.costPrice ?? 0,
    priceCash: d.priceCash ?? 0,
    stock: d.stock ?? 0,
    year: d.year,
  }));
}
