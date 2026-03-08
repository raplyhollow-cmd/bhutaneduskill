/**
 * Users Feature Definition
 *
 * Handles user accounts including platform admins.
 * Admin setup uses POST /api/resources/users with type='admin'
 */

import { defineFeature } from "@/lib/features/define-feature";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql, desc, and, count } from "drizzle-orm";

export const UsersFeature = defineFeature({
  name: "users",
  tableName: "users",

  schema: {
    id: {
      type: "text",
      required: true,
      primary: true,
      label: "ID",
    },
    name: {
      type: "text",
      required: true,
      label: "Name",
      sortable: true,
    },
    email: {
      type: "email",
      required: true,
      label: "Email",
      sortable: true,
    },
    type: {
      type: "select",
      required: true,
      label: "Type",
      options: [
        { value: "student", label: "Student" },
        { value: "teacher", label: "Teacher" },
        { value: "parent", label: "Parent" },
        { value: "school-admin", label: "School Admin" },
        { value: "counselor", label: "Counselor" },
        { value: "admin", label: "Platform Admin" },
        { value: "ministry", label: "Ministry" },
      ],
    },
    onboardingStatus: {
      type: "select",
      label: "Onboarding Status",
      options: [
        { value: "restricted", label: "Restricted" },
        { value: "pending_approval", label: "Pending Approval" },
        { value: "completed", label: "Completed" },
      ],
    },
    createdAt: {
      type: "timestamp",
      label: "Created At",
      sortable: true,
    },
    updatedAt: {
      type: "timestamp",
      label: "Updated At",
      sortable: true,
    },
  },

  permissions: {
    read: ["school-admin", "teacher", "ministry", "admin"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Users",
    titlePlural: "Users",
    basePath: "/admin/users",
    icon: "FileText",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "email", label: "Email", sortable: true },
      { key: "type", label: "Type", sortable: true },
      { key: "createdAt", label: "Created", sortable: true },
    ],
  },

  // Custom handlers for role-based filtering
  customHandlers: {
    // Custom list handler that handles role filtering
    list: async (params: any, auth: any) => {
      const { page = 1, limit = 20, filters = {}, sortBy, sortOrder, role } = params;
      const { user } = auth;
      const offset = (page - 1) * limit;

      const { successResponse } = await import("@/lib/api/response-helpers");

      // Build where conditions
      const conditions = [];

      // Add school filter if user has schoolId
      if (user?.schoolId) {
        conditions.push(eq(users.schoolId, user.schoolId));
      }

      // Add isActive filter
      if (users.isActive) {
        conditions.push(eq(sql`is_active`, true));
      }

      // Add role filter (frontend sends ?role=teacher)
      if (role) {
        conditions.push(eq(users.type, role));
      }

      // Execute query
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [dataResult, countResult] = await Promise.all([
        db
          .select()
          .from(users)
          .where(whereClause)
          .orderBy(sortBy ? users[sortBy] : desc(users.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(users)
          .where(whereClause),
      ]);

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
  },

  // Actions (non-CRUD operations)
  actions: {
    // Set user role (used in setup wizard)
    "set-role": {
      handler: async (context) => {
        const { NextResponse } = await import("next/server");
        const { logger } = await import("@/lib/logger");

        const { db, params, auth } = context;
        const { user } = auth;
        const userType = params.userType;

        if (!userType || !["student", "teacher", "parent", "counselor", "school-admin", "admin", "ministry"].includes(userType)) {
          return { error: "Invalid user type", status: 400 };
        }

        // Update user record if exists
        if (user?.userId) {
          const { users: usersTable } = await import("@/lib/db/schema");
          const { eq } = await import("drizzle-orm");

          await db
            .update(usersTable)
            .set({
              type: userType,
              onboardingStatus: "completed",
              updatedAt: new Date(),
            })
            .where(eq(usersTable.clerkUserId, user.userId));
        }

        logger.info("User role set", { userType, userId: user?.userId });

        // Return success with cookie setting instructions
        // Note: Cookie setting must be done by the API route wrapper
        return {
          success: true,
          userType,
          setCookie: {
            name: "userType",
            value: userType,
            options: {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 1 week
            },
          },
        };
      },
      allowedRoles: ["student", "teacher", "parent", "counselor", "school-admin", "admin", "ministry"] as any[],
    },

    // Get current user's role
    "get-role": {
      handler: async (context) => {
        const { auth } = context;
        const { user } = auth;

        if (!user) {
          return { error: "Unauthorized", status: 401 };
        }

        return {
          success: true,
          data: {
            userType: user.type,
            userId: user.id,
            name: user.name,
            email: user.email,
            onboardingStatus: user.onboardingStatus,
            onboardingComplete: user.onboardingComplete,
            schoolId: user.schoolId,
          },
        };
      },
      allowedRoles: undefined, // Allow all authenticated users
    },
  },

  // Webhooks (external service callbacks)
  webhooks: {
    // Clerk webhook for user synchronization
    // Note: Primary implementation at /api/webhooks/clerk
    // This definition documents the webhook for the unified system
    clerk: {
      source: "clerk",
      verifySignature: true,
      secretHeader: "svix-signature",
      handler: async (data: any, request: Request) => {
        const { NextResponse } = await import("next/server");
        const { logger } = await import("@/lib/logger");
        const { nanoid } = await import("nanoid");
        const { db: dbImport } = await import("@/lib/db");
        const { users: usersTable } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");

        const eventType = data.type;
        const eventData = data.data;

        logger.info("Clerk webhook received", { eventType });

        switch (eventType) {
          case "user.created": {
            const clerkUserId = eventData.id;
            const firstName = eventData.first_name || "";
            const lastName = eventData.last_name || "";
            const email = eventData.email_addresses?.[0]?.email_address || "";
            const imageUrl = eventData.profile_image_url || null;

            // Check if user exists
            const existing = await dbImport
              .select()
              .from(usersTable)
              .where(eq(usersTable.clerkUserId, clerkUserId))
              .limit(1);

            if (existing.length > 0) {
              return { success: true, message: "User already exists" };
            }

            // Create placeholder user
            const userId = `user-${nanoid()}`;
            const name = `${firstName} ${lastName}`.trim() || email.split("@")[0] || "User";

            await dbImport.insert(usersTable).values({
              id: userId,
              clerkUserId,
              type: "pending",
              role: "pending",
              name,
              firstName,
              lastName,
              email,
              phone: "",
              grade: 0,
              section: null,
              country: "Bhutan",
              enrollmentDate: new Date().toISOString(),
              profileImage: imageUrl,
              isActive: true,
              emailVerified: eventData.email_addresses?.[0]?.verification?.status === "verified",
              onboardingComplete: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            return { success: true, userId, message: "User created" };
          }

          case "user.updated": {
            const clerkUserId = eventData.id;

            const existing = await dbImport
              .select()
              .from(usersTable)
              .where(eq(usersTable.clerkUserId, clerkUserId))
              .limit(1);

            if (existing.length === 0) {
              return { success: false, message: "User not found" };
            }

            const firstName = eventData.first_name || existing[0].firstName;
            const lastName = eventData.last_name || existing[0].lastName;
            const email = eventData.email_addresses?.[0]?.email_address || existing[0].email;
            const imageUrl = eventData.profile_image_url;
            const isEmailVerified = eventData.email_addresses?.[0]?.verification?.status === "verified";

            const updates: any = {
              firstName,
              lastName,
              name: `${firstName} ${lastName}`.trim(),
              email,
              emailVerified: isEmailVerified,
              updatedAt: new Date(),
            };

            if (imageUrl) {
              updates.profileImage = imageUrl;
            }

            await dbImport
              .update(usersTable)
              .set(updates)
              .where(eq(usersTable.clerkUserId, clerkUserId));

            return { success: true, message: "User updated" };
          }

          case "user.deleted": {
            const clerkUserId = eventData.id;

            await dbImport
              .update(usersTable)
              .set({ isActive: false, updatedAt: new Date() })
              .where(eq(usersTable.clerkUserId, clerkUserId));

            return { success: true, message: "User soft deleted" };
          }

          default:
            return { success: true, message: "Event acknowledged" };
        }
      },
    },
  },
});
