import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface CreateSubscriptionRequest {
  planId: string;
  items: SubscriptionItemInput[];
  billingAddress: Address;
  shippingAddress: Address;
}

export interface SubscriptionItemInput {
  productVariantId: string;
  quantity: number;
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

export interface CreateSubscriptionResponse {
  id: string;
  status: string;
  nextBillingDate: Date;
}

export const create = api<CreateSubscriptionRequest, CreateSubscriptionResponse>(
  { auth: true, expose: true, method: "POST", path: "/subscriptions" },
  async (req) => {
    const authData = getAuthData()!;
    const planId = parseInt(req.planId);

    const customer = await db.queryRow<{ id: number }>`
      SELECT id FROM customers WHERE user_id = ${authData.userID}
    `;

    if (!customer) {
      throw new Error("Customer not found");
    }

    const plan = await db.queryRow<{
      id: number;
      billing_interval: string;
      billing_interval_count: number;
      trial_period_days: number;
    }>`
      SELECT id, billing_interval, billing_interval_count, trial_period_days
      FROM subscription_plans
      WHERE id = ${planId} AND is_active = true
    `;

    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    const now = new Date();
    const trialEnd = plan.trial_period_days > 0 
      ? new Date(now.getTime() + plan.trial_period_days * 24 * 60 * 60 * 1000)
      : null;

    let periodEnd = new Date(now);
    switch (plan.billing_interval) {
      case 'daily':
        periodEnd.setDate(periodEnd.getDate() + plan.billing_interval_count);
        break;
      case 'weekly':
        periodEnd.setDate(periodEnd.getDate() + plan.billing_interval_count * 7);
        break;
      case 'monthly':
        periodEnd.setMonth(periodEnd.getMonth() + plan.billing_interval_count);
        break;
      case 'quarterly':
        periodEnd.setMonth(periodEnd.getMonth() + plan.billing_interval_count * 3);
        break;
      case 'yearly':
        periodEnd.setFullYear(periodEnd.getFullYear() + plan.billing_interval_count);
        break;
    }

    const subscription = await db.queryRow<{ id: number }>`
      INSERT INTO subscriptions (
        customer_id, plan_id, status, current_period_start, current_period_end,
        trial_start, trial_end, next_billing_date, billing_address, shipping_address
      )
      VALUES (
        ${customer.id}, ${planId}, 'active', ${now}, ${periodEnd},
        ${trialEnd ? now : null}, ${trialEnd}, ${periodEnd},
        ${JSON.stringify(req.billingAddress)}, ${JSON.stringify(req.shippingAddress)}
      )
      RETURNING id
    `;

    if (!subscription) {
      throw new Error("Failed to create subscription");
    }

    for (const item of req.items) {
      const variant = await db.queryRow<{ price: number }>`
        SELECT COALESCE(price, (SELECT price FROM products WHERE id = product_id)) as price
        FROM product_variants
        WHERE id = ${parseInt(item.productVariantId)}
      `;

      if (!variant) {
        throw new Error(`Product variant ${item.productVariantId} not found`);
      }

      await db.exec`
        INSERT INTO subscription_items (subscription_id, product_variant_id, quantity, price)
        VALUES (${subscription.id}, ${parseInt(item.productVariantId)}, ${item.quantity}, ${variant.price})
      `;
    }

    return {
      id: subscription.id.toString(),
      status: 'active',
      nextBillingDate: periodEnd
    };
  }
);
