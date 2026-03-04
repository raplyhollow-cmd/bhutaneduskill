import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { departments, users, subjects } from "@/lib/db/schema";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq, and, desc, like, count } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/school-admin/departments - List departments (school-scoped)
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const { user, userId } = getAuth(request);

    // Check departments.manage permission
    const permCheck = await requirePermission(userId, "departments.manage");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Filter by user's school (except platform admins)
    const whereConditions = user.type === "admin"
      ? undefined
      : eq(departments.schoolId, user.schoolId || "");

    // Add search filter
    let whereClause = whereConditions;
    if (search) {
      whereClause = whereConditions
        ? and(
            whereConditions,
            like(departments.name, `%${search}%`)
          )
        : like(departments.name, `%${search}%`);
    }

    // Add inactive filter
    if (!includeInactive && whereClause) {
      whereClause = and(whereClause, eq(departments.isActive, true));
    } else if (!includeInactive) {
      whereClause = eq(departments.isActive, true);
    }

    // Get departments with subject counts
    const departmentList = await db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
        description: departments.description,
        isActive: departments.isActive,
        headOfDepartment: departments.headOfDepartment,
        schoolId: departments.schoolId,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      })
      .from(departments)
      .where(whereClause)
      .orderBy(desc(departments.createdAt));

    // Get subject counts for each department
    const departmentsWithCounts = await Promise.all(
      departmentList.map(async (dept) => {
        const subjectCount = await db
          .select({ count: count() })
          .from(subjects)
          .where(eq(subjects.departmentId, dept.id));

        // Get HOD details
        let hodDetails = null;
        if (dept.headOfDepartment) {
          const hodUsers = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              type: users.type,
            })
            .from(users)
            .where(eq(users.id, dept.headOfDepartment))
            .limit(1);
          hodDetails = hodUsers[0] || null;
        }

        return {
          ...dept,
          subjectCount: subjectCount[0]?.count || 0,
          headOfDepartmentDetails: hodDetails,
        };
      })
    );

    logger.info("Departments listed", { userId, schoolId: user.schoolId });

    return successResponse({ departments: departmentsWithCounts });
  },
  ["school-admin", "admin", "teacher"]
);

// POST /api/school-admin/departments - Create department
export const POST = createApiRoute(
  async (request: NextRequest) => {
    const { user, userId } = getAuth(request);

    // Check departments.manage permission
    const permCheck = await requirePermission(userId, "departments.manage");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { name, code, description, headOfDepartment } = body;

    if (!name || !code) {
      return badRequestResponse("Name and code are required");
    }

    // Check if department code already exists in this school
    const schoolId = user.type === "admin" ? body.schoolId : user.schoolId;
    if (!schoolId) {
      return badRequestResponse("School ID is required");
    }

    const existing = await db
      .select()
      .from(departments)
      .where(and(eq(departments.code, code), eq(departments.schoolId, schoolId)))
      .limit(1);

    if (existing.length > 0) {
      return badRequestResponse("Department code already exists in this school");
    }

    const departmentId = `dept_${nanoid()}`;

    const [newDepartment] = await db
      .insert(departments)
      .values({
        id: departmentId,
        schoolId,
        name,
        code,
        description: description || null,
        headOfDepartment: headOfDepartment || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Department created", { userId, departmentId, name, schoolId });

    return successResponse({ department: newDepartment });
  },
  ["school-admin", "admin"]
);
