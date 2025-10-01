import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface OrderDetails {
  id: string;
  orderNumber: string;
  customerEmail: string;
  status: string;
  financialStatus: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  billingAddress: any;
  shippingAddress: any;
  notes?: string;
  items: OrderLineItem[];
  processedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderLineItem {
  id: string;
  title: string;
  variantTitle?: string;
  sku?: string;
  quantity: number;
  price: number;
  totalDiscount: number;
}

export const get = api<{ id: string }, OrderDetails>(
  { auth: true, expose: true, method: "GET", path: "/orders/:id" },
  async ({ id }) => {
    const authData = getAuthData()!;
    const orderId = parseInt(id);

    const order = await db.queryRow<{
      id: number;
      order_number: string;
      customer_id: number;
      email: string;
      status: string;
      financial_status: string;
      subtotal: number;
      tax_amount: number;
      shipping_amount: number;
      discount_amount: number;
      total_amount: number;
      currency: string;
      billing_address: any;
      shipping_address: any;
      notes: string | null;
      processed_at: Date | null;
      shipped_at: Date | null;
      delivered_at: Date | null;
      cancelled_at: Date | null;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT * FROM orders WHERE id = ${orderId}
    `;

    if (!order) {
      throw APIError.notFound("order not found");
    }

    if (!authData.permissions.includes('orders.read_all')) {
      const customer = await db.queryRow<{ id: number }>`
        SELECT id FROM customers WHERE user_id = ${authData.userID}
      `;

      if (!customer || customer.id !== order.customer_id) {
        throw APIError.permissionDenied("access denied");
      }
    }

    const items = await db.queryAll<{
      id: number;
      title: string;
      variant_title: string | null;
      sku: string | null;
      quantity: number;
      price: number;
      total_discount: number;
    }>`
      SELECT id, title, variant_title, sku, quantity, price, total_discount
      FROM order_line_items
      WHERE order_id = ${orderId}
    `;

    return {
      id: order.id.toString(),
      orderNumber: order.order_number,
      customerEmail: order.email,
      status: order.status,
      financialStatus: order.financial_status,
      subtotal: order.subtotal,
      taxAmount: order.tax_amount,
      shippingAmount: order.shipping_amount,
      discountAmount: order.discount_amount,
      totalAmount: order.total_amount,
      currency: order.currency,
      billingAddress: order.billing_address,
      shippingAddress: order.shipping_address,
      notes: order.notes || undefined,
      items: items.map(item => ({
        id: item.id.toString(),
        title: item.title,
        variantTitle: item.variant_title || undefined,
        sku: item.sku || undefined,
        quantity: item.quantity,
        price: item.price,
        totalDiscount: item.total_discount
      })),
      processedAt: order.processed_at || undefined,
      shippedAt: order.shipped_at || undefined,
      deliveredAt: order.delivered_at || undefined,
      cancelledAt: order.cancelled_at || undefined,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    };
  }
);
