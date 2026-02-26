/**
 * PARENT CONTACTS API
 *
 * Allows parents to:
 * - Fetch teachers and school staff they can message
 * - Get contact information for their children's teachers
 * - Search for specific contacts
 *
 * SECURITY: FERPA COMPLIANCE
 * - Uses parent_to_student join table for verification
 * - Only returns contacts for verified children's schools
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, classes, enrollments, subjects, parents, parentToStudent } from "@/lib/db/schema";
import { eq, or, like, and, inArray } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

interface TeacherContact {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  type: string;
  email: string | null;
  profileImage: string | null;
  subject?: string;
  phone?: string;
  schoolId?: string | null;
}

// ============================================================================
// GET - Fetch contacts (teachers, admins) for parent
// ============================================================================

export const GET = createApiRoute({
  allowedRoles: ['parent'],
  handler: async (req: NextRequest, auth) => {
    const { userId } = auth;
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type"); // "teacher", "admin", "counselor", or null for all

    logger.info("Fetching parent contacts", { userId, search, type });

    // FERPA COMPLIANCE: Get parent record first
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      logger.warn("No parent record found for user", { userId });
      return successResponse({ contacts: [] });
    }

    // FERPA COMPLIANCE: Get verified children via parent_to_student join table
    const relationships = await db
      .select()
      .from(parentToStudent)
      .where(eq(parentToStudent.parentId, parentRecord.id));

    if (relationships.length === 0) {
      return successResponse({ contacts: [] });
    }

    const studentIds = relationships.map((r) => r.studentId);

    // Get parent's verified children to find their teachers
    const children = await db
      .select({
        id: users.id,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(and(
        eq(users.type, "student"),
        inArray(users.id, studentIds)
      ));

    if (children.length === 0) {
      return successResponse({ contacts: [] });
    }

    // Get unique school IDs from children
    const schoolIds = Array.from(new Set(children.map((c) => c.schoolId).filter(Boolean) as string[]));

    // Build query conditions
    const conditions = [
      // Must be a teacher, admin, or counselor
      or(
        eq(users.type, "teacher"),
        eq(users.type, "admin"),
        eq(users.type, "school-admin"),
        eq(users.type, "counselor")
      )!,
    ];

    // Filter by school if children have schools
    if (schoolIds.length > 0) {
      conditions.push(inArray(users.schoolId, schoolIds));
    }

    // Filter by type if specified
    if (type && ["teacher", "admin", "school-admin", "counselor"].includes(type)) {
      conditions.push(eq(users.type, type));
    }

    // Add search condition if provided
    if (search.length >= 2) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(users.name, searchTerm),
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm),
          like(users.email as any, searchTerm)
        )!
      );
    }

    // Fetch contacts
    const contacts = await db
      .select({
        id: users.id,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        type: users.type,
        email: users.email,
        profileImage: users.profileImage,
        schoolId: users.schoolId,
        subjects: users.subjects,
      })
      .from(users)
      .where(and(...conditions))
      .limit(50);

    // Format contacts response
    const formattedContacts: TeacherContact[] = contacts.map((contact) => ({
      id: contact.id,
      name: contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      type: contact.type,
      email: contact.email,
      profileImage: contact.profileImage,
      subject: contact.subjects ? (contact.subjects as string[])[0] : undefined,
      schoolId: contact.schoolId,
    }));

    logger.info("Contacts fetched successfully", { userId, count: formattedContacts.length });

    return successResponse({ contacts: formattedContacts });
  }
});