import connectDB from './mongodb';
import { Article, IArticle } from '@/models/Article';

export type ArticleSummary = Pick<IArticle, 'title' | 'slug' | 'excerpt' | 'coverImage' | 'category' | 'publishedAt'>;

export async function getArticles(limit?: number): Promise<ArticleSummary[]> {
  await connectDB();
  const q = Article.find({ published: true })
    .sort({ publishedAt: -1 })
    .select('title slug excerpt coverImage category publishedAt');
  if (limit) q.limit(limit);
  const docs = await q.lean();
  return docs.map(normalizeArticle) as unknown as ArticleSummary[];
}

export async function getArticleBySlug(slug: string): Promise<IArticle | null> {
  await connectDB();
  const doc = await Article.findOne({ slug, published: true }).lean();
  if (!doc) return null;
  return normalizeArticle(doc) as unknown as IArticle;
}

export async function getRelatedArticles(slug: string, category: string, limit = 3): Promise<ArticleSummary[]> {
  await connectDB();
  const docs = await Article.find({ published: true, category, slug: { $ne: slug } })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select('title slug excerpt coverImage category publishedAt')
    .lean();
  return docs.map(normalizeArticle) as unknown as ArticleSummary[];
}

function normalizeArticle(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = doc as Record<string, unknown>;
  void _id; void __v;
  if (rest.publishedAt instanceof Date) rest.publishedAt = rest.publishedAt.toISOString();
  if (rest.createdAt instanceof Date) rest.createdAt = (rest.createdAt as Date).toISOString();
  return rest;
}

export function formatThaiDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}
