import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export const clear = api<void, void>(
  { auth: true, expose: true, method: "DELETE", path: "/cart" },
  async () => {
    const authData = getAuthData()!;
    const userId = parseInt(authData.userID);

    await db.exec`
      DELETE FROM cart_items
      WHERE user_id = ${userId}
    `;
  }
);
