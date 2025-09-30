import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface UpdateSubscriptionRequest {
  action: 'pause' | 'resume' | 'cancel' | 'update_items';
  items?: SubscriptionItemUpdate[];
}

export interface SubscriptionItemUpdate {
  productVariantId: string;
  quantity: number;
}

export interface UpdateSubscriptionResponse {
  success: boolean;
  message: string;
}

// Update subscription (pause, resume, cancel, modify items)
export const updateSubscription = api<{ id: string } & UpdateSubscriptionRequest, UpdateSubscriptionResponse>(
  { auth: true, expose: true, method: "PUT", path: "/subscriptions/:id" },
  async ({ id, action, items }) => {
    const authData = getAuthData()!;
    
    // Verify subscription belongs to user
    const subscription = await db.queryRow<{ id: number; status: string }>`
      SELECT s.id, s.status
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ${parseInt(id)} AND c.user_id = ${authData.userID}
    `;

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    switch (action) {
      case 'pause':
        if (subscription.status !== 'active') {
          throw new Error("Only active subscriptions can be paused");
        }
        await db.exec`
          UPDATE subscriptions
          SET status = 'paused', paused_at = NOW(), updated_at = NOW()
          WHERE id = ${subscription.id}
        `;
        return { success: true, message: "Subscription paused successfully" };

      case 'resume':
        if (subscription.status !== 'paused') {
          throw new Error("Only paused subscriptions can be resumed");
        }
        await db.exec`
          UPDATE subscriptions
          SET status = 'active', paused_at = NULL, updated_at = NOW()
          WHERE id = ${subscription.id}
        `;
        return { success: true, message: "Subscription resumed successfully" };

      case 'cancel':
        if (subscription.status === 'cancelled') {
          throw new Error("Subscription is already cancelled");
        }
        await db.exec`
          UPDATE subscriptions
          SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
          WHERE id = ${subscription.id}
        `;
        return { success: true, message: "Subscription cancelled successfully" };

      case 'update_items':
        if (!items || items.length === 0) {
          throw new Error("Items are required for update_items action");
        }
        
        // Remove existing items
        await db.exec`
          DELETE FROM subscription_items WHERE subscription_id = ${subscription.id}
        `;
        
        // Add new items
        for (const item of items) {
          // Get product variant price
          const variant = await db.queryRow<{ price: number }>`
            SELECT price FROM product_variants WHERE id = ${parseInt(item.productVariantId)}
          `;
          
          if (variant) {
            await db.exec`
              INSERT INTO subscription_items (subscription_id, product_variant_id, quantity, price)
              VALUES (${subscription.id}, ${parseInt(item.productVariantId)}, ${item.quantity}, ${variant.price})
            `;
          }
        }
        
        await db.exec`
          UPDATE subscriptions SET updated_at = NOW() WHERE id = ${subscription.id}
        `;
        
        return { success: true, message: "Subscription items updated successfully" };

      default:
        throw new Error("Invalid action");
    }
  }
);
