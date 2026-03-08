/**
 * TRANSPORT ALLOCATIONS FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const TransportAllocationFeature = defineFeature({
  name: "transport-allocations",
  tableName: "transport_allocations",

  schema: {
    id: { type: "text", required: true, primary: true },
    studentId: { type: "reference", reference: { table: "users", onDelete: "cascade" }, required: true, label: "Student" },
    transportId: { type: "reference", reference: { table: "transport", onDelete: "cascade" }, required: true, label: "Vehicle" },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    pickupPoint: { type: "text", label: "Pickup Point" },
    dropPoint: { type: "text", label: "Drop Point" },
    pickupTime: { type: "text", label: "Pickup Time" },
    shift: { type: "enum", options: ["morning", "evening", "both"], label: "Shift", filterable: true },
    isActive: { type: "boolean", defaultValue: true, filterable: true },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["school-admin", "teacher", "student", "parent"],
    create: ["school-admin"],
    update: ["school-admin"],
    delete: ["school-admin"],
  },

  ui: {
    title: "Transport Allocation",
    titlePlural: "Transport Allocations",
    basePath: "/school-admin/transport-allocations",
    columns: [
      { key: "studentName", label: "Student" },
      { key: "vehicleNumber", label: "Vehicle" },
      { key: "pickupPoint", label: "Pickup Point" },
      { key: "dropPoint", label: "Drop Point" },
      { key: "shift", label: "Shift", filterable: true },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { transportAllocations, users, transportRoutes, vehicles } = await import("@/lib/db/schema");
      const { eq, and, desc, sql } = await import("drizzle-orm");

      const { page = "1", limit = "20", studentId, shift } = params;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const conditions = [];
      if (auth.user?.schoolId) conditions.push(eq(transportAllocations.schoolId, auth.user.schoolId));
      if (studentId) conditions.push(eq(transportAllocations.studentId, studentId));
      if (shift) conditions.push(eq((transportAllocations as any).shift, shift));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select({
          id: transportAllocations.id,
          studentId: transportAllocations.studentId,
          transportId: (transportAllocations as any).transportId,
          pickupPoint: transportAllocations.pickupPoint,
          dropPoint: transportAllocations.dropPoint,
          pickupTime: transportAllocations.pickupTime,
          shift: (transportAllocations as any).shift,
          isActive: transportAllocations.isActive,
          studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          vehicleNumber: (vehicles as any).vehicleNumber,
        })
        .from(transportAllocations)
        .innerJoin(users, eq(transportAllocations.studentId, users.id))
        .innerJoin(vehicles, eq((transportAllocations as any).vehicleId, vehicles.id))
        .where(whereClause)
        .orderBy(desc(transportAllocations.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(transportAllocations)
        .where(whereClause);

      return {
        success: true,
        data: { data, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) } },
      };
    },
  },
});
