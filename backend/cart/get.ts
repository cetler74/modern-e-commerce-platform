import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

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

export interface GetCartResponse {
  items: CartItem[];
  subtotal: number;
}

export const get = api<void, GetCartResponse>(
  { auth: true, expose: true, method: "GET", path: "/cart" },
  async () => {
    const authData = getAuthData()!;
    const userId = parseInt(authData.userID);

    const items = await db.queryAll<{
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
      WHERE ci.user_id = ${userId}
      ORDER BY ci.created_at DESC
    `;

    let subtotal = 0;
    const cartItems: CartItem[] = items.map(item => {
      const total = item.price * item.quantity;
      subtotal += total;

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
    });

    return {
      items: cartItems,
      subtotal
    };
  }
);
