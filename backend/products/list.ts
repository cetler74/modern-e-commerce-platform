import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import db from "../db";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  status: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListProductsParams {
  category?: Query<string>;
  status?: Query<string>;
  search?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListProductsResponse {
  products: Product[];
  total: number;
}

// List products with filtering
export const list = api<ListProductsParams, ListProductsResponse>(
  { expose: true, method: "GET", path: "/products" },
  async (params) => {
    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (params.status) {
      whereClause += ` AND p.status = $${paramIndex}`;
      queryParams.push(params.status);
      paramIndex++;
    } else {
      // Default to active products for public API
      whereClause += ` AND p.status = $${paramIndex}`;
      queryParams.push('active');
      paramIndex++;
    }

    if (params.search) {
      whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      queryParams.push(`%${params.search}%`);
      paramIndex++;
    }

    if (params.category) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM product_categories pc 
        JOIN categories c ON pc.category_id = c.id 
        WHERE pc.product_id = p.id AND c.slug = $${paramIndex}
      )`;
      queryParams.push(params.category);
      paramIndex++;
    }

    const limit = params.limit || 20;
    const offset = params.offset || 0;

    // Get total count
    const countResult = await db.rawQueryRow<{ count: number }>(
      `SELECT COUNT(*) as count FROM products p ${whereClause}`,
      ...queryParams
    );

    // Get products
    const products = await db.rawQueryAll<{
      id: number;
      name: string;
      slug: string;
      description: string | null;
      short_description: string | null;
      sku: string | null;
      price: number;
      compare_price: number | null;
      images: any;
      status: string;
      tags: string[];
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT p.id, p.name, p.slug, p.description, p.short_description, p.sku, 
              p.price, p.compare_price, p.images, p.status, p.tags, 
              p.created_at, p.updated_at
       FROM products p 
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      ...queryParams, limit, offset
    );

    return {
      products: products.map(p => ({
        id: p.id.toString(),
        name: p.name,
        slug: p.slug,
        description: p.description || undefined,
        shortDescription: p.short_description || undefined,
        sku: p.sku || undefined,
        price: p.price,
        comparePrice: p.compare_price || undefined,
        images: Array.isArray(p.images) ? p.images : [],
        status: p.status,
        tags: p.tags || [],
        createdAt: p.created_at,
        updatedAt: p.updated_at
      })),
      total: countResult?.count || 0
    };
  }
);
