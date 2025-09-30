import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface CreateProductRequest {
  name: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  price: number;
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

export interface CreateProductResponse {
  id: string;
  slug: string;
}

// Create a new product
export const create = api<CreateProductRequest, CreateProductResponse>(
  { auth: true, expose: true, method: "POST", path: "/products" },
  async (req) => {
    const authData = getAuthData()!;
    
    if (!authData.permissions.includes('products.create')) {
      throw new Error("Insufficient permissions");
    }

    // Generate slug from name
    const slug = req.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug exists
    const existingProduct = await db.queryRow`
      SELECT id FROM products WHERE slug = ${slug}
    `;

    if (existingProduct) {
      throw new Error("Product with this name already exists");
    }

    const product = await db.queryRow<{ id: number }>`
      INSERT INTO products (
        name, slug, description, short_description, sku, price, compare_price, 
        cost_price, weight, dimensions, images, status, seo_title, seo_description, tags
      )
      VALUES (
        ${req.name}, ${slug}, ${req.description || null}, ${req.shortDescription || null},
        ${req.sku || null}, ${req.price}, ${req.comparePrice || null}, ${req.costPrice || null},
        ${req.weight || null}, ${JSON.stringify(req.dimensions || {})}, 
        ${JSON.stringify(req.images || [])}, ${req.status || 'draft'},
        ${req.seoTitle || null}, ${req.seoDescription || null}, ${req.tags || []}
      )
      RETURNING id
    `;

    if (!product) {
      throw new Error("Failed to create product");
    }

    // Add categories if provided
    if (req.categoryIds && req.categoryIds.length > 0) {
      for (const categoryId of req.categoryIds) {
        await db.exec`
          INSERT INTO product_categories (product_id, category_id)
          VALUES (${product.id}, ${parseInt(categoryId)})
        `;
      }
    }

    return {
      id: product.id.toString(),
      slug
    };
  }
);
