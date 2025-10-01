import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface DeleteBlogPostRequest {
  id: string;
}

export const deleteBlogPost = api<DeleteBlogPostRequest, void>(
  { auth: true, expose: true, method: "DELETE", path: "/blog/:id" },
  async (req) => {
    const authData = getAuthData()!;
    
    if (!authData.permissions.includes('blog.delete')) {
      throw new Error("Insufficient permissions");
    }

    const postId = parseInt(req.id);

    await db.exec`DELETE FROM blog_posts WHERE id = ${postId}`;
  }
);
