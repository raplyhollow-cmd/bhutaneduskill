/**
 * SCHOOL ADMIN SETUP COMPLETE API
 *
 * POST /api/school-admin/setup/complete - Complete school setup
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools, departments, classes, subjects } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api/response-helpers";

// POST /api/school-admin/setup/complete - Complete school setup
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    const body = await request.json();
    const { schoolId, data } = body;

    if (!schoolId || !user?.schoolId || user.schoolId !== schoolId) {
      return forbiddenResponse("Invalid school");
    }

    // Update school profile
    await db
      .update(schools)
      .set({
        name: data.schoolName,
        logo: data.schoolLogo || schools.logo,
        facilities: data.facilities ? JSON.parse(data.facilities) : schools.facilities,
        principalName: data.principalName || schools.principalName,
        principalEmail: data.principalEmail || schools.principalEmail,
        principalPhone: data.principalPhone || schools.principalPhone,
        setupComplete: true,
        setupCompletedAt: new Date(),
        subscriptionStatus: "active",
        activatedAt: new Date(),
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId));

    // Create departments
    for (const dept of data.departments || []) {
      const deptId = `dept_${nanoid()}`;
      await db.insert(departments).values({
        id: deptId,
        schoolId,
        name: dept.name,
        code: dept.code,
        description: dept.description || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create default subjects for each department
      const defaultSubjects = getDefaultSubjects(dept.name);
      for (const subject of defaultSubjects) {
        await db.insert(subjects).values({
          id: `subj_${nanoid()}`,
          schoolId,
          departmentId: deptId,
          name: subject.name,
          code: subject.code,
          type: subject.type || "core",
          subjectType: subject.type || "core",
          description: `${subject.name} - ${dept.name} Department`,
          applicableGrades: subject.grades || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Create classes
    for (const cls of data.classes || []) {
      const sections = cls.sections.split(",").map((s: string) => s.trim().toUpperCase());
      for (const section of sections) {
        const classId = `class_${nanoid()}`;
        await db.insert(classes).values({
          id: classId,
          schoolId,
          name: `Class ${cls.grade}${section}`,
          grade: parseInt(cls.grade) || 0,
          section,
          roomNumber: "TBD",
          capacity: 40,
          homeroomTeacherName: "To be assigned",
          classTeacherName: "To be assigned",
          academicYear: data.academicYear || new Date().getFullYear().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    logger.info("School setup completed", {
      schoolId,
      userId,
      departmentsCount: data.departments?.length || 0,
      classesCount: data.classes?.length || 0,
    });

    return successResponse({
      success: true,
      message: "School setup completed successfully",
    });
  },
  ['school-admin']
);

// Helper function to get default subjects for a department
function getDefaultSubjects(departmentName: string): Array<{ name: string; code: string; type?: string; grades?: string }> {
  const subjects: Record<string, Array<{ name: string; code: string; type?: string; grades?: string }>> = {
    Mathematics: [
      { name: "Mathematics", code: "MATH" },
      { name: "Additional Mathematics", code: "ADDMATH", type: "elective" },
    ],
    Science: [
      { name: "Physics", code: "PHY" },
      { name: "Chemistry", code: "CHEM" },
      { name: "Biology", code: "BIO" },
    ],
    Languages: [
      { name: "Dzongkha", code: "DZO" },
      { name: "English", code: "ENG" },
    ],
    "Social Studies": [
      { name: "History", code: "HIST" },
      { name: "Geography", code: "GEOG" },
      { name: "Economics", code: "ECON", type: "elective" },
    ],
    IT: [
      { name: "Computer Science", code: "CS" },
      { name: "Information Technology", code: "IT" },
    ],
    "IT/Computer Science": [
      { name: "Computer Science", code: "CS" },
      { name: "Information Technology", code: "IT" },
    ],
    "Arts & Music": [
      { name: "Art", code: "ART" },
      { name: "Music", code: "MUSIC" },
    ],
    "Physical Education": [
      { name: "Physical Education", code: "PE" },
      { name: "Health Education", code: "HE" },
    ],
  };

  return subjects[departmentName] || [{ name: departmentName, code: departmentName.substring(0, 3).toUpperCase() }];
}
