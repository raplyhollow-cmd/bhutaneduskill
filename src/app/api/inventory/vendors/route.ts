/**
 * Inventory Vendors API
 * Handles vendor and supplier management
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { inventoryVendors, inventoryCategories } from "@/lib/db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse, Pagination } from "@/types";

interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

// ============================================================================
// GET /api/inventory/vendors - List vendors
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { user, userId } = authResult;

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

    const pagination: Pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    logger.info("Fetched inventory vendors", { userId, count: vendors.length });

    return NextResponse.json({
      data: {
        items: vendorsWithDetails,
        pagination,
      },
    } satisfies ApiSuccess<PaginatedData<typeof vendorsWithDetails[0]>>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/vendors", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch vendors", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

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

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { user, userId } = authResult;

    const data: CreateVendorInput = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Missing required field: name", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
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

    return NextResponse.json({
      data: newVendor,
      message: "Vendor created successfully",
    } satisfies ApiSuccess<typeof newVendor>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/vendors", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create vendor", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/inventory/vendors - Update vendor
// ============================================================================

interface UpdateVendorInput extends Partial<CreateVendorInput> {
  id: string;
  rating?: number;
  isActive?: boolean;
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const data: UpdateVendorInput = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: "Vendor ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check if vendor exists
    const existingVendor = await db.query.inventoryVendors.findFirst({
      where: eq(inventoryVendors.id, data.id),
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: "Vendor not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
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

    return NextResponse.json({
      data: updatedVendor,
      message: "Vendor updated successfully",
    } satisfies ApiSuccess<typeof updatedVendor>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/vendors", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update vendor", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/inventory/vendors - Delete vendor
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("id");

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check if vendor exists
    const existingVendor = await db.query.inventoryVendors.findFirst({
      where: eq(inventoryVendors.id, vendorId),
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: "Vendor not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    await db.delete(inventoryVendors).where(eq(inventoryVendors.id, vendorId));

    logger.info("Deleted inventory vendor", { userId, vendorId });

    return NextResponse.json({
      data: { message: "Vendor deleted successfully" },
    } satisfies ApiSuccess<{ message: string }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/vendors", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete vendor", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
