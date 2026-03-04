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
});
