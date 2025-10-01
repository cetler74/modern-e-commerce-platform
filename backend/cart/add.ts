import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  price: number;
  quantity: number;
  image?: string;
}

export const add = api<AddToCartRequest, CartItem>(
  { auth: true, expose: true, method: "POST", path: "/cart/items" },
  async (req) => {
    const authData = getAuthData()!;
    const userId = parseInt(authData.userID);

    const productId = parseInt(req.productId);
    const variantId = req.variantId ? parseInt(req.variantId) : null;

    let productName = "";
    let variantName: string | null = null;
    let price = 0;
    let image: string | null = null;

    if (variantId) {
      const variant = await db.queryRow<{
        product_name: string;
        variant_name: string;
        price: number;
        image_url: string | null;
      }>`
        SELECT p.name as product_name, pv.name as variant_name, 
               COALESCE(pv.price, p.price) as price, 
               COALESCE(pv.image_url, (p.images->0)::text) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = ${variantId} AND p.id = ${productId}
      `;

      if (!variant) {
        throw new Error("Product variant not found");
      }

      productName = variant.product_name;
      variantName = variant.variant_name;
      price = variant.price;
      image = variant.image_url;
    } else {
      const product = await db.queryRow<{
        name: string;
        price: number;
        images: any;
      }>`
        SELECT name, price, images
        FROM products
        WHERE id = ${productId}
      `;

      if (!product) {
        throw new Error("Product not found");
      }

      productName = product.name;
      price = product.price;
      if (Array.isArray(product.images) && product.images.length > 0) {
        image = product.images[0];
      }
    }

    const existing = await db.queryRow<{ id: number; quantity: number }>`
      SELECT id, quantity
      FROM cart_items
      WHERE user_id = ${userId} 
        AND product_id = ${productId}
        AND (product_variant_id = ${variantId} OR (product_variant_id IS NULL AND ${variantId} IS NULL))
    `;

    let cartItemId: number;

    if (existing) {
      await db.exec`
        UPDATE cart_items
        SET quantity = ${existing.quantity + req.quantity}, updated_at = NOW()
        WHERE id = ${existing.id}
      `;
      cartItemId = existing.id;
    } else {
      const result = await db.queryRow<{ id: number }>`
        INSERT INTO cart_items (user_id, product_id, product_variant_id, quantity, price)
        VALUES (${userId}, ${productId}, ${variantId}, ${req.quantity}, ${price})
        RETURNING id
      `;
      cartItemId = result!.id;
    }

    return {
      id: cartItemId.toString(),
      productId: req.productId,
      variantId: req.variantId,
      productName,
      variantName: variantName || undefined,
      price,
      quantity: existing ? existing.quantity + req.quantity : req.quantity,
      image: image || undefined
    };
  }
);
