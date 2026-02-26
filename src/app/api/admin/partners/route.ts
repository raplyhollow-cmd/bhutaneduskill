/**
 * Partners Management API
 *
 * GET /api/admin/partners - List all partners with pagination and filters
 * POST /api/admin/partners - Create a new partner
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { partners, schools } from "@/lib/db/schema";
import { eq, and, like, or, desc, asc, sql, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, createdResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

type PartnerType = "rub_college" | "industry" | "ngo" | "government";
type PartnerStatus = "active" | "pending" | "inactive";

interface PartnerFilters {
  type?: PartnerType;
  status?: PartnerStatus;
  search?: string;
  schoolId?: string;
}

interface PartnerSort {
  field?: "name" | "partnershipDate" | "createdAt" | "type";
  order?: "asc" | "desc";
}

interface PartnerListQuery {
  page?: number;
  limit?: number;
  type?: PartnerType;
  status?: PartnerStatus;
  search?: string;
  schoolId?: string;
  sort?: PartnerSort["field"];
  order?: PartnerSort["order"];
}

interface CreatePartnerInput {
  name: string;
  type: PartnerType;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  description?: string;
  partnershipDate?: string;
  schoolId?: string;
  status?: PartnerStatus;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePartnerInput(data: CreatePartnerInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!data.name || data.name.trim().length === 0) {
    errors.push("Partner name is required");
  }

  if (!data.type) {
    errors.push("Partner type is required");
  } else if (!["rub_college", "industry", "ngo", "government"].includes(data.type)) {
    errors.push("Invalid partner type. Must be one of: rub_college, industry, ngo, government");
  }

  // Email validation
  if (data.email && data.email.trim() && !validateEmail(data.email)) {
    errors.push("Invalid email format");
  }

  // Status validation
  if (data.status && !["active", "pending", "inactive"].includes(data.status)) {
    errors.push("Invalid status. Must be one of: active, pending, inactive");
  }

  // Partnership date validation
  if (data.partnershipDate) {
    const date = new Date(data.partnershipDate);
    if (isNaN(date.getTime())) {
      errors.push("Invalid partnership date format");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// GET - List Partners
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    try {
      const { searchParams } = new URL(request.url);

      // Parse query parameters
      const query: PartnerListQuery = {
        page: parseInt(searchParams.get("page") || "1"),
        limit: parseInt(searchParams.get("limit") || "20"),
        type: searchParams.get("type") as PartnerType | undefined,
        status: searchParams.get("status") as PartnerStatus | undefined,
        search: searchParams.get("search") || undefined,
        schoolId: searchParams.get("schoolId") || undefined,
        sort: (searchParams.get("sort") as PartnerSort["field"]) || "createdAt",
        order: (searchParams.get("order") as PartnerSort["order"]) || "desc",
      };

      // Build where conditions
      const conditions = [];

      // Filter by type
      if (query.type) {
        conditions.push(eq(partners.type, query.type));
      }

      // Filter by status
      if (query.status) {
        conditions.push(eq(partners.status, query.status));
      }

      // Filter by school
      if (query.schoolId) {
        conditions.push(eq(partners.schoolId, query.schoolId));
      }

      // Search across name, email, contact person
      if (query.search) {
        const searchTerm = `%${query.search}%`;
        conditions.push(
          or(
            like(partners.name, searchTerm),
            like(partners.email, searchTerm),
            like(sql`COALESCE(${partners.contactPerson}, '')`, searchTerm)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions as any[]) : undefined;

      // Calculate pagination
      const offset = (query.page - 1) * query.limit;

      // Build order by clause
      let orderBy;
      const sortColumn =
        query.sort === "name"
          ? partners.name
          : query.sort === "partnershipDate"
          ? partners.partnershipDate
          : query.sort === "type"
          ? partners.type
          : partners.createdAt;

      orderBy = query.order === "asc" ? asc(sortColumn) : desc(sortColumn);

      // Fetch partners with school info (join)
      const partnersData = await db
        .select({
          id: partners.id,
          name: partners.name,
          type: partners.type,
          email: partners.email,
          phone: partners.phone,
          address: partners.address,
          contactPerson: partners.contactPerson,
          description: partners.description,
          partnershipDate: partners.partnershipDate,
          status: partners.status,
          workshopsConducted: partners.workshopsConducted,
          studentsPlaced: partners.studentsPlaced,
          schoolId: partners.schoolId,
          createdAt: partners.createdAt,
          updatedAt: partners.updatedAt,
          schoolName: schools.name,
        })
        .from(partners)
        .leftJoin(schools, eq(partners.schoolId, schools.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(query.limit)
        .offset(offset);

      // Get total count for pagination
      const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(partners)
        .where(whereClause);

      // Get statistics by type
      const statsByType = await db
        .select({
          type: partners.type,
          count: count(),
        })
        .from(partners)
        .groupBy(partners.type);

      const typeStats = {
        rub_college: 0,
        industry: 0,
        ngo: 0,
        government: 0,
      };

      for (const stat of statsByType) {
        if (stat.type in typeStats) {
          typeStats[stat.type as PartnerType] = stat.count;
        }
      }

      // Get statistics by status
      const statsByStatus = await db
        .select({
          status: partners.status,
          count: count(),
        })
        .from(partners)
        .groupBy(partners.status);

      const statusStats = {
        active: 0,
        pending: 0,
        inactive: 0,
      };

      for (const stat of statsByStatus) {
        if (stat.status in statusStats) {
          statusStats[stat.status as PartnerStatus] = stat.count;
        }
      }

      logger.info("Partners list fetched", {
        userId,
        page: query.page,
        limit: query.limit,
        total: totalCount,
      });

      return successResponse({
        partners: partnersData,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / query.limit),
        },
        statistics: {
          byType: typeStats,
          byStatus: statusStats,
          total: totalCount,
        },
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/admin/partners", method: "GET" });
      return errorResponse("Failed to fetch partners", 500);
    }
  },
  ['admin']
);

// ============================================================================
// POST - Create Partner
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    try {
      const body = await request.json();

      // Validate input
      const validation = validatePartnerInput(body);
      if (!validation.valid) {
        return badRequestResponse("Validation failed: " + validation.errors.join(", "));
      }

      // Generate unique ID
      const partnerId = `partner-${nanoid(10)}`;

      // Prepare partner data with defaults
      const partnerData = {
        id: partnerId,
        name: body.name.trim(),
        type: body.type as PartnerType,
        email: body.email?.trim() || "",
        phone: body.phone?.trim() || "",
        address: body.address?.trim() || "",
        contactPerson: body.contactPerson?.trim() || "",
        description: body.description?.trim() || "",
        partnershipDate: body.partnershipDate || new Date().toISOString().split("T")[0],
        schoolId: body.schoolId || null,
        status: (body.status || "active") as PartnerStatus,
        workshopsConducted: 0,
        studentsPlaced: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Check if school exists (if provided)
      if (body.schoolId) {
        const school = await db
          .select({ id: schools.id })
          .from(schools)
          .where(eq(schools.id, body.schoolId))
          .limit(1);

        if (school.length === 0) {
          return notFoundResponse("School");
        }
      }

      // Create partner
      await db.insert(partners).values(partnerData);

      // Fetch created partner with school info
      const createdPartner = await db
        .select({
          id: partners.id,
          name: partners.name,
          type: partners.type,
          email: partners.email,
          phone: partners.phone,
          address: partners.address,
          contactPerson: partners.contactPerson,
          description: partners.description,
          partnershipDate: partners.partnershipDate,
          status: partners.status,
          workshopsConducted: partners.workshopsConducted,
          studentsPlaced: partners.studentsPlaced,
          schoolId: partners.schoolId,
          createdAt: partners.createdAt,
          updatedAt: partners.updatedAt,
          schoolName: schools.name,
        })
        .from(partners)
        .leftJoin(schools, eq(partners.schoolId, schools.id))
        .where(eq(partners.id, partnerId))
        .limit(1);

      logger.info("Partner created", {
        userId,
        partnerId,
        partnerName: partnerData.name,
        partnerType: partnerData.type,
      });

      return createdResponse({
        partner: createdPartner[0],
        message: "Partner created successfully"
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/admin/partners", method: "POST" });
      return errorResponse("Failed to create partner", 500);
    }
  },
  ['admin']
);
