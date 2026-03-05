/**
 * Users Feature Definition
 *
 * Handles user accounts including platform admins.
 * Admin setup uses POST /api/resources/users with type='admin'
 */

import { defineFeature } from "@/lib/features/define-feature";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

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

  // Actions (non-CRUD operations)
  actions: {
    // Set user role (used in setup wizard)
    "set-role": {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { NextResponse } = await import("next/server");
        const { logger } = await import("@/lib/logger");

        const { user } = auth;
        const userType = data.userType;

        if (!userType || !["student", "teacher", "parent", "counselor", "school-admin", "admin", "ministry"].includes(userType)) {
          return { error: "Invalid user type", status: 400 };
        }

        // Update user record if exists
        if (user?.userId) {
          const { db } = await import("@/lib/db");
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
      handler: async (id: string | undefined, data: any, auth: any) => {
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
            schoolId: user.schoolId,
          },
        };
      },
      allowedRoles: undefined, // Allow all authenticated users
    },
  },

  api: {
    async list(params: any, auth: any) {
      const { page = "1", limit = "10", search } = params;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let where = {};
      if (search) {
        where = sql`name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`}`;
      }

      const [items, total] = await Promise.all([
        db.select().from(users).where(where).limit(parseInt(limit)).offset(offset),
        db.select({ count: sql<number>`count(*)::int` }).from(users).where(where)
      ]);

      return { items, total: total[0]?.count || 0 };
    },

    async get(id: string, auth: any) {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    },

    async create(data: any, auth: any) {
      const { user } = auth;

      // For admin self-setup, allow creating/updating their own record
      const [newUser] = await db
        .insert(users)
        .values({
          id: data.id || `user-${Date.now()}`,
          clerkUserId: data.clerkUserId || user?.userId,
          email: data.email,
          name: data.name,
          type: data.type || "student",
          onboardingStatus: data.onboardingStatus || "restricted",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return newUser;
    },

    async update(id: string, data: any, auth: any) {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        throw new Error("User not found");
      }
      return updatedUser;
    },

    async delete(id: string, auth: any) {
      const [deletedUser] = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();

      if (!deletedUser) {
        throw new Error("User not found");
      }
      return deletedUser;
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
