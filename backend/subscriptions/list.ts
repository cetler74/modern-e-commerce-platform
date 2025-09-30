import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Query } from "encore.dev/api";
import db from "../db";

export interface Subscription {
  id: string;
  planName: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate?: Date;
  items: SubscriptionItem[];
  createdAt: Date;
}

export interface SubscriptionItem {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  price: number;
}

export interface ListSubscriptionsParams {
  status?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListSubscriptionsResponse {
  subscriptions: Subscription[];
  total: number;
}

// List user's subscriptions
export const list = api<ListSubscriptionsParams, ListSubscriptionsResponse>(
  { auth: true, expose: true, method: "GET", path: "/subscriptions" },
  async (params) => {
    const authData = getAuthData()!;
    
    // Get customer
    const customer = await db.queryRow<{ id: number }>`
      SELECT id FROM customers WHERE user_id = ${authData.userID}
    `;

    if (!customer) {
      return { subscriptions: [], total: 0 };
    }

    let whereClause = "WHERE s.customer_id = $1";
    const queryParams: any[] = [customer.id];
    let paramIndex = 2;

    if (params.status) {
      whereClause += ` AND s.status = $${paramIndex}`;
      queryParams.push(params.status);
      paramIndex++;
    }

    const limit = params.limit || 20;
    const offset = params.offset || 0;

    // Get subscriptions
    const subscriptions = await db.rawQueryAll<{
      id: number;
      plan_name: string;
      status: string;
      current_period_start: Date;
      current_period_end: Date;
      next_billing_date: Date | null;
      created_at: Date;
    }>(
      `SELECT s.id, sp.name as plan_name, s.status, s.current_period_start,
              s.current_period_end, s.next_billing_date, s.created_at
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      ...queryParams, limit, offset
    );

    // Get subscription items for each subscription
    const subscriptionsWithItems: Subscription[] = [];
    for (const sub of subscriptions) {
      const items = await db.queryAll<{
        id: number;
        product_name: string;
        variant_name: string;
        quantity: number;
        price: number;
      }>`
        SELECT si.id, p.name as product_name, pv.name as variant_name,
               si.quantity, si.price
        FROM subscription_items si
        JOIN product_variants pv ON si.product_variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE si.subscription_id = ${sub.id}
      `;

      subscriptionsWithItems.push({
        id: sub.id.toString(),
        planName: sub.plan_name,
        status: sub.status,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        nextBillingDate: sub.next_billing_date || undefined,
        items: items.map(item => ({
          id: item.id.toString(),
          productName: item.product_name,
          variantName: item.variant_name,
          quantity: item.quantity,
          price: item.price
        })),
        createdAt: sub.created_at
      });
    }

    return {
      subscriptions: subscriptionsWithItems,
      total: subscriptions.length
    };
  }
);
