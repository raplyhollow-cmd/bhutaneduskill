/**
 * PARENT CONTACTS API
 *
 * Allows parents to:
 * - Fetch teachers and school staff they can message
 * - Get contact information for their children's teachers
 * - Search for specific contacts
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, classes, enrollments, subjects } from "@/lib/db/schema";
import { eq, or, like, and, inArray } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

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

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["parent"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type"); // "teacher", "admin", "counselor", or null for all

    logger.info("Fetching parent contacts", { userId, search, type });

    // Get parent's children to find their teachers
    const children = await db
      .select({
        id: users.id,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(eq(users.parentId, userId));

    if (children.length === 0) {
      return NextResponse.json({
        data: { contacts: [] },
      } satisfies ApiSuccess<{ contacts: TeacherContact[] }>);
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

    return NextResponse.json({
      data: { contacts: formattedContacts },
    } satisfies ApiSuccess<{ contacts: TeacherContact[] }>);

  } catch (error) {
    logger.apiError(error, { route: "/api/parent/contacts", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch contacts", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
