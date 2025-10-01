import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface DeleteProductRequest {
  id: string;
}

export const deleteProduct = api<DeleteProductRequest, void>(
  { auth: true, expose: true, method: "DELETE", path: "/products/:id" },
  async (req) => {
    const authData = getAuthData()!;
    
    if (!authData.permissions.includes('products.delete')) {
      throw new Error("Insufficient permissions");
    }

    const productId = parseInt(req.id);

    await db.exec`DELETE FROM products WHERE id = ${productId}`;
  }
);
