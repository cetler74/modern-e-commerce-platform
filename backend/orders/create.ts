import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface CreateOrderRequest {
  items: OrderItem[];
  billingAddress: Address;
  shippingAddress: Address;
  notes?: string;
}

export interface OrderItem {
  productVariantId: string;
  quantity: number;
  price: number;
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

export interface CreateOrderResponse {
  id: string;
  orderNumber: string;
  totalAmount: number;
}

// Create a new order
export const create = api<CreateOrderRequest, CreateOrderResponse>(
  { auth: true, expose: true, method: "POST", path: "/orders" },
  async (req) => {
    const authData = getAuthData()!;
    
    // Get customer
    const customer = await db.queryRow<{ id: number; email: string }>`
      SELECT c.id, u.email
      FROM customers c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ${authData.userID}
    `;

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of req.items) {
      subtotal += item.price * item.quantity;
    }

    const taxAmount = subtotal * 0.1; // 10% tax rate
    const shippingAmount = 10; // Flat shipping rate
    const totalAmount = subtotal + taxAmount + shippingAmount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create order
    const order = await db.queryRow<{ id: number }>`
      INSERT INTO orders (
        order_number, customer_id, email, status, financial_status,
        subtotal, tax_amount, shipping_amount, total_amount, currency,
        billing_address, shipping_address, notes
      )
      VALUES (
        ${orderNumber}, ${customer.id}, ${customer.email}, 'pending', 'pending',
        ${subtotal}, ${taxAmount}, ${shippingAmount}, ${totalAmount}, 'USD',
        ${JSON.stringify(req.billingAddress)}, ${JSON.stringify(req.shippingAddress)},
        ${req.notes || null}
      )
      RETURNING id
    `;

    if (!order) {
      throw new Error("Failed to create order");
    }

    // Create order line items
    for (const item of req.items) {
      // Get product variant details
      const variant = await db.queryRow<{
        title: string;
        variant_title: string;
        sku: string | null;
      }>`
        SELECT 
          p.name as title,
          pv.name as variant_title,
          pv.sku
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = ${parseInt(item.productVariantId)}
      `;

      if (variant) {
        await db.exec`
          INSERT INTO order_line_items (
            order_id, product_variant_id, title, variant_title, sku, quantity, price
          )
          VALUES (
            ${order.id}, ${parseInt(item.productVariantId)}, ${variant.title},
            ${variant.variant_title}, ${variant.sku}, ${item.quantity}, ${item.price}
          )
        `;
      }
    }

    return {
      id: order.id.toString(),
      orderNumber,
      totalAmount
    };
  }
);
