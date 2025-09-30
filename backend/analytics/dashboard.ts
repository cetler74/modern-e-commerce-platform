import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Query } from "encore.dev/api";
import db from "../db";

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  activeSubscriptions: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  subscriptionGrowth: number;
}

export interface DashboardParams {
  period?: Query<string>; // '7d', '30d', '90d', '1y'
}

// Get dashboard metrics
export const getDashboardMetrics = api<DashboardParams, DashboardMetrics>(
  { auth: true, expose: true, method: "GET", path: "/analytics/dashboard" },
  async (params) => {
    const authData = getAuthData()!;
    
    if (!authData.permissions.includes('analytics.read')) {
      throw new Error("Insufficient permissions");
    }

    const period = params.period || '30d';
    let daysBack = 30;
    
    switch (period) {
      case '7d': daysBack = 7; break;
      case '30d': daysBack = 30; break;
      case '90d': daysBack = 90; break;
      case '1y': daysBack = 365; break;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - (daysBack * 2));
    const previousEndDate = new Date();
    previousEndDate.setDate(previousEndDate.getDate() - daysBack);

    // Current period metrics
    const currentMetrics = await db.queryRow<{
      total_revenue: number;
      total_orders: number;
      total_customers: number;
      active_subscriptions: number;
    }>`
      SELECT 
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.customer_id) as total_customers,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions
      FROM orders o
      WHERE o.created_at >= ${startDate}
    `;

    // Previous period metrics for growth calculation
    const previousMetrics = await db.queryRow<{
      total_revenue: number;
      total_orders: number;
      total_customers: number;
    }>`
      SELECT 
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.customer_id) as total_customers
      FROM orders o
      WHERE o.created_at >= ${previousStartDate} AND o.created_at < ${previousEndDate}
    `;

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalRevenue: currentMetrics?.total_revenue || 0,
      totalOrders: currentMetrics?.total_orders || 0,
      totalCustomers: currentMetrics?.total_customers || 0,
      activeSubscriptions: currentMetrics?.active_subscriptions || 0,
      revenueGrowth: calculateGrowth(
        currentMetrics?.total_revenue || 0,
        previousMetrics?.total_revenue || 0
      ),
      orderGrowth: calculateGrowth(
        currentMetrics?.total_orders || 0,
        previousMetrics?.total_orders || 0
      ),
      customerGrowth: calculateGrowth(
        currentMetrics?.total_customers || 0,
        previousMetrics?.total_customers || 0
      ),
      subscriptionGrowth: 0 // Would need historical subscription data to calculate
    };
  }
);
