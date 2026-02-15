import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// POST /api/reports/generate - Generate government report
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Check RBAC permission for generating reports
    const permCheck = await requirePermission(userId, "reports.generate");
    if (permCheck) return permCheck;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Reports feature is secondary - return placeholder for now
    // TODO: Implement proper reports schema integration
    return NextResponse.json({
      report: {
        id: `rpt-${Date.now()}`,
        schoolId: currentUser.schoolId,
        reportName: "Sample Report",
        status: "draft",
        generatedAt: new Date().toISOString(),
      },
      message: "Report generation feature coming soon"
    }, { status: 201 });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

// ============================================================================
// GET /api/reports/generate - Get available report templates
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Check RBAC permission for viewing reports
    const permCheck = await requirePermission(userId, "reports.view");
    if (permCheck) return permCheck;

    return NextResponse.json({
      templates: {
        "Ministry of Education": [
          { id: "STU_ATTEND", name: "Student Attendance Report", code: "STU_ATTEND", agency: "Ministry of Education" },
          { id: "STU_PERF", name: "Student Performance Report", code: "STU_PERF", agency: "Ministry of Education" },
        ],
        "BCSEA": [
          { id: "INFRA", name: "Infrastructure Report", code: "INFRA", agency: "BCSEA" },
        ],
      },
      message: "Full report templates coming soon"
    });
  } catch (error) {
    console.error("Report templates fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
