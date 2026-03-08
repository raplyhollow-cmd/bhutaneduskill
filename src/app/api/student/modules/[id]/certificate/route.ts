/**
 * STUDENT MODULE CERTIFICATE API
 *
 * GET /api/student/modules/[id]/certificate
 * Returns certificate for a completed module
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, notFoundResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;
    const { id } = await context.params;

    // Check if user has completed this module
    // For demo, we'll return a mock certificate
    // In production, this would check the user's module progress

    return successResponse({
      success: true,
      certificate: {
        id: `cert_${userId}_${id}`,
        moduleId: id,
        studentName: "Student Name", // Would come from user profile
        moduleName: "Digital Literacy Fundamentals",
        completionDate: new Date().toISOString(),
        certificateUrl: `/certificates/${id}/${userId}.pdf`,
        verificationCode: `${id.substring(0, 4)}${userId.substring(0, 4)}`,
      },
    });
  },
  ['student']
);
