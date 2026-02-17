/**
 * COUNSELOR DATA FETCHING UTILITIES
 *
 * Server-side data fetching functions for counselor portal.
 * All functions filter by counselorId for proper isolation.
 */

import { db } from "@/lib/db";
import {
  users,
  counselorNotes,
  counselorAssignments,
  schools,
  assessments,
  careerPlans,
  classes,
  enrollments,
  attendance,
} from "@/lib/db/schema";
import { eq, and, desc, count, sql, or, like, gte, lte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

// ============================================================================
// TYPES
// ============================================================================

interface UserWithSchool {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  classGrade: number | null;
  section: string | null;
  school?: {
    name: string;
  }[];
}

export interface CounselorStudentData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  grade: number | null;
  section: string | null;
  school: string | null;
  counselorId: string;
  assessmentStatus: "completed" | "in_progress" | "pending";
  assessmentsTaken: number;
  topCareer: string | null;
  careerMatch: number | null;
  planStatus: "completed" | "in_progress" | "not_started";
  lastSession: string;
  needsAttention: boolean;
  gpa: number | null;
  attendanceRate: number;
}

export interface CounselorNoteData {
  id: string;
  counselorId: string;
  studentId: string;
  studentName: string;
  grade: number | null;
  school: string | null;
  category: string;
  note: string;
  isPrivate: boolean;
  isSensitive: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface CounselingSessionData {
  id: string;
  studentId: string | null;
  studentName: string | null;
  grade: number | null;
  type: "individual" | "group" | "family";
  status: "scheduled" | "completed" | "cancelled";
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  topic: string;
  notes: string | null;
  isRecurring: boolean;
  recurringPattern?: string;
  participants?: string[];
}

export interface InterventionData {
  id: string;
  studentId: string;
  studentName: string;
  grade: number | null;
  school: string | null;
  type: string;
  category: string;
  priority: string;
  status: string;
  startDate: string;
  targetDate: string;
  progress: number;
  description: string;
  goals: Array<{ id: number; text: string; status: string }>;
  notes: string | null;
  followUpDate: string | null;
  outcome?: string;
}

// ============================================================================
// AUTH & COUNSELOR ID
// ============================================================================

export async function getCurrentCounselorId() {
  const authResult = await requireAuth(['counselor']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;  // Database userId

  // Get counselor record for this user
  const counselor = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true },
  });

  return counselor?.id || null;
}

// ============================================================================
// STUDENTS DATA
// ============================================================================

export async function getCounselorStudents(counselorId: string | null): Promise<CounselorStudentData[]> {
  if (!counselorId) {
    return [];
  }

  try {
    // Get school assignments for this counselor
    const assignments = await db.query.counselorAssignments.findMany({
      where: and(
        eq(counselorAssignments.counselorId, counselorId),
        eq(counselorAssignments.isActive, true)
      ),
      columns: { schoolId: true },
    });

    const schoolIds = assignments.map((a) => a.schoolId);

    if (schoolIds.length === 0) {
      return [];
    }

    // Get all students from assigned schools
    const allStudents = await db.query.users.findMany({
      where: and(
        eq(users.type, "student"),
        sql`${users.schoolId} IN ${sql.placeholder("schoolIds")}`
      ),
      with: {
        school: true,
      },
    });

    // Get assessment data for each student
    const studentsWithData = await Promise.all(
      allStudents.map(async (student) => {
        // Get assessments
        const studentAssessments = await db.query.assessments.findMany({
          where: eq(assessments.userId, student.id),
          columns: { status: true, type: true },
        });

        const completedAssessments = studentAssessments.filter((a) => a.status === "completed").length;
        const inProgressAssessments = studentAssessments.some((a) => a.status === "in_progress");

        // Get career plan
        const careerPlan = await db.query.careerPlans.findFirst({
          where: eq(careerPlans.userId, student.id),
          columns: { status: true, targetCareer: true },
        });

        // Get attendance rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentAttendance = await db.query.attendance.findMany({
          where: and(
            eq(attendance.studentId, student.id),
            gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0])
          ),
        });

        const presentDays = recentAttendance.filter((a) => a.status === "present").length;
        const attendanceRate = recentAttendance.length > 0
          ? Math.round((presentDays / recentAttendance.length) * 100)
          : 0;

        // Determine needs attention
        const needsAttention =
          attendanceRate < 80 ||
          (completedAssessments === 0 && inProgressAssessments === false) ||
          (careerPlan?.status !== "completed" && student.classGrade && student.classGrade >= 10);

        // Format last session (placeholder for now)
        const lastSession = "Not available";

        const studentWithSchool = student as UserWithSchool;
        const schoolName = studentWithSchool.school?.[0]?.name || null;
        return {
          id: student.id,
          name: `${student.firstName} ${student.lastName || ""}`.trim(),
          email: student.email,
          phone: student.phone,
          grade: student.classGrade || null,
          section: student.section || null,
          school: schoolName,
          counselorId,
          assessmentStatus:
            completedAssessments > 0
              ? "completed"
              : inProgressAssessments
              ? "in_progress"
              : "pending",
          assessmentsTaken: completedAssessments,
          topCareer: null, // Would need to query career matches
          careerMatch: null,
          planStatus: careerPlan?.status === "completed" ? "completed" : careerPlan ? "in_progress" : "not_started",
          lastSession,
          needsAttention,
          gpa: null, // Would need exam results
          attendanceRate,
        };
      })
    );

    return studentsWithData as CounselorStudentData[];
  } catch (error) {
    console.error("Error fetching counselor students:", error);
    return [];
  }
}

export async function getStudentById(studentId: string) {
  return await db.query.users.findFirst({
    where: eq(users.id, studentId),
    with: {
      school: true,
    },
  });
}

// ============================================================================
// NOTES DATA
// ============================================================================

export async function getCounselorNotes(
  counselorId: string | null,
  filters?: {
    studentId?: string;
    category?: string;
    isPrivate?: boolean;
    schoolId?: string;
  }
): Promise<CounselorNoteData[]> {
  if (!counselorId) {
    return [];
  }

  try {
    const conditions = [eq(counselorNotes.counselorId, counselorId)];

    if (filters?.studentId) {
      conditions.push(eq(counselorNotes.studentId, filters.studentId));
    }

    const notes = await db.query.counselorNotes.findMany({
      where: conditions.length === 1 ? conditions[0] : and(...conditions),
      orderBy: [desc(counselorNotes.createdAt)],
    });

    // Enrich notes with student data
    const enrichedNotes = await Promise.all(
      notes.map(async (note) => {
        const student = await db.query.users.findFirst({
          where: eq(users.id, note.studentId),
          columns: { firstName: true, lastName: true, classGrade: true },
          with: {
            school: true,
          },
        });

        // Parse note for category and tags (stored as JSON or parsed from note text)
        let category = "general";
        let isSensitive = false;
        let tags: string[] = [];

        try {
          // Note might have metadata prepended
          const noteText = note.note;
          if (noteText.includes("[category:")) {
            const match = noteText.match(/\[category:([^\]]+)\]/);
            if (match) category = match[1];
          }
          if (noteText.includes("[sensitive]")) {
            isSensitive = true;
          }
          if (noteText.includes("[tags:")) {
            const match = noteText.match(/\[tags:([^\]]+)\]/);
            if (match) tags = match[1].split(",").map((t) => t.trim());
          }
        } catch (e) {
          // Use defaults
        }

        const studentWithSchool = student as UserWithSchool | undefined;
        const schoolName = studentWithSchool?.school?.[0]?.name || null;
        return {
          id: note.id,
          counselorId: note.counselorId,
          studentId: note.studentId,
          studentName: student ? `${student.firstName} ${student.lastName || ""}`.trim() : "Unknown",
          grade: student?.classGrade || null,
          school: schoolName,
          category,
          note: note.note.replace(/\[category:[^\]]+\]|\[sensitive\]|\[tags:[^\]]+\]/g, "").trim(),
          isPrivate: !!note.isPrivate,
          isSensitive,
          createdAt: note.createdAt?.toISOString() || "",
          updatedAt: note.updatedAt?.toISOString() || "",
          tags,
        };
      })
    );

    return enrichedNotes;
  } catch (error) {
    console.error("Error fetching counselor notes:", error);
    return [];
  }
}

export async function createCounselorNote(data: {
  counselorId: string;
  studentId: string;
  note: string;
  category: string;
  isPrivate: boolean;
  isSensitive: boolean;
  tags: string[];
}) {
  // Format note with metadata
  const metadata = `[category:${data.category}]${data.isSensitive ? "[sensitive]" : ""}[tags:${data.tags.join(",")}]\n\n${data.note}`;

  const [newNote] = await db
    .insert(counselorNotes)
    .values({
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      counselorId: data.counselorId,
      studentId: data.studentId,
      note: metadata,
      title: data.category || "Note",
      content: data.note,
      noteType: "observation",
      isConfidential: !!data.isSensitive,
      isPrivate: !!data.isPrivate,
      sessionDate: new Date().toISOString().split("T")[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newNote;
}

// ============================================================================
// SESSIONS DATA (Mock for now - would need counseling_sessions table)
// ============================================================================

export async function getCounselorSessions(
  counselorId: string | null,
  filters?: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<CounselingSessionData[]> {
  if (!counselorId) {
    return [];
  }

  // Return empty array for now - sessions table not in schema yet
  // When table is added, this will query it
  return [];
}

export async function createCounselingSession(data: {
  counselorId: string;
  studentId?: string;
  type: "individual" | "group" | "family";
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  topic: string;
  notes?: string;
}) {
  // This would insert into a counseling_sessions table
  // For now, return mock response
  return {
    id: `session_${Date.now()}`,
    studentId: data.studentId || null,
    studentName: null,
    grade: null,
    type: data.type,
    status: "scheduled",
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.location,
    topic: data.topic,
    notes: data.notes || null,
    isRecurring: false,
  };
}

// ============================================================================
// INTERVENTIONS DATA (Mock for now - would need interventions table)
// ============================================================================

export async function getInterventions(
  counselorId: string | null,
  filters?: {
    type?: string;
    priority?: string;
    status?: string;
  }
): Promise<InterventionData[]> {
  if (!counselorId) {
    return [];
  }

  // Return empty array for now - interventions table not in schema yet
  // When table is added, this will query it
  return [];
}

export async function createIntervention(data: {
  counselorId: string;
  studentId: string;
  type: string;
  category: string;
  priority: string;
  description: string;
  targetDate: string;
}) {
  // This would insert into an interventions table
  // For now, return mock response
  return {
    id: `intervention_${Date.now()}`,
    studentId: data.studentId,
    studentName: "",
    grade: null,
    school: null,
    type: data.type,
    category: data.category,
    priority: data.priority,
    status: "active",
    startDate: new Date().toISOString().split("T")[0],
    targetDate: data.targetDate,
    progress: 0,
    description: data.description,
    goals: [],
    notes: null,
    followUpDate: null,
  };
}

// ============================================================================
// STATS
// ============================================================================

export async function getCounselorStats(counselorId: string | null) {
  if (!counselorId) {
    return {
      totalStudents: 0,
      activeInterventions: 0,
      upcomingSessions: 0,
      totalNotes: 0,
    };
  }

  const students = await getCounselorStudents(counselorId);

  const notes = await db.query.counselorNotes.findMany({
    where: eq(counselorNotes.counselorId, counselorId),
  });

  return {
    totalStudents: students.length,
    studentsCompletedAssessments: students.filter((s) => s.assessmentStatus === "completed").length,
    studentsWithCareerPlans: students.filter((s) => s.planStatus === "completed").length,
    studentsNeedingAttention: students.filter((s) => s.needsAttention).length,
    activeInterventions: 0, // Would come from interventions table
    upcomingSessions: 0, // Would come from sessions table
    totalNotes: notes.length,
    privateNotes: notes.filter((n) => n.isPrivate).length,
    sensitiveNotes: 0, // Would need isSensitive field
  };
}

/**
 * COUNSELOR RESOURCES DATA
 */

export interface ResourceData {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "pdf" | "video" | "document" | "spreadsheet" | "link";
  url: string;
  fileSize?: string;
  pages?: number;
  duration?: string;
  tags: string[];
  isFeatured: boolean;
  downloads?: number;
  views?: number;
  addedDate: string;
}

export interface ResourceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ResourceStats {
  totalResources: number;
  totalDownloads: number;
  featuredCount: number;
  categoriesCount: number;
}

export async function getResourcesData(counselorId: string | null): Promise<{
  resources: ResourceData[];
  categories: ResourceCategory[];
  stats: ResourceStats;
}> {
  if (!counselorId) {
    return {
      resources: [],
      categories: [],
      stats: {
        totalResources: 0,
        totalDownloads: 0,
        featuredCount: 0,
        categoriesCount: 0,
      },
    };
  }

  // For now, return empty arrays - resources would be stored in a resources table
  // In production, this would query from counselor_resources table
  const categories: ResourceCategory[] = [
    { id: "all", name: "All Resources", icon: "BookOpen", color: "bg-gray-100 text-gray-600", description: "All counseling resources" },
    { id: "career", name: "Career Resources", icon: "TrendingUp", color: "bg-purple-100 text-purple-600", description: "Career guidance resources" },
    { id: "college", name: "College Applications", icon: "GraduationCap", color: "bg-blue-100 text-blue-600", description: "College and university application guides" },
    { id: "scholarship", name: "Scholarships", icon: "Award", color: "bg-green-100 text-green-600", description: "Scholarship information and resources" },
    { id: "mental-health", name: "Mental Health", icon: "Heart", color: "bg-red-100 text-red-600", description: "Student mental health and wellness resources" },
    { id: "study-skills", name: "Study Skills", icon: "Brain", color: "bg-yellow-100 text-yellow-600", description: "Study skills and learning techniques" },
    { id: "rub", name: "RUB Colleges", icon: "Building2", color: "bg-violet-100 text-violet-600", description: "Royal University of Bhutan college information" },
    { id: "international", name: "Study Abroad", icon: "Globe", color: "bg-cyan-100 text-cyan-600", description: "International education opportunities" },
  ];

  return {
    resources: [],
    categories,
    stats: {
      totalResources: 0,
      totalDownloads: 0,
      featuredCount: 0,
      categoriesCount: categories.length,
    },
  };
}
