import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Query } from "encore.dev/api";
import db from "../db";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  authorName: string;
  status: string;
  publishedAt?: Date;
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListBlogPostsParams {
  status?: Query<string>;
  tag?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListBlogPostsResponse {
  posts: BlogPost[];
  total: number;
}

// List blog posts
export const listBlogPosts = api<ListBlogPostsParams, ListBlogPostsResponse>(
  { expose: true, method: "GET", path: "/blog" },
  async (params) => {
    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (params.status) {
      whereClause += ` AND bp.status = $${paramIndex}`;
      queryParams.push(params.status);
      paramIndex++;
    } else {
      // Default to published posts for public API
      whereClause += ` AND bp.status = 'published'`;
    }

    if (params.tag) {
      whereClause += ` AND $${paramIndex} = ANY(bp.tags)`;
      queryParams.push(params.tag);
      paramIndex++;
    }

    const limit = params.limit || 10;
    const offset = params.offset || 0;

    // Get total count
    const countResult = await db.rawQueryRow<{ count: number }>(
      `SELECT COUNT(*) as count FROM blog_posts bp ${whereClause}`,
      ...queryParams
    );

    // Get blog posts
    const posts = await db.rawQueryAll<{
      id: number;
      title: string;
      slug: string;
      content: string | null;
      excerpt: string | null;
      featured_image: string | null;
      author_name: string;
      status: string;
      published_at: Date | null;
      tags: string[];
      view_count: number;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT bp.id, bp.title, bp.slug, bp.content, bp.excerpt, bp.featured_image,
              CONCAT(u.first_name, ' ', u.last_name) as author_name,
              bp.status, bp.published_at, bp.tags, bp.view_count,
              bp.created_at, bp.updated_at
       FROM blog_posts bp
       JOIN users u ON bp.author_id = u.id
       ${whereClause}
       ORDER BY bp.published_at DESC, bp.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      ...queryParams, limit, offset
    );

    return {
      posts: posts.map(p => ({
        id: p.id.toString(),
        title: p.title,
        slug: p.slug,
        content: p.content || undefined,
        excerpt: p.excerpt || undefined,
        featuredImage: p.featured_image || undefined,
        authorName: p.author_name,
        status: p.status,
        publishedAt: p.published_at || undefined,
        tags: p.tags || [],
        viewCount: p.view_count,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      })),
      total: countResult?.count || 0
    };
  }
);

export interface CreateBlogPostRequest {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface CreateBlogPostResponse {
  id: string;
  slug: string;
}

// Create blog post
export const createBlogPost = api<CreateBlogPostRequest, CreateBlogPostResponse>(
  { auth: true, expose: true, method: "POST", path: "/blog" },
  async (req) => {
    const authData = getAuthData()!;
    
    if (!authData.permissions.includes('blog.create')) {
      throw new Error("Insufficient permissions");
    }

    // Generate slug from title
    const slug = req.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug exists
    const existingPost = await db.queryRow`
      SELECT id FROM blog_posts WHERE slug = ${slug}
    `;

    if (existingPost) {
      throw new Error("Blog post with this title already exists");
    }

    const publishedAt = req.status === 'published' ? new Date() : null;

    const post = await db.queryRow<{ id: number }>`
      INSERT INTO blog_posts (
        title, slug, content, excerpt, featured_image, author_id, status,
        published_at, tags, seo_title, seo_description
      )
      VALUES (
        ${req.title}, ${slug}, ${req.content}, ${req.excerpt || null},
        ${req.featuredImage || null}, ${authData.userID}, ${req.status || 'draft'},
        ${publishedAt}, ${req.tags || []}, ${req.seoTitle || null}, ${req.seoDescription || null}
      )
      RETURNING id
    `;

    if (!post) {
      throw new Error("Failed to create blog post");
    }

    return {
      id: post.id.toString(),
      slug
    };
  }
);
