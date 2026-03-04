/**
 * GLOBAL SEARCH FUNCTIONALITY
 *
 * Search across students, teachers, schools, assessments
 */

import { db } from "@/lib/db";
import { users, schools, assessments, careerMatches } from "@/lib/db/schema";
import { sql, or, like, eq, and } from "drizzle-orm";

export interface SearchResult {
  type: "student" | "teacher" | "school" | "assessment";
  id: string;
  title: string;
  subtitle: string;
  url: string;
  category: string;
}

interface SearchOptions {
  limit?: number;
  portal?: string;
  type?: SearchResult["type"][];
}

/**
 * Global search across all entities
 */
export async function globalSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 20, portal, type } = options;

  if (!query || query.length < 2) return [];

  const searchTerms = query.split(/\s+/).filter(Boolean);
  const searchPattern = `%${query.toLowerCase()}%`;

  const results: SearchResult[] = [];

  // Search students (if student portal or all)
  if (!type || type.includes("student")) {
    const students = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        grade: users.grade,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(
        and(
          eq(users.type, "student"),
          portal === "student" ? sql`${users.portal} = 'student'` : sql`1=1`,
          or(
            like(users.name, searchPattern),
            like(users.email, searchPattern)
          )
        )
      )
      .limit(limit);

    for (const student of students) {
      results.push({
        type: "student" as const,
        id: student.id,
        title: student.name,
        subtitle: `Class ${student.grade || "N/A"} • ${student.email || "No email"}`,
        url: `/teacher/students/${student.id}`,
        category: "Student",
      });
    }
  }

  // Search teachers (if teacher portal or all)
  if (!type || type.includes("teacher")) {
    const teachers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        subject: users.subject,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(
        and(
          eq(users.type, "teacher"),
          portal === "teacher" ? sql`${users.portal} = 'teacher'` : sql`1=1`,
          or(
            like(users.name, searchPattern),
            like(users.email, searchPattern)
          )
        )
      )
      .limit(limit);

    for (const teacher of teachers) {
      results.push({
        type: "teacher" as const,
        id: teacher.id,
        title: teacher.name,
        subtitle: `${teacher.subject || "Teacher"} • ${teacher.email || "No email"}`,
        url: `/admin/users`,
        category: "Teacher",
      });
    }
  }

  // Search schools (if admin or all)
  if (!type || type.includes("school")) {
    const schoolResults = await db
      .select({
        id: schools.id,
        name: schools.name,
        city: schools.city,
        state: schools.state,
        type: schools.schoolType,
      })
      .from(schools)
      .where(
        and(
          eq(schools.isActive, true),
          or(
            like(schools.name, searchPattern),
            like(schools.city, searchPattern),
            like(schools.state, searchPattern)
          )
        )
      )
      .limit(limit);

    for (const school of schoolResults) {
      results.push({
        type: "school" as const,
        id: school.id,
        title: school.name,
        subtitle: `${school.city}, ${school.state} • ${school.type || "School"}`,
        url: `/admin/schools/${school.id}`,
        category: "School",
      });
    }
  }

  // Search assessments
  if (!type || type.includes("assessment")) {
    const assessmentResults = await db
      .select({
        id: assessments.id,
        title: assessments.title,
        type: assessments.type,
      })
      .from(assessments)
      .where(like(assessments.title, searchPattern))
      .limit(limit);

    for (const assessment of assessmentResults) {
      results.push({
        type: "assessment" as const,
        id: assessment.id,
        title: assessment.title,
        subtitle: `${assessment.type} Assessment`,
        url: `/student/assessments/${assessment.id}`,
        category: "Assessment",
      });
    }
  }

  // Sort by relevance (exact matches first, then alphabetical)
  results.sort((a, b) => {
    const aExact = a.title.toLowerCase() === query.toLowerCase();
    const bExact = b.title.toLowerCase() === query.toLowerCase();
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.title.localeCompare(b.title);
  });

  return results.slice(0, limit);
}
