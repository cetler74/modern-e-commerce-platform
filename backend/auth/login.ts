import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import db from "../db";

const jwtSecret = secret("JWTSecret");

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

// Login endpoint
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    const user = await db.queryRow<{
      id: number;
      email: string;
      password_hash: string;
      first_name: string;
      last_name: string;
      status: string;
    }>`
      SELECT id, email, password_hash, first_name, last_name, status
      FROM users
      WHERE email = ${req.email.toLowerCase()}
    `;

    if (!user) {
      throw APIError.unauthenticated("invalid credentials");
    }

    if (user.status !== 'active') {
      throw APIError.unauthenticated("account is not active");
    }

    const isValidPassword = await bcrypt.compare(req.password, user.password_hash);
    if (!isValidPassword) {
      throw APIError.unauthenticated("invalid credentials");
    }

    // Get user roles
    const roles = await db.queryAll<{ role_name: string }>`
      SELECT r.name as role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${user.id}
    `;

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret(),
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: roles.map(r => r.role_name)
      }
    };
  }
);
