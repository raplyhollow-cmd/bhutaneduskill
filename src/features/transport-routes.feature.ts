/**
 * TRANSPORT ROUTES FEATURE
 *
 * Define vehicle routes for transportation
 */

import { defineFeature } from "@/lib/features/define-feature";

export const TransportRouteFeature = defineFeature({
  name: "transport-routes",
  tableName: "transport_routes",

  schema: {
    id: { type: "text", required: true },
    name: { type: "text", required: true },
    routeNumber: { type: "text", required: true },
    vehicleId: { type: "text", required: true, reference: "transport" },
    driverId: { type: "text", required: true, reference: "users" },
    route: { type: "json", required: true }, // Array of {stopId, stopName, order, time}
    capacity: { type: "integer", required: true },
    currentLoad: { type: "integer" },
    startTime: { type: "text" }, // HH:MM
    endTime: { type: "text" }, // HH:MM
    frequency: { type: "select", options: ["daily", "weekdays", "weekend"] },
    status: { type: "select", options: ["active", "inactive", "maintenance"] },
    schoolId: { type: "text", reference: "schools" },
    isActive: { type: "boolean" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher", "student", "parent"],
    create: ["admin", "school-admin"],
    update: ["admin", "school-admin"],
    delete: ["admin"],
  },

  ui: {
    title: "Transport Route",
    titlePlural: "Transport Routes",
    basePath: "/transport/routes",
    columns: [
      { key: "routeNumber", label: "Route" },
      { key: "name", label: "Name" },
      { key: "vehicleId", label: "Vehicle" },
      { key: "driverId", label: "Driver" },
      { key: "status", label: "Status" },
    ],
  },

  actions: {
    getStops: {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { transportRoutes } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

        if (!id) {
          return { error: "Route ID is required", status: 400 };
        }

        const [route] = await db
          .select()
          .from(transportRoutes)
          .where(eq(transportRoutes.id, id))
          .limit(1);

        if (!route) {
          return notFoundResponse("Transport Route");
        }

        return successResponse({
          data: {
            id: route.id,
            name: route.name,
            route: route.route,
            capacity: route.capacity,
            currentLoad: route.currentLoad,
          },
        });
      },
      allowedRoles: ["admin", "school-admin", "teacher", "student", "parent"] as any[],
    },

    updateLoad: {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { transportRoutes } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

        if (!id) {
          return { error: "Route ID is required", status: 400 };
        }

        const { currentLoad } = data;

        const [updated] = await db
          .update(transportRoutes)
          .set({
            currentLoad,
            updatedAt: new Date(),
          })
          .where(eq(transportRoutes.id, id))
          .returning();

        if (!updated.length) {
          return notFoundResponse("Transport Route");
        }

        return successResponse({ data: updated[0] });
      },
      allowedRoles: ["admin", "school-admin"] as any[],
    },
  },
});
