import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product } from '@/models/Product';

export const dynamic = 'force-dynamic';

// GET /api/tire-sizes  →  { widths, seriesMap, rimMap }
export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({ published: true }, { size: 1 }).lean();

    const widthSet = new Set<string>();
    // seriesMap[width] = Set of series
    const seriesMap: Record<string, Set<string>> = {};
    // rimMap[width+series] = Set of rims
    const rimMap: Record<string, Set<string>> = {};

    for (const p of products) {
      const str = (p.size as string).trim();
      let width, series, rim;
      
      // Match standard: 205/55R16, 265/60-18, 195R14C, 205/45ZR17
      let m = str.match(/^(\d{3})(?:\/(\d{2,3}))?\s*(?:Z?R|C|-)?\s*(\d{2})(?:C)?/i);
      if (m) {
        width = m[1];
        series = m[2] || '80'; // Default series is 80 if omitted
        rim = m[3];
      } else {
        // Match off-road: 31x10.5R15
        m = str.match(/^(\d{2})[xX](\d{1,2}(?:\.\d{1,2})?)\s*(?:R|-)?\s*(\d{2})/i);
        if (m) {
          width = m[1];
          series = m[2]; // e.g. 10.5
          rim = m[3];
        }
      }
      
      if (!width || !series || !rim) continue;
      
      widthSet.add(width);
      if (!seriesMap[width]) seriesMap[width] = new Set();
      seriesMap[width].add(series);
      const key = `${width}_${series}`;
      if (!rimMap[key]) rimMap[key] = new Set();
      rimMap[key].add(rim);
    }

    // Convert Sets to sorted arrays
    const widths = [...widthSet].sort((a, b) => Number(a) - Number(b));
    const series: Record<string, string[]> = {};
    for (const [w, s] of Object.entries(seriesMap)) {
      series[w] = [...s].sort((a, b) => Number(a) - Number(b));
    }
    const rims: Record<string, string[]> = {};
    for (const [k, r] of Object.entries(rimMap)) {
      rims[k] = [...r].sort((a, b) => Number(a) - Number(b));
    }

    const brands = await Product.distinct('brand', { published: true });
    brands.sort();

    return NextResponse.json({ widths, series, rims, brands });
  } catch (err) {
    console.error('[tire-sizes]', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
