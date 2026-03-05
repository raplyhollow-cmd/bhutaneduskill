/**
 * SCHOOLS FEATURE
 *
 * Unified definition for School resource: Schema + API + Components
 */

import { defineFeature } from "@/lib/features/define-feature";

export const SchoolFeature = defineFeature({
  name: "schools",
  tableName: "schools",

  schema: {
    id: { type: "text", required: true },
    name: { type: "text", required: true, label: "School Name", sortable: true, searchable: true },
    code: { type: "text", required: true, label: "Code", sortable: true, unique: true },
    type: { type: "text", label: "Type", filterable: true }, // public, private, international
    address: { type: "text", label: "Address" },
    city: { type: "text", label: "City", sortable: true, filterable: true },
    state: { type: "text", label: "State" },
    country: { type: "text", label: "Country" },
    phone: { type: "text", label: "Phone" },
    email: { type: "email", label: "Email" },
    website: { type: "text", label: "Website" },
    logo: { type: "text", label: "Logo" },
    establishedYear: { type: "integer", label: "Established", sortable: true },
    isActive: { type: "boolean", label: "Active", filterable: true },
    setupComplete: { type: "boolean", label: "Setup Complete" },
    subscriptionStatus: { type: "text", label: "Subscription", filterable: true },
    createdAt: { type: "timestamp", label: "Created", sortable: true },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin"],
    create: ["admin"],
    update: ["admin", "school-admin"],
    delete: ["admin"],
  },

  ui: {
    title: "School",
    titlePlural: "Schools",
    basePath: "/admin/schools",
    columns: [
      { key: "code", label: "Code", sortable: true },
      { key: "name", label: "Name", sortable: true, searchable: true },
      { key: "city", label: "City", sortable: true },
      { key: "type", label: "Type", filterable: true },
      { key: "subscriptionStatus", label: "Subscription", filterable: true },
      { key: "setupComplete", label: "Setup", type: "boolean" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },

  // Public endpoints (no auth required)
  public: {
    // Search schools by name (used in setup wizard)
    search: {
      method: "GET" as const,
      handler: async (params: any, request: Request) => {
        const { db } = await import("@/lib/db");
        const { schools } = await import("@/lib/db/schema");
        const { ilike, or, and, eq } = await import("drizzle-orm");
        const { successResponse } = await import("@/lib/api/response-helpers");

        const { q, city, type } = params;

        if (!q || q.length < 2) {
          return successResponse({ data: [] });
        }

        // Build search conditions
        const conditions = [
          eq(schools.isActive, true),
          ilike(schools.name, `%${q}%`)
        ];

        if (city) {
          conditions.push(eq(schools.city, city));
        }
        if (type) {
          conditions.push(eq(schools.type, type));
        }

        const results = await db
          .select({
            id: schools.id,
            name: schools.name,
            code: schools.code,
            city: schools.city,
            type: schools.type,
          })
          .from(schools)
          .where(and(...conditions))
          .limit(10);

        return successResponse({ data: results });
      },
    },

    // Validate school code (used in setup wizard)
    "validate-code": {
      method: "POST" as const,
      handler: async (data: any, request: Request) => {
        const { db } = await import("@/lib/db");
        const { schools } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const { successResponse, errorResponse } = await import("@/lib/api/response-helpers");

        const { schoolCode } = data;

        if (!schoolCode) {
          return errorResponse("schoolCode is required", 400);
        }

        const [school] = await db
          .select()
          .from(schools)
          .where(eq(schools.code, schoolCode))
          .limit(1);

        if (!school) {
          return errorResponse("Invalid school code", 404);
        }

        if (!school.isActive) {
          return errorResponse("School is not active", 403);
        }

        return successResponse({
          data: {
            id: school.id,
            name: school.name,
            code: school.code,
            city: school.city,
            type: school.type,
          },
        });
      },
    },

    // Look up school by code (used in various places)
    lookup: {
      method: "GET" as const,
      handler: async (params: any, request: Request) => {
        const { db } = await import("@/lib/db");
        const { schools } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const { successResponse, errorResponse } = await import("@/lib/api/response-helpers");

        const { code } = params;

        if (!code) {
          return errorResponse("code is required", 400);
        }

        const [school] = await db
          .select()
          .from(schools)
          .where(eq(schools.code, code))
          .limit(1);

        if (!school) {
          return errorResponse("School not found", 404);
        }

        return successResponse({
          data: {
            id: school.id,
            name: school.name,
            code: school.code,
            city: school.city,
            type: school.type,
          },
        });
      },
    },
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { schools } = await import("@/lib/db/schema");
      const { eq, desc, count } = await import("drizzle-orm");

      const { page = 1, limit = 20, city, type, subscriptionStatus, search } = params;
      const offset = (page - 1) * limit;

      const conditions = [eq(schools.isActive, true)];

      if (city) conditions.push(eq(schools.city, city));
      if (type) conditions.push(eq(schools.type, type));
      if (subscriptionStatus) conditions.push(eq(schools.subscriptionStatus, subscriptionStatus));

      const [dataResult, countResult] = await Promise.all([
        db
          .select()
          .from(schools)
          .where(conditions.length === 1 ? conditions[0] : await import("drizzle-orm").then(m => m.and(...conditions)))
          .orderBy(desc(schools.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(schools)
          .where(conditions.length === 1 ? conditions[0] : await import("drizzle-orm").then(m => m.and(...conditions))),
      ]);

      const { successResponse } = await import("@/lib/api/response-helpers");

      return successResponse({
        data: dataResult,
        pagination: {
          total: countResult[0]?.count || 0,
          page,
          limit,
          totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
        },
      });
    },

    get: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { schools } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .select()
        .from(schools)
        .where(eq(schools.id, id))
        .limit(1);

      if (result.length === 0) {
        return notFoundResponse("School");
      }

      return successResponse({ data: result[0] });
    },

    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { schools } = await import("@/lib/db/schema");
      const { createdResponse } = await import("@/lib/api/response-helpers");
      const { nanoid } = await import("nanoid");

      const schoolId = `sch-${nanoid()}`;

      const result = await db
        .insert(schools)
        .values({
          id: schoolId,
          name: data.name,
          code: data.code,
          type: data.type || "public",
          address: data.address || "TBD",
          city: data.city || "Thimphu",
          state: data.state || "Thimphu",
          country: data.country || "Bhutan",
          postalCode: data.postalCode || "00000",
          phone: data.phone || "0000000000",
          email: data.email || "school@example.com",
          website: data.website || "https://example.com",
          logo: data.logo || "",
          establishedYear: data.establishedYear || new Date().getFullYear(),
          accreditationStatus: data.accreditationStatus || "pending",
          maxStudents: data.maxStudents || 500,
          campusSize: data.campusSize || "Medium",
          facilities: data.facilities || [],
          board: data.board || "BCSE",
          principalName: data.principalName || "Not Assigned",
          principalEmail: data.principalEmail || "principal@example.com",
          principalPhone: data.principalPhone || "0000000000",
          counselorName: data.counselorName || "Not Assigned",
          counselorEmail: data.counselorEmail || "counselor@example.com",
          counselorPhone: data.counselorPhone || "0000000000",
          vicePrincipalName: data.vicePrincipalName || "Not Assigned",
          schoolType: data.schoolType || "public",
          level: data.level || "middle",
          contactEmail: data.contactEmail || data.email || "school@example.com",
          contactPhone: data.contactPhone || data.phone || "0000000000",
          isActive: true,
          subscriptionStatus: "pending_payment",
          setupComplete: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createdResponse({ data: result[0] });
    },

    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { schools } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { updatedResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(schools)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(schools.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("School");
      }

      return updatedResponse({ data: result[0] });
    },

    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { schools } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(schools)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schools.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("School");
      }

      return successResponse({ message: "School deleted successfully" });
    },
  },
});
