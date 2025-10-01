import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface UpdateBlogPostRequest {
  id: string;
  title?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  status?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateBlogPostResponse {
  id: string;
  slug: string;
}

export const updateBlogPost = api<UpdateBlogPostRequest, UpdateBlogPostResponse>(
  { auth: true, expose: true, method: "PATCH", path: "/blog/:id" },
  async (req) => {
    const authData = getAuthData()!;
    
    if (!authData.permissions.includes('blog.update')) {
      throw new Error("Insufficient permissions");
    }

    const postId = parseInt(req.id);

    const post = await db.queryRow<{ slug: string; status: string }>`
      SELECT slug, status FROM blog_posts WHERE id = ${postId}
    `;

    if (!post) {
      throw new Error("Blog post not found");
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.title !== undefined) {
      const newSlug = req.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      updates.push(`title = $${paramIndex++}`, `slug = $${paramIndex++}`);
      values.push(req.title, newSlug);
    }

    if (req.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(req.content);
    }

    if (req.excerpt !== undefined) {
      updates.push(`excerpt = $${paramIndex++}`);
      values.push(req.excerpt);
    }

    if (req.featuredImage !== undefined) {
      updates.push(`featured_image = $${paramIndex++}`);
      values.push(req.featuredImage);
    }

    if (req.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(req.status);
      
      if (req.status === 'published' && post.status !== 'published') {
        updates.push(`published_at = NOW()`);
      }
    }

    if (req.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(req.tags);
    }

    if (req.seoTitle !== undefined) {
      updates.push(`seo_title = $${paramIndex++}`);
      values.push(req.seoTitle);
    }

    if (req.seoDescription !== undefined) {
      updates.push(`seo_description = $${paramIndex++}`);
      values.push(req.seoDescription);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length > 1) {
      await db.rawExec(
        `UPDATE blog_posts SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        ...values,
        postId
      );
    }

    const updatedPost = await db.queryRow<{ slug: string }>`
      SELECT slug FROM blog_posts WHERE id = ${postId}
    `;

    return {
      id: req.id,
      slug: updatedPost?.slug || post.slug
    };
  }
);
