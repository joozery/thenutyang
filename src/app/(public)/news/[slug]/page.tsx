import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticleBySlug, getRelatedArticles, formatThaiDate } from '@/lib/articles';
import { ArrowLeft, CalendarDays, Tag, Share2 } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | THENUTTIRE`,
    description: article.excerpt,
    openGraph: { images: article.coverImage ? [article.coverImage] : [] },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(slug, article.category);

  return (
    <div className="min-h-screen bg-white">
      {/* Cover image */}
      {article.coverImage && (
        <div className="w-full h-64 md:h-96 bg-slate-200 overflow-hidden">
          <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="container mx-auto px-4 md:px-8 py-10 max-w-3xl">
        {/* Back */}
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าบทความ
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {article.category}
          </span>
          <span className="text-slate-400 text-xs flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {formatThaiDate(article.publishedAt as unknown as string)}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-snug mb-4">
          {article.title}
        </h1>

        {/* Excerpt */}
        <p className="text-slate-500 text-base border-l-4 border-green-500 pl-4 mb-8 leading-relaxed">
          {article.excerpt}
        </p>

        {/* Content */}
        <div
          className="prose prose-slate prose-headings:font-black prose-a:text-green-600 max-w-none text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Share */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center gap-3">
          <span className="text-slate-500 text-sm font-medium flex items-center gap-2">
            <Share2 className="w-4 h-4" /> แชร์บทความนี้:
          </span>
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/news/${article.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#06C755] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#05b34a] transition-colors"
          >
            LINE
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/news/${article.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1877F2] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#1565d6] transition-colors"
          >
            Facebook
          </a>
        </div>
      </div>

      {/* Related articles */}
      {related.length > 0 && (
        <div className="bg-slate-50 py-12 border-t border-slate-100">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-xl font-black text-slate-800 mb-6">บทความที่เกี่ยวข้อง</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {related.map(r => (
                <Link
                  key={r.slug}
                  href={`/news/${r.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="h-40 bg-slate-200 overflow-hidden">
                    {r.coverImage ? (
                      <img src={r.coverImage} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-50">
                        <span className="text-green-300 text-2xl font-black">NUT</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1">
                    <p className="text-[10px] text-green-600 font-bold mb-1">{r.category}</p>
                    <h3 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-green-600 transition-colors line-clamp-2">
                      {r.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
