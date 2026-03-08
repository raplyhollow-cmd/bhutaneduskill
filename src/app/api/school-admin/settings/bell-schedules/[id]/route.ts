/**
 * DELETE BELL SCHEDULE API
 *
 * DELETE /api/school-admin/settings/bell-schedules/[id]
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { bellSchedules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response-helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const DELETE = createApiRoute(
  async (req, auth, context) => {
    const userId = auth?.userId || "";
    const user = auth?.user || { schoolId: "" };

    if (!user.schoolId) {
      return errorResponse("No school associated with your account", 400);
    }

    try {
      const params = await context?.params || {};
      const id = params && typeof params === "object" && "id" in params ? (params as { id: string }).id : "";

      if (!id) {
        return badRequestResponse("ID is required");
      }

      // Check if bell schedule belongs to this school
      const [bellSchedule] = await db
        .select()
        .from(bellSchedules)
        .where(and(eq(bellSchedules.id, id), eq(bellSchedules.schoolId, user.schoolId)))
        .limit(1);

      if (!bellSchedule) {
        return notFoundResponse("Bell schedule");
      }

      // Delete bell schedule
      await db.delete(bellSchedules).where(eq(bellSchedules.id, id));

      return successResponse({ message: "Bell schedule deleted successfully" });
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Failed to delete bell schedule");
    }
  },
  ["school-admin"]
);
