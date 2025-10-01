import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface Address {
  id: string;
  type: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip: string;
  phone?: string;
  isDefault: boolean;
}

export interface ListAddressesResponse {
  addresses: Address[];
}

export const getAddresses = api<void, ListAddressesResponse>(
  { auth: true, expose: true, method: "GET", path: "/users/addresses" },
  async () => {
    const authData = getAuthData()!;
    
    const customer = await db.queryRow<{ id: number }>`
      SELECT id FROM customers WHERE user_id = ${authData.userID}
    `;

    if (!customer) {
      return { addresses: [] };
    }

    const addresses = await db.queryAll<{
      id: number;
      type: string;
      first_name: string | null;
      last_name: string | null;
      company: string | null;
      address1: string;
      address2: string | null;
      city: string;
      province: string | null;
      country: string;
      zip: string;
      phone: string | null;
      is_default: boolean;
    }>`
      SELECT * FROM addresses WHERE customer_id = ${customer.id}
      ORDER BY is_default DESC, created_at DESC
    `;

    return {
      addresses: addresses.map(a => ({
        id: a.id.toString(),
        type: a.type,
        firstName: a.first_name || undefined,
        lastName: a.last_name || undefined,
        company: a.company || undefined,
        address1: a.address1,
        address2: a.address2 || undefined,
        city: a.city,
        province: a.province || undefined,
        country: a.country,
        zip: a.zip,
        phone: a.phone || undefined,
        isDefault: a.is_default
      }))
    };
  }
);

export interface AddAddressRequest {
  type: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip: string;
  phone?: string;
  isDefault?: boolean;
}

export const addAddress = api<AddAddressRequest, Address>(
  { auth: true, expose: true, method: "POST", path: "/users/addresses" },
  async (req) => {
    const authData = getAuthData()!;
    
    const customer = await db.queryRow<{ id: number }>`
      SELECT id FROM customers WHERE user_id = ${authData.userID}
    `;

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (req.isDefault) {
      await db.exec`
        UPDATE addresses SET is_default = false WHERE customer_id = ${customer.id}
      `;
    }

    const result = await db.queryRow<{ id: number }>`
      INSERT INTO addresses (
        customer_id, type, first_name, last_name, company,
        address1, address2, city, province, country, zip, phone, is_default
      )
      VALUES (
        ${customer.id}, ${req.type}, ${req.firstName || null}, ${req.lastName || null},
        ${req.company || null}, ${req.address1}, ${req.address2 || null}, ${req.city},
        ${req.province || null}, ${req.country}, ${req.zip}, ${req.phone || null},
        ${req.isDefault || false}
      )
      RETURNING id
    `;

    return {
      id: result!.id.toString(),
      type: req.type,
      firstName: req.firstName,
      lastName: req.lastName,
      company: req.company,
      address1: req.address1,
      address2: req.address2,
      city: req.city,
      province: req.province,
      country: req.country,
      zip: req.zip,
      phone: req.phone,
      isDefault: req.isDefault || false
    };
  }
);

export interface UpdateAddressRequest {
  id: string;
  type?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  phone?: string;
  isDefault?: boolean;
}

export const updateAddress = api<UpdateAddressRequest, Address>(
  { auth: true, expose: true, method: "PATCH", path: "/users/addresses/:id" },
  async (req) => {
    const authData = getAuthData()!;
    const addressId = parseInt(req.id);
    
    const customer = await db.queryRow<{ id: number }>`
      SELECT id FROM customers WHERE user_id = ${authData.userID}
    `;

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (req.isDefault) {
      await db.exec`
        UPDATE addresses SET is_default = false WHERE customer_id = ${customer.id}
      `;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(req.type);
    }
    if (req.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(req.firstName);
    }
    if (req.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(req.lastName);
    }
    if (req.address1 !== undefined) {
      updates.push(`address1 = $${paramIndex++}`);
      values.push(req.address1);
    }
    if (req.city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(req.city);
    }
    if (req.country !== undefined) {
      updates.push(`country = $${paramIndex++}`);
      values.push(req.country);
    }
    if (req.zip !== undefined) {
      updates.push(`zip = $${paramIndex++}`);
      values.push(req.zip);
    }
    if (req.isDefault !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      values.push(req.isDefault);
    }

    if (updates.length > 0) {
      await db.rawExec(
        `UPDATE addresses SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} AND customer_id = $${paramIndex + 1}`,
        ...values,
        addressId,
        customer.id
      );
    }

    const address = await db.queryRow<{
      id: number;
      type: string;
      first_name: string | null;
      last_name: string | null;
      company: string | null;
      address1: string;
      address2: string | null;
      city: string;
      province: string | null;
      country: string;
      zip: string;
      phone: string | null;
      is_default: boolean;
    }>`
      SELECT * FROM addresses WHERE id = ${addressId}
    `;

    if (!address) {
      throw new Error("Address not found");
    }

    return {
      id: address.id.toString(),
      type: address.type,
      firstName: address.first_name || undefined,
      lastName: address.last_name || undefined,
      company: address.company || undefined,
      address1: address.address1,
      address2: address.address2 || undefined,
      city: address.city,
      province: address.province || undefined,
      country: address.country,
      zip: address.zip,
      phone: address.phone || undefined,
      isDefault: address.is_default
    };
  }
);

export interface DeleteAddressRequest {
  id: string;
}

export const deleteAddress = api<DeleteAddressRequest, void>(
  { auth: true, expose: true, method: "DELETE", path: "/users/addresses/:id" },
  async (req) => {
    const authData = getAuthData()!;
    const addressId = parseInt(req.id);
    
    const customer = await db.queryRow<{ id: number }>`
      SELECT id FROM customers WHERE user_id = ${authData.userID}
    `;

    if (!customer) {
      throw new Error("Customer not found");
    }

    await db.exec`
      DELETE FROM addresses WHERE id = ${addressId} AND customer_id = ${customer.id}
    `;
  }
);
