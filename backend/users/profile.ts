import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

// Get current user profile
export const getProfile = api<void, UserProfile>(
  { auth: true, expose: true, method: "GET", path: "/users/profile" },
  async () => {
    const authData = getAuthData()!;
    
    const user = await db.queryRow<{
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      avatar_url: string | null;
    }>`
      SELECT id, email, first_name, last_name, phone, avatar_url
      FROM users
      WHERE id = ${authData.userID}
    `;

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id.toString(),
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone || undefined,
      avatarUrl: user.avatar_url || undefined,
      roles: authData.roles,
      permissions: authData.permissions
    };
  }
);

// Update user profile
export const updateProfile = api<UpdateProfileRequest, UserProfile>(
  { auth: true, expose: true, method: "PUT", path: "/users/profile" },
  async (req) => {
    const authData = getAuthData()!;
    
    await db.exec`
      UPDATE users
      SET 
        first_name = COALESCE(${req.firstName}, first_name),
        last_name = COALESCE(${req.lastName}, last_name),
        phone = COALESCE(${req.phone}, phone),
        avatar_url = COALESCE(${req.avatarUrl}, avatar_url),
        updated_at = NOW()
      WHERE id = ${authData.userID}
    `;

    // Return updated profile
    return await getProfile();
  }
);
