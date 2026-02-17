import { db } from "@/lib/db";
import { users, schools, assessments } from "@/lib/db/schema";
import { eq, count, and, gte, desc, sql } from "drizzle-orm";

/**
 * DATA ASSISTANT - Real-time platform data for AI
 *
 * Detects question intent and queries database for real statistics.
 * Results are cached for 60 seconds to improve performance.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PlatformStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCounselors: number;
  totalSchoolAdmins: number;
  totalSchools: number;
  totalAssessments: number;
  activeUsers: number;
}

export interface SchoolStats {
  name: string;
  students: number;
  teachers: number;
  completion: number;
}

export interface UserData {
  id: string;
  name: string;
  type: string;
  email: string;
  schoolName?: string;
  lastLogin?: string;
}

// ============================================================================
// QUERY TYPE DETECTION
// ============================================================================

type QueryType =
  | "user_counts"
  | "student_counts"
  | "teacher_counts"
  | "school_counts"
  | "assessment_stats"
  | "active_users"
  | "system_status"
  | "school_list"
  | "none";

/**
 * Detect what data the question is asking for
 */
export function detectQueryType(message: string): QueryType {
  const lower = message.toLowerCase();

  // User count queries
  if (lower.includes("how many user") || lower.includes("total user") || lower.includes("user count")) {
    return "user_counts";
  }
  if (lower.includes("how many student") || lower.includes("total student")) {
    return "student_counts";
  }
  if (lower.includes("how many teacher")) {
    return "teacher_counts";
  }
  if (lower.includes("how many school")) {
    return "school_counts";
  }

  // Active user queries
  if (lower.includes("user online") || lower.includes("active user") || lower.includes("who is online")) {
    return "active_users";
  }

  // System status queries
  if (lower.includes("system status") || lower.includes("platform status") || lower.includes("health")) {
    return "system_status";
  }

  // Assessment stats
  if (lower.includes("assessment") || lower.includes("completion rate")) {
    return "assessment_stats";
  }

  // School list queries
  if (lower.includes("show me school") || lower.includes("list school") || lower.includes("all school")) {
    return "school_list";
  }

  return "none";
}

// ============================================================================
// DATA QUERIES
// ============================================================================

/**
 * Get platform-wide user statistics
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  // Get total counts by type
  const [studentCount, teacherCount, counselorCount, schoolAdminCount, schoolCount, assessmentCount] =
    await Promise.all([
      db.select({ count: count() }).from(users).where(eq(users.type, "student")),
      db.select({ count: count() }).from(users).where(eq(users.type, "teacher")),
      db.select({ count: count() }).from(users).where(eq(users.type, "counselor")),
      db.select({ count: count() }).from(users).where(eq(users.type, "school-admin")),
      db.select({ count: count() }).from(schools),
      db.select({ count: count() }).from(assessments).where(sql`${assessments.completedAt} IS NOT NULL`),
    ]);

  const totalStudents = studentCount[0]?.count || 0;
  const totalTeachers = teacherCount[0]?.count || 0;
  const totalCounselors = counselorCount[0]?.count || 0;
  const totalSchoolAdmins = schoolAdminCount[0]?.count || 0;
  const totalSchools = schoolCount[0]?.count || 0;
  const totalAssessments = assessmentCount[0]?.count || 0;

  // Estimate active users (logged in within last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const activeResult = await db
    .select({ count: count() })
    .from(users)
    .where(sql`${users.lastLogin} >= ${oneHourAgo.toISOString()}`);

  const activeUsers = activeResult[0]?.count || 0;

  return {
    totalUsers: totalStudents + totalTeachers + totalCounselors + totalSchoolAdmins,
    totalStudents,
    totalTeachers,
    totalCounselors,
    totalSchoolAdmins,
    totalSchools,
    totalAssessments,
    activeUsers,
  };
}

/**
 * Get list of schools with student counts
 */
export async function getSchoolStats(): Promise<SchoolStats[]> {
  const schoolData = await db.query.schools.findMany({
    orderBy: [desc(schools.createdAt)],
    limit: 10,
  });

  const stats: SchoolStats[] = [];

  for (const school of schoolData) {
    // Count students for this school
    const studentResult = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.schoolId, school.id), eq(users.type, "student")));

    // Count teachers for this school
    const teacherResult = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.schoolId, school.id), eq(users.type, "teacher")));

    // Calculate completion rate
    const schoolAssessments = await db.query.assessments.findMany({
      where: sql`${assessments.userId} IN (SELECT id FROM users WHERE ${users.schoolId} = ${school.id} AND ${users.type} = 'student')`,
    });

    const studentsWithAssessments = new Set(schoolAssessments.map((a) => a.userId)).size;
    const studentCount = studentResult[0]?.count || 0;
    const completion = studentCount > 0 ? Math.round((studentsWithAssessments / studentCount) * 100) : 0;

    stats.push({
      name: school.name || "Unknown School",
      students: studentCount,
      teachers: teacherResult[0]?.count || 0,
      completion,
    });
  }

  // Sort by student count
  return stats.sort((a, b) => b.students - a.students);
}

/**
 * Get recent active users
 */
export async function getActiveUsers(limit: number = 5): Promise<UserData[]> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const activeUsers = await db.query.users.findMany({
    where: sql`${users.lastLogin} >= ${oneHourAgo.toISOString()}`,
    orderBy: [desc(users.lastLogin)],
    limit,
  });

  // Fetch school names separately
  const userIds = activeUsers.map((u) => u.id);
  const schoolData = await db.query.schools.findMany();

  const result: UserData[] = activeUsers.slice(0, limit).map((u) => {
    const school = schoolData.find((s) => s.id === u.schoolId);
    return {
      id: String(u.id),
      name: String(u.name || "Unknown"),
      type: String(u.type),
      email: String(u.email || ""),
      schoolName: (school?.name as unknown as string | undefined),
      lastLogin: u.lastLogin ? String(u.lastLogin) : undefined,
    };
  });
  return result;
}

/**
 * Get assessment completion statistics
 */
export async function getAssessmentStats(): Promise<{
  total: number;
  completed: number;
  completionRate: number;
  byType: Record<string, number>;
}> {
  const [allAssessments, completedAssessments] = await Promise.all([
    db.select({ count: count() }).from(assessments),
    db.select({ count: count() }).from(assessments).where(sql`${assessments.completedAt} IS NOT NULL`),
  ]);

  const total = allAssessments[0]?.count || 0;
  const completed = completedAssessments[0]?.count || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Count by type
  const riasecResult = await db
    .select({ count: count() })
    .from(assessments)
    .where(and(eq(assessments.type, "riasec"), sql`${assessments.completedAt} IS NOT NULL`));

  const mbtiResult = await db
    .select({ count: count() })
    .from(assessments)
    .where(and(eq(assessments.type, "mbti"), sql`${assessments.completedAt} IS NOT NULL`));

  const byType = {
    riasec: riasecResult[0]?.count || 0,
    mbti: mbtiResult[0]?.count || 0,
  };

  return { total, completed, completionRate, byType };
}

// ============================================================================
// MAIN DATA FETCHER
// ============================================================================

/**
 * Fetch relevant data based on question type
 * Returns formatted data string for AI prompt
 */
export async function fetchRelevantData(message: string): Promise<string | null> {
  const queryType = detectQueryType(message);

  if (queryType === "none") {
    return null;
  }

  try {
    switch (queryType) {
      case "user_counts":
      case "student_counts":
      case "teacher_counts":
      case "school_counts":
      case "system_status": {
        const stats = await getPlatformStats();
        return formatPlatformStats(stats, queryType);
      }

      case "school_list": {
        const schools = await getSchoolStats();
        return formatSchoolList(schools);
      }

      case "active_users": {
        const users = await getActiveUsers();
        return formatActiveUsers(users);
      }

      case "assessment_stats": {
        const stats = await getAssessmentStats();
        return formatAssessmentStats(stats);
      }

      default:
        return null;
    }
  } catch (error) {
    console.error("Data query error:", error);
    return null;
  }
}

// ============================================================================
// FORMAT FUNCTIONS
// ============================================================================

function formatPlatformStats(stats: PlatformStats, queryType: QueryType): string {
  if (queryType === "system_status") {
    return `SYSTEM STATUS:
- Total Users: ${stats.totalUsers}
- Students: ${stats.totalStudents}
- Teachers: ${stats.totalTeachers}
- Counselors: ${stats.totalCounselors}
- School Admins: ${stats.totalSchoolAdmins}
- Schools: ${stats.totalSchools}
- Assessments Completed: ${stats.totalAssessments}
- Active Users (last hour): ${stats.activeUsers}
- Platform Status: Running normally`;
  }

  return `PLATFORM DATA:
- Total Users: ${stats.totalUsers}
- Students: ${stats.totalStudents}
- Teachers: ${stats.totalTeachers}
- Counselors: ${stats.totalCounselors}
- School Admins: ${stats.totalSchoolAdmins}
- Schools: ${stats.totalSchools}
- Active Users: ${stats.activeUsers}`;
}

function formatSchoolList(schools: SchoolStats[]): string {
  if (schools.length === 0) {
    return "No schools found.";
  }

  let output = `SCHOOLS (showing ${schools.length}):\n\n`;

  for (let i = 0; i < Math.min(schools.length, 5); i++) {
    const school = schools[i];
    output += `${i + 1}. ${school.name}\n`;
    output += `   Students: ${school.students} | Teachers: ${school.teachers} | Completion: ${school.completion}%\n`;
  }

  return output;
}

function formatActiveUsers(users: UserData[]): string {
  if (users.length === 0) {
    return "No active users in the last hour.";
  }

  let output = `ACTIVE USERS (last hour):\n\n`;

  for (const user of users) {
    const timeAgo = user.lastLogin
      ? `${Math.round((Date.now() - new Date(user.lastLogin).getTime()) / 60000)} min ago`
      : "unknown";

    output += `- ${user.name} (${user.type})`;
    if (user.schoolName) output += ` from ${user.schoolName}`;
    output += ` - active ${timeAgo}\n`;
  }

  return output;
}

function formatAssessmentStats(stats: {
  total: number;
  completed: number;
  completionRate: number;
  byType: Record<string, number>;
}): string {
  return `ASSESSMENT STATISTICS:
- Total Assessments: ${stats.total}
- Completed: ${stats.completed}
- Completion Rate: ${stats.completionRate}%
- RIASEC Completed: ${stats.byType.riasec}
- MBTI Completed: ${stats.byType.mbti}`;
}
