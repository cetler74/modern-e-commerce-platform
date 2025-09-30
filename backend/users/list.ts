import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  status: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListUsersResponse {
  users: User[];
  total: number;
}

// List all users (admin only)
export const list = api<void, ListUsersResponse>(
  { auth: true, expose: true, method: "GET", path: "/users" },
  async () => {
    const authData = getAuthData()!;
    
    // Check if user has admin permissions
    if (!authData.permissions.includes('users.read')) {
      throw new Error("Insufficient permissions");
    }

    const users = await db.queryAll<{
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      avatar_url: string | null;
      status: string;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, email, first_name, last_name, phone, avatar_url, status, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    // Get roles for each user
    const usersWithRoles: User[] = [];
    for (const user of users) {
      const roles = await db.queryAll<{ role_name: string }>`
        SELECT r.name as role_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${user.id}
      `;

      usersWithRoles.push({
        id: user.id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone || undefined,
        avatarUrl: user.avatar_url || undefined,
        status: user.status,
        roles: roles.map(r => r.role_name),
        createdAt: user.created_at,
        updatedAt: user.updated_at
      });
    }

    return {
      users: usersWithRoles,
      total: usersWithRoles.length
    };
  }
);
