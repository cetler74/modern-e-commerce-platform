import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface CheckoutRequest {
  billingAddress: Address;
  shippingAddress: Address;
  paymentMethod: string;
  notes?: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip: string;
  phone?: string;
}

export interface CheckoutResponse {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
}

export const process = api<CheckoutRequest, CheckoutResponse>(
  { auth: true, expose: true, method: "POST", path: "/checkout" },
  async (req) => {
    const authData = getAuthData()!;
    const userId = parseInt(authData.userID);

    const customer = await db.queryRow<{ id: number; email: string }>`
      SELECT c.id, u.email
      FROM customers c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ${userId}
    `;

    if (!customer) {
      throw new Error("Customer not found");
    }

    const cartItems = await db.queryAll<{
      id: number;
      product_id: number;
      product_variant_id: number | null;
      product_name: string;
      variant_name: string | null;
      sku: string | null;
      price: number;
      quantity: number;
    }>`
      SELECT ci.id, ci.product_id, ci.product_variant_id, 
             p.name as product_name, pv.name as variant_name,
             COALESCE(pv.sku, p.sku) as sku,
             ci.price, ci.quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
      WHERE ci.user_id = ${userId}
    `;

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += item.price * item.quantity;
    }

    const taxRate = 0.1;
    const shippingRate = 10;

    const taxAmount = subtotal * taxRate;
    const shippingAmount = shippingRate;
    const totalAmount = subtotal + taxAmount + shippingAmount;

    const orderNumber = `ORD-${Date.now()}`;

    const order = await db.queryRow<{ id: number }>`
      INSERT INTO orders (
        order_number, customer_id, email, status, financial_status,
        subtotal, tax_amount, shipping_amount, total_amount, currency,
        billing_address, shipping_address, notes, processed_at
      )
      VALUES (
        ${orderNumber}, ${customer.id}, ${customer.email}, 'confirmed', 'paid',
        ${subtotal}, ${taxAmount}, ${shippingAmount}, ${totalAmount}, 'USD',
        ${JSON.stringify(req.billingAddress)}, ${JSON.stringify(req.shippingAddress)},
        ${req.notes || null}, NOW()
      )
      RETURNING id
    `;

    if (!order) {
      throw new Error("Failed to create order");
    }

    for (const item of cartItems) {
      await db.exec`
        INSERT INTO order_line_items (
          order_id, product_variant_id, title, variant_title, sku, quantity, price
        )
        VALUES (
          ${order.id}, ${item.product_variant_id}, ${item.product_name},
          ${item.variant_name}, ${item.sku}, ${item.quantity}, ${item.price}
        )
      `;
    }

    await db.exec`
      DELETE FROM cart_items
      WHERE user_id = ${userId}
    `;

    await db.exec`
      UPDATE customers
      SET total_spent = total_spent + ${totalAmount},
          orders_count = orders_count + 1,
          last_order_at = NOW(),
          updated_at = NOW()
      WHERE id = ${customer.id}
    `;

    return {
      orderId: order.id.toString(),
      orderNumber,
      totalAmount,
      status: "confirmed"
    };
  }
);
