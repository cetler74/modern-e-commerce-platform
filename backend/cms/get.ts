import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  authorName: string;
  authorId: string;
  status: string;
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const getBlogPost = api<{ identifier: string }, BlogPost>(
  { expose: true, method: "GET", path: "/blog/:identifier" },
  async ({ identifier }) => {
    const isNumeric = /^\d+$/.test(identifier);
    const whereClause = isNumeric ? "id = $1" : "slug = $1";

    const post = await db.rawQueryRow<{
      id: number;
      title: string;
      slug: string;
      content: string;
      excerpt: string | null;
      featured_image: string | null;
      author_id: number;
      author_name: string;
      status: string;
      published_at: Date | null;
      seo_title: string | null;
      seo_description: string | null;
      tags: string[];
      view_count: number;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT bp.*, CONCAT(u.first_name, ' ', u.last_name) as author_name
       FROM blog_posts bp
       JOIN users u ON bp.author_id = u.id
       WHERE ${whereClause}`,
      identifier
    );

    if (!post) {
      throw APIError.notFound("blog post not found");
    }

    await db.rawExec(
      `UPDATE blog_posts SET view_count = view_count + 1 WHERE id = $1`,
      post.id
    );

    return {
      id: post.id.toString(),
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || undefined,
      featuredImage: post.featured_image || undefined,
      authorId: post.author_id.toString(),
      authorName: post.author_name,
      status: post.status,
      publishedAt: post.published_at || undefined,
      seoTitle: post.seo_title || undefined,
      seoDescription: post.seo_description || undefined,
      tags: post.tags || [],
      viewCount: post.view_count + 1,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    };
  }
);
