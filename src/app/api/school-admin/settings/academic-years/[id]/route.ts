/**
 * DELETE ACADEMIC YEAR API
 *
 * DELETE /api/school-admin/settings/academic-years/[id]
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { academicYears } from "@/lib/db/schema";
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

      // Check if academic year belongs to this school
      const [academicYear] = await db
        .select()
        .from(academicYears)
        .where(and(eq(academicYears.id, id), eq(academicYears.schoolId, user.schoolId)))
        .limit(1);

      if (!academicYear) {
        return notFoundResponse("Academic year");
      }

      // Delete academic year
      await db.delete(academicYears).where(eq(academicYears.id, id));

      return successResponse({ message: "Academic year deleted successfully" });
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Failed to delete academic year");
    }
  },
  ["school-admin"]
);
