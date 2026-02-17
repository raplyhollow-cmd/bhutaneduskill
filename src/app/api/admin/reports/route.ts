import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, schools, assessmentSubmissions, careerMatches } from "@/lib/db/schema";
import { count, eq, and, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// GET /api/admin/reports - Get report templates and recent reports
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");

    // Fetch real statistics for reports
    const [
      totalSchools,
      totalStudents,
      totalTeachers,
      totalCounselors,
      recentSubmissions,
    ] = await Promise.all([
      db.select({ count: count() }).from(schools),
      db.select({ count: count() }).from(users).where(eq(users.type, "student")),
      db.select({ count: count() }).from(users).where(eq(users.type, "teacher")),
      db.select({ count: count() }).from(users).where(eq(users.type, "counselor")),
      db.query.assessmentSubmissions.findMany({
        orderBy: [desc(assessmentSubmissions.createdAt)],
        limit: 10,
      }),
    ]);

    const stats = {
      totalSchools: totalSchools[0]?.count || 0,
      totalStudents: totalStudents[0]?.count || 0,
      totalTeachers: totalTeachers[0]?.count || 0,
      totalCounselors: totalCounselors[0]?.count || 0,
      recentSubmissions: recentSubmissions.length,
    };

    logger.info("Reports data fetched", { userId, stats });

    return NextResponse.json({
      success: true,
      data: {
        stats,
        reportTemplates: [
          {
            id: "school-performance",
            name: "School Performance Report",
            description: "Comprehensive overview of all school metrics, enrollment, and assessment completion rates.",
            category: "Schools",
            schedule: "monthly",
            available: true,
          },
          {
            id: "user-engagement",
            name: "User Engagement Report",
            description: "Student, teacher, and parent activity metrics including login frequency and feature usage.",
            category: "Users",
            schedule: "weekly",
            available: true,
          },
          {
            id: "assessment-summary",
            name: "Assessment Summary Report",
            description: "Career assessment completion rates, result distributions, and trend analysis.",
            category: "Assessments",
            schedule: "monthly",
            available: true,
          },
          {
            id: "career-interests",
            name: "Career Interests Analysis",
            description: "Popular career choices by grade, region, and demographic breakdown.",
            category: "Analytics",
            schedule: "monthly",
            available: true,
          },
          {
            id: "revenue-report",
            name: "Revenue and Subscription Report",
            description: "Monthly recurring revenue, payment status, and subscription health metrics.",
            category: "Finance",
            schedule: "monthly",
            available: true,
          },
          {
            id: "platform-usage",
            name: "Platform Usage Statistics",
            description: "Feature adoption, page views, and user journey analytics.",
            category: "Analytics",
            schedule: "weekly",
            available: true,
          },
        ],
        recentReports: [],
      }
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/reports", method: "GET", userId });
    return NextResponse.json(
      { error: "Failed to fetch reports data", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// POST /api/admin/reports - Generate a report
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {
    const body = await request.json();
    const { reportType, format = "json" } = body;

    // Generate report based on type
    let reportData: any = {};

    switch (reportType) {
      case "school-performance":
        const schools = await db.query.schools.findMany({
          with: {
            // @ts-ignore - Drizzle relation
            tenants: true,
          },
        });

        // Get student counts per school
        const schoolStats = await Promise.all(
          schools.map(async (school) => {
            const [studentCount] = await db
              .select({ count: count() })
              .from(users)
              .where(and(eq(users.schoolId, school.id), eq(users.type, "student")));

            const [teacherCount] = await db
              .select({ count: count() })
              .from(users)
              .where(and(eq(users.schoolId, school.id), eq(users.type, "teacher")));

            return {
              id: school.id,
              name: school.name,
              code: school.code,
              schoolType: school.schoolType,
              location: (school as any).location || school.city || school.address || "N/A",
              students: studentCount?.count || 0,
              teachers: teacherCount?.count || 0,
            };
          })
        );

        reportData = {
          type: "school-performance",
          title: "School Performance Report",
          generatedAt: new Date().toISOString(),
          generatedBy: userId,
          summary: {
            totalSchools: schools.length,
            totalStudents: schoolStats.reduce((sum, s) => sum + s.students, 0),
            totalTeachers: schoolStats.reduce((sum, s) => sum + s.teachers, 0),
          },
          schools: schoolStats,
        };
        break;

      case "user-engagement":
        const allUsers = await db.query.users.findMany({
          orderBy: [desc(users.lastLogin)],
          limit: 100,
        });

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const activeUsers = allUsers.filter(u => u.lastLogin && new Date(u.lastLogin) > thirtyDaysAgo);

        reportData = {
          type: "user-engagement",
          title: "User Engagement Report",
          generatedAt: new Date().toISOString(),
          generatedBy: userId,
          summary: {
            totalUsers: allUsers.length,
            activeUsers: activeUsers.length,
            activeRate: allUsers.length > 0 ? ((activeUsers.length / allUsers.length) * 100).toFixed(1) : 0,
          },
          usersByType: {
            students: allUsers.filter(u => u.type === "student").length,
            teachers: allUsers.filter(u => u.type === "teacher").length,
            counselors: allUsers.filter(u => u.type === "counselor").length,
            parents: allUsers.filter(u => u.type === "parent").length,
            schoolAdmins: allUsers.filter(u => u.type === "school-admin").length,
          },
        };
        break;

      case "assessment-summary":
        const submissions = await db.query.assessmentSubmissions.findMany({
          with: {
            // @ts-ignore - Drizzle relation
            user: true,
          },
          orderBy: [desc(assessmentSubmissions.createdAt)],
          limit: 1000,
        });

        const thirtyDaysAgo2 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentSubmissions = submissions.filter(
          s => s.createdAt && new Date(s.createdAt) > thirtyDaysAgo2
        );

        reportData = {
          type: "assessment-summary",
          title: "Assessment Summary Report",
          generatedAt: new Date().toISOString(),
          generatedBy: userId,
          summary: {
            totalAssessments: submissions.length,
            recentAssessments: recentSubmissions.length,
            completionRate: 0, // Calculate based on assigned vs completed
          },
        };
        break;

      case "career-interests":
        const careerMatches = await db.query.careerMatches.findMany({
          orderBy: [desc(assessmentSubmissions.createdAt)],
          limit: 500,
        });

        // Aggregate by career
        const careerCounts: Record<string, number> = {};
        careerMatches.forEach(match => {
          if (match.careerTitle) {
            careerCounts[match.careerTitle] = (careerCounts[match.careerTitle] || 0) + 1;
          }
        });

        const topCareers = Object.entries(careerCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 20)
          .map(([career, count]) => ({ career, count }));

        reportData = {
          type: "career-interests",
          title: "Career Interests Analysis",
          generatedAt: new Date().toISOString(),
          generatedBy: userId,
          summary: {
            totalMatches: careerMatches.length,
            uniqueCareers: Object.keys(careerCounts).length,
          },
          topCareers,
        };
        break;

      case "revenue-report":
        // Revenue data - for now return summary structure
        reportData = {
          type: "revenue-report",
          title: "Revenue and Subscription Report",
          generatedAt: new Date().toISOString(),
          generatedBy: userId,
          summary: {
            totalRevenue: 0,
            activeSubscriptions: 0,
            pendingPayments: 0,
          },
        };
        break;

      case "platform-usage":
        reportData = {
          type: "platform-usage",
          title: "Platform Usage Statistics",
          generatedAt: new Date().toISOString(),
          generatedBy: userId,
          summary: {
            totalUsers: 0,
            activeSessions: 0,
            pageViews: 0,
          },
        };
        break;

      default:
        return NextResponse.json(
          { error: "Unknown report type", status: 400 } satisfies ApiErrorResponse,
          { status: 400 }
        );
    }

    logger.info("Report generated", { userId, reportType });

    return NextResponse.json({
      success: true,
      data: reportData,
      message: "Report generated successfully"
    }, { status: 201 });
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/reports", method: "POST", userId });
    return NextResponse.json(
      { error: "Failed to generate report", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
