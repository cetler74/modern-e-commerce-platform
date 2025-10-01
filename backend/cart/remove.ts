import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface RemoveFromCartRequest {
  id: string;
}

export const remove = api<RemoveFromCartRequest, void>(
  { auth: true, expose: true, method: "DELETE", path: "/cart/items/:id" },
  async (req) => {
    const authData = getAuthData()!;
    const userId = parseInt(authData.userID);
    const itemId = parseInt(req.id);

    await db.exec`
      DELETE FROM cart_items
      WHERE id = ${itemId} AND user_id = ${userId}
    `;
  }
);
