import { authHandler } from "encore.dev/auth";
import { Header, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import * as jwt from "jsonwebtoken";
import db from "../db";

const jwtSecret = secret("JWTSecret");

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
  roles: string[];
  permissions: string[];
}

// Helper function to get user permissions
async function getUserPermissions(userId: number): Promise<{ roles: string[], permissions: string[] }> {
  const roleData = await db.queryAll<{
    role_name: string;
    permissions: any;
  }>`
    SELECT r.name as role_name, r.permissions
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ${userId}
  `;

  const roles = roleData.map(r => r.role_name);
  const allPermissions = new Set<string>();
  
  roleData.forEach(role => {
    if (role.permissions && typeof role.permissions === 'object') {
      Object.keys(role.permissions).forEach(permission => {
        if (role.permissions[permission]) {
          allPermissions.add(permission);
        }
      });
    }
  });

  return {
    roles,
    permissions: Array.from(allPermissions)
  };
}

export const auth = authHandler<AuthParams, AuthData>(
  async (params) => {
    const token = params.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing authorization header");
    }

    try {
      const payload = jwt.verify(token, jwtSecret()) as any;
      
      // Get user from database
      const user = await db.queryRow<{
        id: number;
        email: string;
        status: string;
      }>`
        SELECT id, email, status
        FROM users
        WHERE id = ${payload.userId}
      `;

      if (!user) {
        throw APIError.unauthenticated("user not found");
      }

      if (user.status !== 'active') {
        throw APIError.unauthenticated("user account is not active");
      }

      // Get user roles and permissions
      const { roles, permissions } = await getUserPermissions(user.id);

      return {
        userID: user.id.toString(),
        email: user.email,
        roles,
        permissions
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err as Error);
    }
  }
);
