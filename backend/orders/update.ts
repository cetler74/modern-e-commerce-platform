import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface UpdateOrderRequest {
  id: string;
  status?: string;
  financialStatus?: string;
  notes?: string;
}

export interface UpdateOrderResponse {
  success: boolean;
}

export const update = api<UpdateOrderRequest, UpdateOrderResponse>(
  { auth: true, expose: true, method: "PATCH", path: "/orders/:id" },
  async (req) => {
    const authData = getAuthData()!;
    
    if (!authData.permissions.includes('orders.update')) {
      throw new Error("Insufficient permissions");
    }

    const orderId = parseInt(req.id);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(req.status);
      
      if (req.status === 'shipped') {
        updates.push(`shipped_at = NOW()`);
      } else if (req.status === 'delivered') {
        updates.push(`delivered_at = NOW()`);
      } else if (req.status === 'cancelled') {
        updates.push(`cancelled_at = NOW()`);
      }
    }

    if (req.financialStatus !== undefined) {
      updates.push(`financial_status = $${paramIndex++}`);
      values.push(req.financialStatus);
    }

    if (req.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(req.notes);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length > 1) {
      await db.rawExec(
        `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        ...values,
        orderId
      );
    }

    return { success: true };
  }
);
