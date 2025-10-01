import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface UpdateProductRequest {
  id: string;
  name?: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  price?: number;
  comparePrice?: number;
  costPrice?: number;
  weight?: number;
  dimensions?: any;
  images?: string[];
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  categoryIds?: string[];
}

export interface UpdateProductResponse {
  id: string;
  slug: string;
}

export const update = api<UpdateProductRequest, UpdateProductResponse>(
  { auth: true, expose: true, method: "PATCH", path: "/products/:id" },
  async (req) => {
    const authData = getAuthData()!;
    
    if (!authData.permissions.includes('products.update')) {
      throw new Error("Insufficient permissions");
    }

    const productId = parseInt(req.id);

    const product = await db.queryRow<{ slug: string }>`
      SELECT slug FROM products WHERE id = ${productId}
    `;

    if (!product) {
      throw new Error("Product not found");
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.name !== undefined) {
      const newSlug = req.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      updates.push(`name = $${paramIndex++}`, `slug = $${paramIndex++}`);
      values.push(req.name, newSlug);
    }

    if (req.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(req.description);
    }

    if (req.shortDescription !== undefined) {
      updates.push(`short_description = $${paramIndex++}`);
      values.push(req.shortDescription);
    }

    if (req.sku !== undefined) {
      updates.push(`sku = $${paramIndex++}`);
      values.push(req.sku);
    }

    if (req.price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(req.price);
    }

    if (req.comparePrice !== undefined) {
      updates.push(`compare_price = $${paramIndex++}`);
      values.push(req.comparePrice);
    }

    if (req.costPrice !== undefined) {
      updates.push(`cost_price = $${paramIndex++}`);
      values.push(req.costPrice);
    }

    if (req.weight !== undefined) {
      updates.push(`weight = $${paramIndex++}`);
      values.push(req.weight);
    }

    if (req.dimensions !== undefined) {
      updates.push(`dimensions = $${paramIndex++}`);
      values.push(JSON.stringify(req.dimensions));
    }

    if (req.images !== undefined) {
      updates.push(`images = $${paramIndex++}`);
      values.push(JSON.stringify(req.images));
    }

    if (req.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(req.status);
    }

    if (req.seoTitle !== undefined) {
      updates.push(`seo_title = $${paramIndex++}`);
      values.push(req.seoTitle);
    }

    if (req.seoDescription !== undefined) {
      updates.push(`seo_description = $${paramIndex++}`);
      values.push(req.seoDescription);
    }

    if (req.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(req.tags);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length > 1) {
      await db.rawExec(
        `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        ...values,
        productId
      );
    }

    if (req.categoryIds !== undefined) {
      await db.exec`DELETE FROM product_categories WHERE product_id = ${productId}`;
      
      for (const categoryId of req.categoryIds) {
        await db.exec`
          INSERT INTO product_categories (product_id, category_id)
          VALUES (${productId}, ${parseInt(categoryId)})
        `;
      }
    }

    const updatedProduct = await db.queryRow<{ slug: string }>`
      SELECT slug FROM products WHERE id = ${productId}
    `;

    return {
      id: req.id,
      slug: updatedProduct?.slug || product.slug
    };
  }
);
