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
      // Match "205/55R16", "265/60-18", "195R14C", "205/45ZR17", etc.
      const m = (p.size as string).match(/^(\d+)(?:\/(\d+))?\s*(?:Z?R|C|-)?\s*(\d+)/i);
      if (!m) continue;
      const width = m[1];
      const series = m[2] || '80'; // Default series is 80 if omitted (e.g. 195R14)
      const rim = m[3];
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

    return NextResponse.json({ widths, series, rims });
  } catch (err) {
    console.error('[tire-sizes]', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
