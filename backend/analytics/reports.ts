import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Query } from "encore.dev/api";
import db from "../db";

export interface SalesReport {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface SalesReportParams {
  startDate?: Query<string>;
  endDate?: Query<string>;
  groupBy?: Query<string>;
}

export interface SalesReportResponse {
  data: SalesReport[];
  totalRevenue: number;
  totalOrders: number;
}

export const getSalesReport = api<SalesReportParams, SalesReportResponse>(
  { auth: true, expose: true, method: "GET", path: "/analytics/sales" },
  async (params) => {
    const authData = getAuthData()!;
    
    if (!authData.permissions.includes('analytics.read')) {
      throw new Error("Insufficient permissions");
    }

    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const startDate = params.startDate 
      ? new Date(params.startDate) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groupBy = params.groupBy || 'day';
    
    let dateFormat = "DATE(o.created_at)";
    if (groupBy === 'week') {
      dateFormat = "DATE_TRUNC('week', o.created_at)";
    } else if (groupBy === 'month') {
      dateFormat = "DATE_TRUNC('month', o.created_at)";
    }

    const salesData = await db.rawQueryAll<{
      date: Date;
      revenue: number;
      orders: number;
    }>(
      `SELECT 
        ${dateFormat} as date,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
       FROM orders o
       WHERE o.created_at >= $1 AND o.created_at <= $2
         AND o.financial_status = 'paid'
       GROUP BY ${dateFormat}
       ORDER BY date`,
      startDate,
      endDate
    );

    const totals = await db.queryRow<{
      total_revenue: number;
      total_orders: number;
    }>`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as total_orders
      FROM orders
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        AND financial_status = 'paid'
    `;

    return {
      data: salesData.map(d => ({
        date: d.date.toISOString().split('T')[0],
        revenue: d.revenue,
        orders: d.orders,
        averageOrderValue: d.orders > 0 ? d.revenue / d.orders : 0
      })),
      totalRevenue: totals?.total_revenue || 0,
      totalOrders: totals?.total_orders || 0
    };
  }
);

export interface ProductPerformance {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface ProductPerformanceParams {
  limit?: Query<number>;
  startDate?: Query<string>;
  endDate?: Query<string>;
}

export interface ProductPerformanceResponse {
  products: ProductPerformance[];
}

export const getProductPerformance = api<ProductPerformanceParams, ProductPerformanceResponse>(
  { auth: true, expose: true, method: "GET", path: "/analytics/products" },
  async (params) => {
    const authData = getAuthData()!;
    
    if (!authData.permissions.includes('analytics.read')) {
      throw new Error("Insufficient permissions");
    }

    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const startDate = params.startDate 
      ? new Date(params.startDate) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const limit = params.limit || 10;

    const products = await db.rawQueryAll<{
      product_id: number;
      product_name: string;
      total_sold: number;
      revenue: number;
    }>(
      `SELECT 
        p.id as product_id,
        p.name as product_name,
        SUM(oli.quantity) as total_sold,
        SUM(oli.quantity * oli.price) as revenue
       FROM order_line_items oli
       JOIN products p ON oli.product_variant_id IN (
         SELECT id FROM product_variants WHERE product_id = p.id
       ) OR (oli.product_variant_id IS NULL)
       JOIN orders o ON oli.order_id = o.id
       WHERE o.created_at >= $1 AND o.created_at <= $2
         AND o.financial_status = 'paid'
       GROUP BY p.id, p.name
       ORDER BY revenue DESC
       LIMIT $3`,
      startDate,
      endDate,
      limit
    );

    return {
      products: products.map(p => ({
        productId: p.product_id.toString(),
        productName: p.product_name,
        totalSold: p.total_sold,
        revenue: p.revenue
      }))
    };
  }
);
