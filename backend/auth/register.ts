import { api, APIError } from "encore.dev/api";
import * as bcrypt from "bcrypt";
import db from "../db";

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RegisterResponse {
  success: boolean;
  userId: string;
}

// Register new user
export const register = api<RegisterRequest, RegisterResponse>(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req) => {
    // Check if user already exists
    const existingUser = await db.queryRow`
      SELECT id FROM users WHERE email = ${req.email.toLowerCase()}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("user with this email already exists");
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(req.password, saltRounds);

    // Create user
    const user = await db.queryRow<{ id: number }>`
      INSERT INTO users (email, password_hash, first_name, last_name, phone)
      VALUES (${req.email.toLowerCase()}, ${passwordHash}, ${req.firstName}, ${req.lastName}, ${req.phone || null})
      RETURNING id
    `;

    if (!user) {
      throw APIError.internal("failed to create user");
    }

    // Assign default customer role
    const customerRole = await db.queryRow<{ id: number }>`
      SELECT id FROM roles WHERE name = 'customer'
    `;

    if (customerRole) {
      await db.exec`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (${user.id}, ${customerRole.id})
      `;
    }

    // Create customer record
    const customerNumber = `CUST-${Date.now()}`;
    await db.exec`
      INSERT INTO customers (user_id, customer_number)
      VALUES (${user.id}, ${customerNumber})
    `;

    return {
      success: true,
      userId: user.id.toString()
    };
  }
);
