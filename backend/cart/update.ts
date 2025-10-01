import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface UpdateCartItemRequest {
  id: string;
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

export const update = api<UpdateCartItemRequest, CartItem>(
  { auth: true, expose: true, method: "PATCH", path: "/cart/items/:id" },
  async (req) => {
    const authData = getAuthData()!;
    const userId = parseInt(authData.userID);
    const itemId = parseInt(req.id);

    if (req.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    await db.exec`
      UPDATE cart_items
      SET quantity = ${req.quantity}, updated_at = NOW()
      WHERE id = ${itemId} AND user_id = ${userId}
    `;

    const item = await db.queryRow<{
      id: number;
      product_id: number;
      product_variant_id: number | null;
      product_name: string;
      variant_name: string | null;
      price: number;
      quantity: number;
      image_url: string | null;
    }>`
      SELECT ci.id, ci.product_id, ci.product_variant_id, 
             p.name as product_name, pv.name as variant_name,
             ci.price, ci.quantity,
             COALESCE(pv.image_url, (p.images->0)::text) as image_url
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
      WHERE ci.id = ${itemId}
    `;

    if (!item) {
      throw new Error("Cart item not found");
    }

    return {
      id: item.id.toString(),
      productId: item.product_id.toString(),
      variantId: item.product_variant_id?.toString(),
      productName: item.product_name,
      variantName: item.variant_name || undefined,
      price: item.price,
      quantity: item.quantity,
      image: item.image_url || undefined
    };
  }
);
