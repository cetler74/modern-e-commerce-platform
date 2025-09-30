import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Query } from "encore.dev/api";
import db from "../db";

export interface Order {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ListOrdersParams {
  status?: Query<string>;
  financialStatus?: Query<string>;
  customerId?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListOrdersResponse {
  orders: Order[];
  total: number;
}

// List orders with filtering
export const list = api<ListOrdersParams, ListOrdersResponse>(
  { auth: true, expose: true, method: "GET", path: "/orders" },
  async (params) => {
    const authData = getAuthData()!;
    
    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];
    let paramIndex = 1;

    // If not admin, only show user's own orders
    if (!authData.permissions.includes('orders.read_all')) {
      // Get customer ID for current user
      const customer = await db.queryRow<{ id: number }>`
        SELECT id FROM customers WHERE user_id = ${authData.userID}
      `;
      
      if (customer) {
        whereClause += ` AND customer_id = $${paramIndex}`;
        queryParams.push(customer.id);
        paramIndex++;
      } else {
        // No customer record found, return empty
        return { orders: [], total: 0 };
      }
    }

    if (params.status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(params.status);
      paramIndex++;
    }

    if (params.financialStatus) {
      whereClause += ` AND financial_status = $${paramIndex}`;
      queryParams.push(params.financialStatus);
      paramIndex++;
    }

    if (params.customerId && authData.permissions.includes('orders.read_all')) {
      whereClause += ` AND customer_id = $${paramIndex}`;
      queryParams.push(parseInt(params.customerId));
      paramIndex++;
    }

    const limit = params.limit || 20;
    const offset = params.offset || 0;

    // Get total count
    const countResult = await db.rawQueryRow<{ count: number }>(
      `SELECT COUNT(*) as count FROM orders ${whereClause}`,
      ...queryParams
    );

    // Get orders
    const orders = await db.rawQueryAll<{
      id: number;
      order_number: string;
      email: string;
      status: string;
      financial_status: string;
      subtotal: number;
      tax_amount: number;
      shipping_amount: number;
      discount_amount: number;
      total_amount: number;
      currency: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, order_number, email, status, financial_status, subtotal,
              tax_amount, shipping_amount, discount_amount, total_amount, currency,
              created_at, updated_at
       FROM orders 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      ...queryParams, limit, offset
    );

    return {
      orders: orders.map(o => ({
        id: o.id.toString(),
        orderNumber: o.order_number,
        customerEmail: o.email,
        status: o.status,
        financialStatus: o.financial_status,
        subtotal: o.subtotal,
        taxAmount: o.tax_amount,
        shippingAmount: o.shipping_amount,
        discountAmount: o.discount_amount,
        totalAmount: o.total_amount,
        currency: o.currency,
        createdAt: o.created_at,
        updatedAt: o.updated_at
      })),
      total: countResult?.count || 0
    };
  }
);
