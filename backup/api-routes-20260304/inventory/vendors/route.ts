/**
 * Inventory Vendors API
 * Handles vendor and supplier management
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { inventoryVendors, inventoryCategories } from "@/lib/db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";

interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// GET /api/inventory/vendors - List vendors
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const search = searchParams.get("search") || "";
    const vendorType = searchParams.get("vendorType") || "";
    const isActive = searchParams.get("isActive");
    const city = searchParams.get("city") || "";

    // Build where conditions
    const conditions: ReturnType<typeof sql>[] = [];

    // Only show vendors from user's school or global vendors
    if (user.schoolId) {
      conditions.push(
        or(
          eq(inventoryVendors.schoolId, user.schoolId || ""),
          sql`${inventoryVendors.schoolId} = ''`
        )!
      );
    }

    if (search) {
      const searchConditions = [
        like(inventoryVendors.name, `%${search}%`),
      ];
      if (inventoryVendors.code !== null) {
        searchConditions.push(like(inventoryVendors.code, `%${search}%`));
      }
      if (inventoryVendors.contactPerson !== null) {
        searchConditions.push(like(inventoryVendors.contactPerson, `%${search}%`));
      }
      if (inventoryVendors.email !== null) {
        searchConditions.push(like(inventoryVendors.email, `%${search}%`));
      }
      if (inventoryVendors.phone !== null) {
        searchConditions.push(like(inventoryVendors.phone, `%${search}%`));
      }
      conditions.push(or(...searchConditions)!);
    }

    if (vendorType) {
      conditions.push(eq(inventoryVendors.vendorType, vendorType));
    }

    if (isActive !== null && isActive !== "") {
      conditions.push(eq(inventoryVendors.isActive, isActive === "true"));
    }

    if (city) {
      conditions.push(
        inventoryVendors.city !== null ? like(inventoryVendors.city, `%${city}%`) : sql`1=0`
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(inventoryVendors)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult[0]?.count || 0;

    // Get vendors with pagination
    const vendors = await db
      .select()
      .from(inventoryVendors)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inventoryVendors.totalAmount), inventoryVendors.name)
      .limit(limit)
      .offset((page - 1) * limit);

    // Fetch categories for vendor categories
    const allCategories = await db
      .select({ id: inventoryCategories.id, name: inventoryCategories.name })
      .from(inventoryCategories);

    const categoryMap = new Map(allCategories.map((cat) => [cat.id, cat.name]));

    // Attach category names
    const vendorsWithDetails = vendors.map((vendor) => ({
      ...vendor,
      categoryNames: (vendor.categoryIds || []).map((id) => categoryMap.get(id) || id),
    }));

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    logger.info("Fetched inventory vendors", { userId, count: vendors.length });

    return {
      items: vendorsWithDetails,
      pagination,
    };
  },
  ['admin']
);

// ============================================================================
// POST /api/inventory/vendors - Create new vendor
// ============================================================================

interface CreateVendorInput {
  name: string;
  code?: string;
  vendorType?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  city?: string;
  district?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  licenseNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  paymentTerms?: string;
  creditLimit?: number;
  creditPeriod?: number;
  discountPercentage?: number;
  categoryIds?: string[];
  notes?: string;
}

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;

    const data: CreateVendorInput = await request.json();

    // Validate required fields
    if (!data.name) {
      return { error: "Missing required field: name", status: 400 };
    }

    const now = new Date();
    const vendorId = `vendor-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Generate vendor code if not provided
    const code = data.code || `VEND-${Date.now().toString().slice(-6)}`;

    const [newVendor] = await db
      .insert(inventoryVendors)
      .values({
        id: vendorId,
        schoolId: user.schoolId || "",
        name: data.name,
        code,
        vendorType: data.vendorType || "regular",
        contactPerson: data.contactPerson || null,
        email: data.email || null,
        phone: data.phone || null,
        mobile: data.mobile || null,
        website: data.website || null,
        address: data.address || null,
        city: data.city || null,
        district: data.district || null,
        country: data.country || "Bhutan",
        postalCode: data.postalCode || null,
        taxId: data.taxId || null,
        licenseNumber: data.licenseNumber || null,
        bankName: data.bankName || null,
        bankAccountNumber: data.bankAccountNumber || null,
        bankBranch: data.bankBranch || null,
        paymentTerms: data.paymentTerms || "NET 30",
        creditLimit: data.creditLimit || null,
        creditPeriod: data.creditPeriod || null,
        discountPercentage: data.discountPercentage || 0,
        categoryIds: data.categoryIds || null,
        rating: null,
        totalOrders: 0,
        totalAmount: 0,
        notes: data.notes || null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    logger.info("Created inventory vendor", { userId, vendorId });

    return { vendor: newVendor };
  },
  ['admin']
);

// ============================================================================
// PATCH /api/inventory/vendors - Update vendor
// ============================================================================

interface UpdateVendorInput extends Partial<CreateVendorInput> {
  id: string;
  rating?: number;
  isActive?: boolean;
}

export const PATCH = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const data: UpdateVendorInput = await request.json();

    if (!data.id) {
      return { error: "Vendor ID is required", status: 400 };
    }

    // Check if vendor exists
    const [existingVendor] = await db
      .select()
      .from(inventoryVendors)
      .where(eq(inventoryVendors.id, data.id))
      .limit(1);

    if (!existingVendor) {
      return { error: "Vendor not found", status: 404 };
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields: (keyof UpdateVendorInput)[] = [
      "name",
      "code",
      "vendorType",
      "contactPerson",
      "email",
      "phone",
      "mobile",
      "website",
      "address",
      "city",
      "district",
      "country",
      "postalCode",
      "taxId",
      "licenseNumber",
      "bankName",
      "bankAccountNumber",
      "bankBranch",
      "paymentTerms",
      "creditLimit",
      "creditPeriod",
      "discountPercentage",
      "categoryIds",
      "rating",
      "notes",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (field in data && data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const [updatedVendor] = await db
      .update(inventoryVendors)
      .set(updateData)
      .where(eq(inventoryVendors.id, data.id))
      .returning();

    logger.info("Updated inventory vendor", { userId, vendorId: data.id });

    return { vendor: updatedVendor };
  },
  ['admin']
);

// ============================================================================
// DELETE /api/inventory/vendors - Delete vendor
// ============================================================================

export const DELETE = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("id");

    if (!vendorId) {
      return { error: "Vendor ID is required", status: 400 };
    }

    // Check if vendor exists
    const [existingVendor] = await db
      .select()
      .from(inventoryVendors)
      .where(eq(inventoryVendors.id, vendorId))
      .limit(1);

    if (!existingVendor) {
      return { error: "Vendor not found", status: 404 };
    }

    await db.delete(inventoryVendors).where(eq(inventoryVendors.id, vendorId));

    logger.info("Deleted inventory vendor", { userId, vendorId });

    return { message: "Vendor deleted successfully" };
  },
  ['admin']
);
