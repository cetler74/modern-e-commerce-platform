import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface ProductDetails {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  weight?: number;
  dimensions?: any;
  images: string[];
  status: string;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  variants: ProductVariant[];
  categories: ProductCategory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  comparePrice?: number;
  barcode?: string;
  weight?: number;
  imageUrl?: string;
  options: any;
  position: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

// Get product by ID or slug
export const get = api<{ identifier: string }, ProductDetails>(
  { expose: true, method: "GET", path: "/products/:identifier" },
  async ({ identifier }) => {
    // Determine if identifier is numeric (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier);
    const whereClause = isNumeric ? "id = $1" : "slug = $1";

    const product = await db.rawQueryRow<{
      id: number;
      name: string;
      slug: string;
      description: string | null;
      short_description: string | null;
      sku: string | null;
      price: number;
      compare_price: number | null;
      cost_price: number | null;
      weight: number | null;
      dimensions: any;
      images: any;
      status: string;
      seo_title: string | null;
      seo_description: string | null;
      tags: string[];
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT * FROM products WHERE ${whereClause}`,
      identifier
    );

    if (!product) {
      throw APIError.notFound("product not found");
    }

    // Get variants
    const variants = await db.queryAll<{
      id: number;
      name: string;
      sku: string | null;
      price: number | null;
      compare_price: number | null;
      barcode: string | null;
      weight: number | null;
      image_url: string | null;
      options: any;
      position: number;
    }>`
      SELECT id, name, sku, price, compare_price, barcode, weight, 
             image_url, options, position
      FROM product_variants
      WHERE product_id = ${product.id}
      ORDER BY position
    `;

    // Get categories
    const categories = await db.queryAll<{
      id: number;
      name: string;
      slug: string;
    }>`
      SELECT c.id, c.name, c.slug
      FROM categories c
      JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ${product.id}
    `;

    return {
      id: product.id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description || undefined,
      shortDescription: product.short_description || undefined,
      sku: product.sku || undefined,
      price: product.price,
      comparePrice: product.compare_price || undefined,
      costPrice: product.cost_price || undefined,
      weight: product.weight || undefined,
      dimensions: product.dimensions,
      images: Array.isArray(product.images) ? product.images : [],
      status: product.status,
      seoTitle: product.seo_title || undefined,
      seoDescription: product.seo_description || undefined,
      tags: product.tags || [],
      variants: variants.map(v => ({
        id: v.id.toString(),
        name: v.name,
        sku: v.sku || undefined,
        price: v.price || undefined,
        comparePrice: v.compare_price || undefined,
        barcode: v.barcode || undefined,
        weight: v.weight || undefined,
        imageUrl: v.image_url || undefined,
        options: v.options || {},
        position: v.position
      })),
      categories: categories.map(c => ({
        id: c.id.toString(),
        name: c.name,
        slug: c.slug
      })),
      createdAt: product.created_at,
      updatedAt: product.updated_at
    };
  }
);
