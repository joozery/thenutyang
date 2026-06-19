import Link from 'next/link';
import { getArticles, formatThaiDate } from '@/lib/articles';
import { CalendarDays, Tag } from 'lucide-react';

export const metadata = { title: 'บทความ & ข่าวสาร | THENUTTIRE' };

const CATEGORIES = ['ทั้งหมด', 'เกร็ดความรู้', 'ความรู้เรื่องยาง', 'โปรโมชั่น', 'ข่าวสาร'];

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const all = await getArticles();
  const articles = category && category !== 'ทั้งหมด'
    ? all.filter(a => a.category === category)
    : all;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-green-700 text-white py-14 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-black mb-3">บทความ & ข่าวสาร</h1>
          <p className="text-green-100 text-sm md:text-base">ความรู้เรื่องยาง โปรโมชั่น และอัปเดตจาก THENUTTIRE</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              href={cat === 'ทั้งหมด' ? '/news' : `/news?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                (cat === 'ทั้งหมด' && !category) || category === cat
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-green-600 hover:text-green-600'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20 text-slate-400">ยังไม่มีบทความในหมวดนี้</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <Link
                key={article.slug}
                href={`/news/${article.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative h-52 bg-slate-200 overflow-hidden">
                  {article.coverImage ? (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-green-50">
                      <span className="text-green-300 text-4xl font-black">NUT</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                    {article.category}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-bold text-slate-800 leading-snug mb-2 group-hover:text-green-600 transition-colors flex-1">
                    {article.title}
                  </h2>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4">{article.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-auto">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {formatThaiDate(article.publishedAt as unknown as string)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {article.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
