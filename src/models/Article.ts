import { Schema, model, models } from 'mongoose';

export interface IArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  published: boolean;
  publishedAt: Date;
  createdAt: Date;
}

const ArticleSchema = new Schema<IArticle>({
  title:       { type: String, required: true },
  slug:        { type: String, required: true, unique: true },
  excerpt:     { type: String, required: true },
  content:     { type: String, required: true },
  coverImage:  { type: String, default: '' },
  category:    { type: String, required: true },
  published:   { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
  createdAt:   { type: Date, default: Date.now },
});

export const Article = models.Article ?? model<IArticle>('Article', ArticleSchema);
