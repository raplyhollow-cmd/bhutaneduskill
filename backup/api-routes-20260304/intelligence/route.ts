/**
 * UNIFIED INTELLIGENCE API
 *
 * Single endpoint for ALL operations - CRUD, intelligence, dashboard, analytics.
 * Replaces hundreds of individual API endpoints with one smart unified endpoint.
 *
 * ============================================================================
 * QUERY PARAMETERS (GET)
 * ============================================================================
 * - type: guidance | roadmap | resources | alerts | recommendations | list | get | dashboard | analytics
 * - role: student | teacher | counselor | parent | admin | school-admin
 * - resource: students | teachers | classes | schools | assessments | attendance | homework | subjects
 * - id: user ID (for student/teacher specific queries)
 * - classId: class ID for class-specific queries
 * - subject: subject name for resources
 * - topic: topic name for resources
 * - filters: JSON string for complex filters
 * - page: page number (default 1)
 * - limit: items per page (default 20)
 * - academicYear: academic year filter
 *
 * ============================================================================
 * REQUEST BODY (POST/PUT/PATCH/DELETE)
 * ============================================================================
 * - type: create | update | delete
 * - resource: students | teachers | classes | schools | assessments | etc.
 * - id: resource ID (for update/delete)
 * - data: object with fields to create/update
 *
 * ============================================================================
 * EXAMPLES
 * ============================================================================
 * GET /api/intelligence?type=guidance&role=student&id=123
 * GET /api/intelligence?type=resources&role=teacher&subject=Math&topic=Algebra
 * GET /api/intelligence?type=list&resource=students&role=school-admin&page=1&limit=20
 * GET /api/intelligence?type=get&resource=students&id=123
 * GET /api/intelligence?type=dashboard&role=teacher
 * POST /api/intelligence (body: { type: "create", resource: "students", data: {...} })
 * PUT /api/intelligence (body: { type: "update", resource: "students", id: "123", data: {...} })
 * DELETE /api/intelligence (body: { type: "delete", resource: "students", id: "123" })
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  users, classes, enrollments, assessments, attendance, subjects,
  students, teachers, schools, teacherAssignments, homework
} from "@/lib/db/schema";
import { eq, and, inArray, desc, gte, lte, sql, count, or, like, ilike } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import {
  successResponse, errorResponse, notFoundResponse, badRequestResponse,
  createdResponse, updatedResponse
} from "@/lib/api/response-helpers";
import { getTeachingMethods, getVideosForTopic, getNCERTLink } from "@/lib/data/teaching-resources";
import { getCareerMatches, getSkillPath } from "@/lib/data/career-guidance";

// ============================================================================
// TYPES
// ============================================================================

type IntelligenceType =
  | "guidance" | "roadmap" | "resources" | "alerts" | "recommendations"  // Intelligence
  | "list" | "get" | "dashboard" | "analytics"                          // Data operations
  | "create" | "update" | "delete";                                     // Mutations (via POST)

type UserRole = "student" | "teacher" | "counselor" | "parent" | "school-admin" | "admin";

type ResourceType =
  | "students" | "teachers" | "classes" | "schools"
  | "assessments" | "attendance" | "homework" | "subjects"
  | "enrollments" | "teacherAssignments" | "reports";

interface IntelligenceParams {
  type: IntelligenceType;
  role?: UserRole;
  resource?: ResourceType;
  id?: string;
  subject?: string;
  topic?: string;
  studentId?: string;
  classId?: string;
  academicYear?: string;
  filters?: string; // JSON string for complex filters
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface RequestBody {
  type: IntelligenceType;
  resource?: ResourceType;
  id?: string;
  data?: any;
  filters?: any;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    // Parse query parameters
    const url = new URL(request.url);
    const filtersStr = url.searchParams.get("filters");

    const params: IntelligenceParams = {
      type: (url.searchParams.get("type") as IntelligenceType) || "guidance",
      role: (url.searchParams.get("role") as UserRole) || "student",
      resource: (url.searchParams.get("resource") as ResourceType) || undefined,
      id: url.searchParams.get("id") || userId,
      subject: url.searchParams.get("subject") || undefined,
      topic: url.searchParams.get("topic") || undefined,
      studentId: url.searchParams.get("studentId") || undefined,
      classId: url.searchParams.get("classId") || undefined,
      academicYear: url.searchParams.get("academicYear") || undefined,
      filters: filtersStr || undefined,
      page: parseInt(url.searchParams.get("page") || "1"),
      limit: parseInt(url.searchParams.get("limit") || "20"),
      sortBy: url.searchParams.get("sortBy") || undefined,
      sortOrder: (url.searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    logger.info("Unified Intelligence API request", { params, userId });

    // Route to appropriate handler based on type
    try {
      switch (params.type) {
        // ========== INTELLIGENCE ENDPOINTS ==========
        case "guidance":
          return await handleGuidance(params, userId);

        case "roadmap":
          return await handleRoadmap(params, userId);

        case "resources":
          return await handleResources(params, userId);

        case "alerts":
          return await handleAlerts(params, userId);

        case "recommendations":
          return await handleRecommendations(params, userId);

        // ========== DATA OPERATION ENDPOINTS ==========
        case "list":
          return await handleList(params, auth);

        case "get":
          return await handleGet(params, auth);

        case "dashboard":
          return await handleDashboard(params, auth);

        case "analytics":
          return await handleAnalytics(params, auth);

        default:
          return errorResponse(`Unknown type: ${params.type}`);
      }
    } catch (error) {
      logger.error("Intelligence API error", { error, params });
      return errorResponse(error instanceof Error ? error.message : "Failed to process request");
    }
  },
  ["student", "teacher", "counselor", "parent", "school-admin", "admin"]
);

// ============================================================================
// MUTATION HANDLERS - Shared between POST and PUT
// ============================================================================

async function handleMutationRequest(request: NextRequest, auth: any) {
  const { userId, user } = auth;

  try {
    const body: RequestBody = await request.json();

    logger.info("Unified Intelligence API POST request", { type: body.type, resource: body.resource, userId });

    switch (body.type) {
      case "create":
        return await handleCreate(body.resource, body.data, auth);

      case "update":
        return await handleUpdate(body.resource, body.id, body.data, auth);

      case "delete":
        return await handleDelete(body.resource, body.id, auth);

      default:
        return errorResponse(`Unknown operation type: ${body.type}`);
    }
  } catch (error) {
    logger.error("Intelligence API POST error", { error, userId });
    return errorResponse(error instanceof Error ? error.message : "Failed to process request");
  }
}

// ============================================================================
// POST METHOD - Create, Update, Delete operations
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth, context) => {
    return await handleMutationRequest(request, auth);
  },
  ["school-admin", "admin"] // Restrict mutations to admins
);

// ============================================================================
// PUT METHOD - Alias for update
// ============================================================================

export const PUT = createApiRoute(
  async (request: NextRequest, auth, context) => {
    // PUT is an alias for update
    return await handleMutationRequest(request, auth);
  },
  ["school-admin", "admin"]
);

// ============================================================================
// DELETE METHOD - Explicit delete endpoint
// ============================================================================

export const DELETE = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    try {
      const body: RequestBody = await request.json();

      logger.info("Unified Intelligence API DELETE request", { resource: body.resource, id: body.id, userId });

      return await handleDelete(body.resource, body.id, auth);
    } catch (error) {
      logger.error("Intelligence API DELETE error", { error, userId });
      return errorResponse(error instanceof Error ? error.message : "Failed to process request");
    }
  },
  ["school-admin", "admin"]
);

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GUIDANCE - Personalized guidance for individuals
 */
async function handleGuidance(params: IntelligenceParams, userId: string) {
  // Students get career and learning guidance
  if (params.role === "student") {
    return await getStudentGuidance(params.id || userId);
  }

  // Teachers get class insights and teaching resources
  if (params.role === "teacher") {
    return await getTeacherGuidance(params.id || userId, params.classId);
  }

  // Counselors get at-risk student alerts
  if (params.role === "counselor") {
    return await getCounselorAlerts();
  }

  // Parents get guidance for helping their child
  if (params.role === "parent") {
    return await getParentGuidance(params.studentId || userId);
  }

  return notFoundResponse();
}

/**
 * ROADMAP - Career and skill development roadmaps
 */
async function handleRoadmap(params: IntelligenceParams, userId: string) {
  // Get student's assessment results for roadmap
  const studentData = await db
    .select()
    .from(users)
    .where(eq(users.id, params.id || userId))
    .limit(1);

  if (studentData.length === 0) {
    return notFoundResponse("Student");
  }

  const student = studentData[0];

  // Get latest MBTI and RIASEC results
  const mbtiResult = await db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.userId, student.id),
        eq(assessments.type, "mbti")
      )
    )
    .orderBy(desc(assessments.createdAt))
    .limit(1);

  const riasecResult = await db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.userId, student.id),
        eq(assessments.type, "riasec")
      )
    )
    .orderBy(desc(assessments.createdAt))
    .limit(1);

  // Parse results
  const mbti = mbtiResult[0]?.results as any;
  const riasec = riasecResult[0]?.results as any;

  const mbtiType = mbti?.personalityType || "Unknown";
  const riasecCode = riasec?.topInterests
    ? (riasec.topInterests as string[]).slice(0, 3).join("")
    : undefined;

  // Get career matches
  const careerMatches = getCareerMatches(mbtiType, riasecCode);

  // Get academic performance
  const grades = await getStudentGrades(student.id);

  return successResponse({
    student: {
      id: student.id,
      name: `${student.firstName} ${student.lastName || ""}`.trim(),
      mbti: mbtiType,
      riasec: riasecCode,
    },
    careerRoadmap: careerMatches.map((match) => ({
      career: match.career,
      fitScore: match.fitScore,
      bhutanOutlook: match.bhutanOutlook,
      requiredSkills: match.skills,
      roadmap: match.roadmap,
      education: match.education,
    })),
    learningPlan: generateLearningPlan(grades),
    skillDevelopment: identifySkillGaps(student, grades),
  });
}

/**
 * RESOURCES - Teaching and learning resources
 */
async function handleResources(params: IntelligenceParams, userId: string) {
  const { subject, topic } = params;

  if (!subject) {
    return errorResponse("Subject parameter required");
  }

  const resources: any = {
    subject,
    topic,
  };

  // Get teaching methods
  const methods = getTeachingMethods(subject.toLowerCase(), topic?.toLowerCase());
  if (methods) {
    resources.teachingMethods = methods.methods;
    resources.tips = methods.tips;
  }

  // Get videos
  const videos = getVideosForTopic(subject.toLowerCase(), topic?.toLowerCase());
  resources.videos = videos;

  // Get NCERT link
  const ncertLink = getNCERTLink(subject.toLowerCase(), topic?.toLowerCase());
  if (ncertLink) {
    resources.ncert = ncertLink;
  }

  // If it's a teacher requesting, also add class insights
  if (params.classId) {
    const classInsights = await getClassInsights(params.classId);
    resources.classInsights = classInsights;
  }

  return successResponse(resources);
}

/**
 * ALERTS - At-risk student alerts for counselors
 */
async function handleAlerts(params: IntelligenceParams, userId: string) {
  // Get students with attendance < 70%
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendanceRecords = await db
    .select({
      studentId: attendance.studentId,
      present: sql<number>`COUNT(*) FILTER (WHERE status = 'present' OR status = 'late')`,
      total: count(),
    })
    .from(attendance)
    .where(gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0]))
    .groupBy(attendance.studentId);

  const atRiskStudents: any[] = [];

  for (const record of attendanceRecords) {
    const rate = record.total > 0 ? (record.present / record.total) * 100 : 100;
    if (rate < 70) {
      const studentData = await db
        .select()
        .from(users)
        .where(eq(users.id, record.studentId))
        .limit(1);

      if (studentData.length > 0) {
        const student = studentData[0];

        // Get recent grades
        const recentGrades = await getStudentGrades(student.id);

        // Get MBTI for personality-based intervention
        const mbtiResult = await db
          .select()
          .from(assessments)
          .where(
            and(
              eq(assessments.userId, student.id),
              eq(assessments.type, "mbti")
            )
          )
          .orderBy(desc(assessments.createdAt))
          .limit(1);

        const mbti = mbtiResult[0]?.results as any;
        const mbtiType = mbti?.personalityType || "Unknown";

        atRiskStudents.push({
          id: student.id,
          name: `${student.firstName} ${student.lastName || ""}`.trim(),
          class: `Class ${student.classGrade}${student.section ? " " + student.section : ""}`,
          attendanceRate: Math.round(rate),
          avgGrade: calculateAverageGrade(recentGrades),
          mbti: mbtiType,
          severity: rate < 50 ? "high" : "medium",
          suggestedAction: getSuggestedAction(rate, mbtiType, recentGrades),
        });
      }
    }
  }

  return successResponse({
    totalAtRisk: atRiskStudents.length,
    highPriority: atRiskStudents.filter((s) => s.severity === "high"),
    mediumPriority: atRiskStudents.filter((s) => s.severity === "medium"),
    lastUpdated: new Date().toISOString(),
  });
}

/**
 * RECOMMENDATIONS - Smart recommendations based on context
 */
async function handleRecommendations(params: IntelligenceParams, userId: string) {
  // For teachers: recommend teaching methods based on class performance
  if (params.classId) {
    return await getTeacherRecommendations(params.classId);
  }

  // For students: recommend resources based on weak subjects
  return await getStudentRecommendations(params.id || userId);
}

// ============================================================================
// CRUD OPERATION HANDLERS
// ============================================================================

/**
 * LIST - Get paginated list of resources
 */
async function handleList(params: IntelligenceParams, auth: any) {
  const { resource, page = 1, limit = 20, filters, sortBy, sortOrder } = params;
  const { user, userId } = auth;

  if (!resource) {
    return badRequestResponse("Resource parameter required");
  }

  const offset = (page - 1) * limit;

  // Parse filters if provided
  let filterObj: any = {};
  if (filters) {
    try {
      filterObj = JSON.parse(filters);
    } catch (e) {
      return badRequestResponse("Invalid filters JSON");
    }
  }

  // Route to appropriate resource handler
  switch (resource) {
    case "students":
      return await listStudents(auth, filterObj, offset, limit, sortBy, sortOrder);

    case "teachers":
      return await listTeachers(auth, filterObj, offset, limit, sortBy, sortOrder);

    case "classes":
      return await listClasses(auth, filterObj, offset, limit, sortBy, sortOrder);

    case "subjects":
      return await listSubjects(auth, filterObj, offset, limit, sortBy, sortOrder);

    case "assessments":
      return await listAssessments(auth, filterObj, offset, limit, sortBy, sortOrder);

    case "attendance":
      return await listAttendance(auth, filterObj, offset, limit, sortBy, sortOrder);

    case "homework":
      return await listHomework(auth, filterObj, offset, limit, sortBy, sortOrder);

    case "enrollments":
      return await listEnrollments(auth, filterObj, offset, limit, sortBy, sortOrder);

    case "schools":
      return await listSchools(auth, filterObj, offset, limit, sortBy, sortOrder);

    default:
      return badRequestResponse(`Unknown resource: ${resource}`);
  }
}

/**
 * GET - Get single resource by ID
 */
async function handleGet(params: IntelligenceParams, auth: any) {
  const { resource, id } = params;

  if (!resource || !id) {
    return badRequestResponse("Resource and ID parameters required");
  }

  switch (resource) {
    case "students":
      return await getStudent(id, auth);

    case "teachers":
      return await getTeacher(id, auth);

    case "classes":
      return await getClass(id, auth);

    case "subjects":
      return await getSubject(id, auth);

    case "schools":
      return await getSchool(id, auth);

    default:
      return badRequestResponse(`Unknown resource: ${resource}`);
  }
}

/**
 * DASHBOARD - Get dashboard data for role
 */
async function handleDashboard(params: IntelligenceParams, auth: any) {
  const { role } = params;
  const { userId, user } = auth;

  switch (role) {
    case "teacher":
      return await getTeacherDashboard(userId);

    case "student":
      return await getStudentDashboard(userId);

    case "school-admin":
      return await getSchoolAdminDashboard(userId, user.schoolId);

    case "counselor":
      return await getCounselorDashboard(userId);

    case "admin":
      return await getPlatformAdminDashboard(userId);

    default:
      return badRequestResponse(`Unknown role: ${role}`);
  }
}

/**
 * ANALYTICS - Get analytics data
 */
async function handleAnalytics(params: IntelligenceParams, auth: any) {
  const { resource, role } = params;
  const { userId, user } = auth;

  if (!resource) {
    return badRequestResponse("Resource parameter required");
  }

  switch (resource) {
    case "students":
      return await getStudentAnalytics(auth, params.filters);

    case "classes":
      return await getClassAnalytics(auth, params.filters);

    case "assessments":
      return await getAssessmentAnalytics(auth, params.filters);

    case "attendance":
      return await getAttendanceAnalytics(auth, params.filters);

    default:
      return badRequestResponse(`Analytics not available for: ${resource}`);
  }
}

/**
 * CREATE - Create new resource
 */
async function handleCreate(resource: ResourceType | undefined, data: any, auth: any) {
  if (!resource) {
    return badRequestResponse("Resource parameter required");
  }

  if (!data) {
    return badRequestResponse("Data required for create operation");
  }

  switch (resource) {
    case "students":
      return await createStudent(data, auth);

    case "teachers":
      return await createTeacher(data, auth);

    case "classes":
      return await createClass(data, auth);

    case "subjects":
      return await createSubject(data, auth);

    case "schools":
      return await createSchool(data, auth);

    case "assessments":
      return await createAssessment(data, auth);

    default:
      return badRequestResponse(`Create not available for: ${resource}`);
  }
}

/**
 * UPDATE - Update existing resource
 */
async function handleUpdate(resource: ResourceType | undefined, id: string | undefined, data: any, auth: any) {
  if (!resource || !id) {
    return badRequestResponse("Resource and ID parameters required");
  }

  if (!data) {
    return badRequestResponse("Data required for update operation");
  }

  switch (resource) {
    case "students":
      return await updateStudent(id, data, auth);

    case "teachers":
      return await updateTeacher(id, data, auth);

    case "classes":
      return await updateClass(id, data, auth);

    case "subjects":
      return await updateSubject(id, data, auth);

    case "schools":
      return await updateSchool(id, data, auth);

    case "assessments":
      return await updateAssessment(id, data, auth);

    default:
      return badRequestResponse(`Update not available for: ${resource}`);
  }
}

/**
 * DELETE - Delete resource
 */
async function handleDelete(resource: ResourceType | undefined, id: string | undefined, auth: any) {
  if (!resource || !id) {
    return badRequestResponse("Resource and ID parameters required");
  }

  switch (resource) {
    case "students":
      return await deleteStudent(id, auth);

    case "teachers":
      return await deleteTeacher(id, auth);

    case "classes":
      return await deleteClass(id, auth);

    case "subjects":
      return await deleteSubject(id, auth);

    default:
      return badRequestResponse(`Delete not available for: ${resource}`);
  }
}

// ============================================================================
// RESOURCE LIST HANDLERS
// ============================================================================

async function listStudents(auth: any, filters: any, offset: number, limit: number, sortBy?: string, sortOrder?: "asc" | "desc") {
  const { user } = auth;

  const whereConditions = [
    eq(users.type, "student"),
    user.schoolId ? eq(users.schoolId, user.schoolId) : undefined,
  ].filter(Boolean);

  const [dataResult, countResult] = await Promise.all([
    db
      .select()
      .from(users)
      .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions as any))
      .orderBy(sortBy && sortOrder === "asc" ? users[sortBy as keyof typeof users] : desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(users)
      .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions as any))
  ]);

  return successResponse({
    data: dataResult,
    pagination: {
      total: countResult[0]?.count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
}

async function listTeachers(auth: any, filters: any, offset: number, limit: number, sortBy?: string, sortOrder?: "asc" | "desc") {
  const { user } = auth;

  const whereConditions = [
    eq(users.type, "teacher"),
    user.schoolId ? eq(users.schoolId, user.schoolId) : undefined,
  ].filter(Boolean);

  const [dataResult, countResult] = await Promise.all([
    db
      .select()
      .from(users)
      .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions as any))
      .orderBy(sortBy && sortOrder === "asc" ? users[sortBy as keyof typeof users] : desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(users)
      .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions as any))
  ]);

  return successResponse({
    data: dataResult,
    pagination: {
      total: countResult[0]?.count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
}

async function listClasses(auth: any, filters: any, offset: number, limit: number, sortBy?: string, sortOrder?: "asc" | "desc") {
  const { user } = auth;

  const whereConditions = [
    eq(classes.isActive, true),
    user.schoolId ? eq(classes.schoolId, user.schoolId) : undefined,
  ].filter(Boolean);

  const [dataResult, countResult] = await Promise.all([
    db
      .select()
      .from(classes)
      .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions as any))
      .orderBy(desc(classes.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(classes)
      .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions as any))
  ]);

  return successResponse({
    data: dataResult,
    pagination: {
      total: countResult[0]?.count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
}

async function listSubjects(auth: any, filters: any, offset: number, limit: number, sortBy?: string, sortOrder?: "asc" | "desc") {
  const { user } = auth;

  const whereConditions = [
    eq(subjects.isActive, true),
    user.schoolId ? eq(subjects.schoolId, user.schoolId) : undefined,
  ].filter(Boolean);

  const [dataResult, countResult] = await Promise.all([
    db
      .select()
      .from(subjects)
      .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions as any))
      .orderBy(desc(subjects.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(subjects)
      .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions as any))
  ]);

  return successResponse({
    data: dataResult,
    pagination: {
      total: countResult[0]?.count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
}

async function listAssessments(auth: any, filters: any, offset: number, limit: number, sortBy?: string, sortOrder?: "asc" | "desc") {
  const { userId } = auth;

  const [dataResult, countResult] = await Promise.all([
    db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(assessments)
      .where(eq(assessments.userId, userId))
  ]);

  return successResponse({
    data: dataResult,
    pagination: {
      total: countResult[0]?.count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
}

async function listAttendance(auth: any, filters: any, offset: number, limit: number, sortBy?: string, sortOrder?: "asc" | "desc") {
  const { user } = auth;

  // If student, get their attendance
  if (user.type === "student") {
    const [dataResult, countResult] = await Promise.all([
      db
        .select()
        .from(attendance)
        .where(eq(attendance.studentId, user.id))
        .orderBy(desc(attendance.date))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(attendance)
        .where(eq(attendance.studentId, user.id))
    ]);

    return successResponse({
      data: dataResult,
      pagination: {
        total: countResult[0]?.count || 0,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
      },
    });
  }

  return badRequestResponse("Attendance list only available for students");
}

async function listHomework(auth: any, filters: any, offset: number, limit: number, sortBy?: string, sortOrder?: "asc" | "desc") {
  const { user } = auth;

  // If student, get homework for their class
  if (user.type === "student") {
    const [dataResult, countResult] = await Promise.all([
      db
        .select()
        .from(homework)
        .where(eq(homework.classId, user.classId || ""))
        .orderBy(desc(homework.dueDate))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(homework)
        .where(eq(homework.classId, user.classId || ""))
    ]);

    return successResponse({
      data: dataResult,
      pagination: {
        total: countResult[0]?.count || 0,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
      },
    });
  }

  return badRequestResponse("Homework list only available for students");
}

async function listEnrollments(auth: any, filters: any, offset: number, limit: number, sortBy?: string, sortOrder?: "asc" | "desc") {
  const { user } = auth;

  const [dataResult, countResult] = await Promise.all([
    db
      .select()
      .from(enrollments)
      .orderBy(desc(enrollments.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(enrollments)
  ]);

  return successResponse({
    data: dataResult,
    pagination: {
      total: countResult[0]?.count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
}

async function listSchools(auth: any, filters: any, offset: number, limit: number, sortBy?: string, sortOrder?: "asc" | "desc") {
  const [dataResult, countResult] = await Promise.all([
    db
      .select()
      .from(schools)
      .where(eq(schools.isActive, true))
      .orderBy(desc(schools.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(schools)
      .where(eq(schools.isActive, true))
  ]);

  return successResponse({
    data: dataResult,
    pagination: {
      total: countResult[0]?.count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
}

// ============================================================================
// RESOURCE GET HANDLERS
// ============================================================================

async function getStudent(id: string, auth: any) {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.type, "student")))
    .limit(1);

  if (result.length === 0) {
    return notFoundResponse("Student");
  }

  return successResponse({ data: result[0] });
}

async function getTeacher(id: string, auth: any) {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.type, "teacher")))
    .limit(1);

  if (result.length === 0) {
    return notFoundResponse("Teacher");
  }

  return successResponse({ data: result[0] });
}

async function getClass(id: string, auth: any) {
  const result = await db
    .select()
    .from(classes)
    .where(eq(classes.id, id))
    .limit(1);

  if (result.length === 0) {
    return notFoundResponse("Class");
  }

  return successResponse({ data: result[0] });
}

async function getSubject(id: string, auth: any) {
  const result = await db
    .select()
    .from(subjects)
    .where(eq(subjects.id, id))
    .limit(1);

  if (result.length === 0) {
    return notFoundResponse("Subject");
  }

  return successResponse({ data: result[0] });
}

async function getSchool(id: string, auth: any) {
  const result = await db
    .select()
    .from(schools)
    .where(eq(schools.id, id))
    .limit(1);

  if (result.length === 0) {
    return notFoundResponse("School");
  }

  return successResponse({ data: result[0] });
}

// ============================================================================
// DASHBOARD HANDLERS
// ============================================================================

async function getTeacherDashboard(teacherId: string) {
  // Get teacher's classes
  const teacherClasses = await db
    .select()
    .from(classes)
    .where(eq(classes.classTeacherId, teacherId));

  // Get total students
  const studentCount = await db
    .select({ count: count() })
    .from(enrollments)
    .where(inArray(enrollments.classId, teacherClasses.map((c) => c.id)));

  return successResponse({
    stats: {
      totalClasses: teacherClasses.length,
      totalStudents: studentCount[0]?.count || 0,
    },
    classes: teacherClasses,
  });
}

async function getStudentDashboard(studentId: string) {
  // Get student's enrollments
  const studentEnrollments = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.studentId, studentId));

  // Get recent assessment results
  const recentAssessments = await db
    .select()
    .from(assessments)
    .where(eq(assessments.userId, studentId))
    .orderBy(desc(assessments.createdAt))
    .limit(5);

  return successResponse({
    enrollments: studentEnrollments,
    recentAssessments,
  });
}

async function getSchoolAdminDashboard(userId: string, schoolId: string | null) {
  if (!schoolId) {
    return badRequestResponse("No school associated");
  }

  // Get school stats
  const [studentCount, teacherCount, classCount] = await Promise.all([
    db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.type, "student"))),
    db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.type, "teacher"))),
    db
      .select({ count: count() })
      .from(classes)
      .where(eq(classes.schoolId, schoolId)),
  ]);

  return successResponse({
    stats: {
      students: studentCount[0]?.count || 0,
      teachers: teacherCount[0]?.count || 0,
      classes: classCount[0]?.count || 0,
    },
  });
}

async function getCounselorDashboard(userId: string) {
  // Get at-risk students
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const atRiskAttendance = await db
    .select({
      studentId: attendance.studentId,
      present: sql<number>`COUNT(*) FILTER (WHERE status = 'present' OR status = 'late')`,
      total: count(),
    })
    .from(attendance)
    .where(gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0]))
    .groupBy(attendance.studentId);

  const atRiskCount = atRiskAttendance.filter(
    (r) => r.total > 0 && (r.present / r.total) * 100 < 70
  ).length;

  return successResponse({
    stats: {
      atRiskStudents: atRiskCount,
    },
  });
}

async function getPlatformAdminDashboard(userId: string) {
  const [schoolCount, totalStudents, totalTeachers] = await Promise.all([
    db.select({ count: count() }).from(schools),
    db.select({ count: count() }).from(users).where(eq(users.type, "student")),
    db.select({ count: count() }).from(users).where(eq(users.type, "teacher")),
  ]);

  return successResponse({
    stats: {
      schools: schoolCount[0]?.count || 0,
      totalStudents: totalStudents[0]?.count || 0,
      totalTeachers: totalTeachers[0]?.count || 0,
    },
  });
}

// ============================================================================
// ANALYTICS HANDLERS
// ============================================================================

async function getStudentAnalytics(auth: any, filters: any) {
  // Return student analytics data
  return successResponse({
    message: "Student analytics - to be implemented",
  });
}

async function getClassAnalytics(auth: any, filters: any) {
  // Return class analytics data
  return successResponse({
    message: "Class analytics - to be implemented",
  });
}

async function getAssessmentAnalytics(auth: any, filters: any) {
  // Return assessment analytics data
  return successResponse({
    message: "Assessment analytics - to be implemented",
  });
}

async function getAttendanceAnalytics(auth: any, filters: any) {
  // Return attendance analytics data
  return successResponse({
    message: "Attendance analytics - to be implemented",
  });
}

// ============================================================================
// CREATE HANDLERS
// ============================================================================

async function createStudent(data: any, auth: any) {
  const { user } = auth;

  // Generate ID
  const nanoidModule = await import("nanoid");
  const nanoid = nanoidModule.nanoid;
  const studentId = `stu-${nanoid()}`;

  const result = await db
    .insert(users)
    .values({
      id: studentId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      type: "student",
      schoolId: user.schoolId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  logger.info("Student created via unified API", { studentId, createdBy: user.id });

  return createdResponse({ data: result[0] });
}

async function createTeacher(data: any, auth: any) {
  const { user } = auth;

  const nanoidModule = await import("nanoid");
  const nanoid = nanoidModule.nanoid;
  const teacherId = `tch-${nanoid()}`;

  const result = await db
    .insert(users)
    .values({
      id: teacherId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      employeeId: data.employeeId,
      type: "teacher",
      schoolId: user.schoolId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  logger.info("Teacher created via unified API", { teacherId, createdBy: user.id });

  return createdResponse({ data: result[0] });
}

async function createClass(data: any, auth: any) {
  const { user } = auth;

  const nanoidModule = await import("nanoid");
  const nanoid = nanoidModule.nanoid;
  const classId = `cls-${nanoid()}`;

  const result = await db
    .insert(classes)
    .values({
      id: classId,
      name: data.name,
      grade: data.grade,
      section: data.section || "A",
      schoolId: user.schoolId,
      roomNumber: data.roomNumber || "TBD",
      capacity: data.capacity || 40,
      homeroomTeacherName: data.homeroomTeacherName || "Not Assigned",
      classTeacherName: data.classTeacherName || "Not Assigned",
      classTeacherId: data.classTeacherId || null,
      homeroomTeacherId: data.homeroomTeacherId || null,
      teacherId: data.teacherId || null,
      academicYear: data.academicYear || new Date().getFullYear().toString(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  logger.info("Class created via unified API", { classId, createdBy: user.id });

  return createdResponse({ data: result[0] });
}

async function createSubject(data: any, auth: any) {
  const { user } = auth;

  const nanoidModule = await import("nanoid");
  const nanoid = nanoidModule.nanoid;
  const subjectId = `sub-${nanoid()}`;

  const result = await db
    .insert(subjects)
    .values({
      id: subjectId,
      name: data.name,
      code: data.code,
      type: data.type || "core",
      grade: data.grade || null,
      description: data.description || null,
      schoolId: user.schoolId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  logger.info("Subject created via unified API", { subjectId, createdBy: user.id });

  return createdResponse({ data: result[0] });
}

async function createSchool(data: any, auth: any) {
  const nanoidModule = await import("nanoid");
  const nanoid = nanoidModule.nanoid;
  const schoolId = `sch-${nanoid()}`;

  const result = await db
    .insert(schools)
    .values({
      id: schoolId,
      name: data.name,
      code: data.code,
      type: data.type || "public",
      address: data.address || "TBD",
      city: data.city || "Thimphu",
      state: data.state || "Thimphu",
      country: data.country || "Bhutan",
      postalCode: data.postalCode || "00000",
      phone: data.phone || "0000000000",
      email: data.email || "school@example.com",
      website: data.website || "https://example.com",
      logo: data.logo || "",
      establishedYear: data.establishedYear || new Date().getFullYear(),
      accreditationStatus: data.accreditationStatus || "pending",
      maxStudents: data.maxStudents || 500,
      campusSize: data.campusSize || "Medium",
      facilities: data.facilities || [],
      board: data.board || "BCSE",
      principalName: data.principalName || "Not Assigned",
      principalEmail: data.principalEmail || "principal@example.com",
      principalPhone: data.principalPhone || "0000000000",
      counselorName: data.counselorName || "Not Assigned",
      counselorEmail: data.counselorEmail || "counselor@example.com",
      counselorPhone: data.counselorPhone || "0000000000",
      vicePrincipalName: data.vicePrincipalName || "Not Assigned",
      schoolType: data.schoolType || "public",
      level: data.level || "middle",
      contactEmail: data.contactEmail || data.email || "school@example.com",
      contactPhone: data.contactPhone || data.phone || "0000000000",
      isActive: true,
      subscriptionStatus: "pending_payment",
      setupComplete: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  logger.info("School created via unified API", { schoolId, createdBy: auth.userId });

  return createdResponse({ data: result[0] });
}

async function createAssessment(data: any, auth: any) {
  const { userId } = auth;

  const nanoidModule = await import("nanoid");
  const nanoid = nanoidModule.nanoid;
  const assessmentId = `asm-${nanoid()}`;

  const result = await db
    .insert(assessments)
    .values({
      id: assessmentId,
      userId: data.userId || userId,
      title: data.title || "Assessment",
      description: data.description || "",
      type: data.type,
      dueDate: data.dueDate || new Date().toISOString().split("T")[0],
      totalPoints: data.totalPoints || 100,
      passingScore: data.passingScore || 60,
      results: data.results || null,
      status: data.status || "published",
      completedAt: data.completedAt || null,
      startedAt: data.startedAt || null,
      classId: data.classId || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  logger.info("Assessment created via unified API", { assessmentId, userId });

  return createdResponse({ data: result[0] });
}

// ============================================================================
// UPDATE HANDLERS
// ============================================================================

async function updateStudent(id: string, data: any, auth: any) {
  const result = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  if (result.length === 0) {
    return notFoundResponse("Student");
  }

  logger.info("Student updated via unified API", { id, updatedBy: auth.userId });

  return updatedResponse({ data: result[0] });
}

async function updateTeacher(id: string, data: any, auth: any) {
  const result = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  if (result.length === 0) {
    return notFoundResponse("Teacher");
  }

  logger.info("Teacher updated via unified API", { id, updatedBy: auth.userId });

  return updatedResponse({ data: result[0] });
}

async function updateClass(id: string, data: any, auth: any) {
  const result = await db
    .update(classes)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(classes.id, id))
    .returning();

  if (result.length === 0) {
    return notFoundResponse("Class");
  }

  logger.info("Class updated via unified API", { id, updatedBy: auth.userId });

  return updatedResponse({ data: result[0] });
}

async function updateSubject(id: string, data: any, auth: any) {
  const result = await db
    .update(subjects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(subjects.id, id))
    .returning();

  if (result.length === 0) {
    return notFoundResponse("Subject");
  }

  logger.info("Subject updated via unified API", { id, updatedBy: auth.userId });

  return updatedResponse({ data: result[0] });
}

async function updateSchool(id: string, data: any, auth: any) {
  const result = await db
    .update(schools)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schools.id, id))
    .returning();

  if (result.length === 0) {
    return notFoundResponse("School");
  }

  logger.info("School updated via unified API", { id, updatedBy: auth.userId });

  return updatedResponse({ data: result[0] });
}

async function updateAssessment(id: string, data: any, auth: any) {
  const result = await db
    .update(assessments)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(assessments.id, id))
    .returning();

  if (result.length === 0) {
    return notFoundResponse("Assessment");
  }

  logger.info("Assessment updated via unified API", { id, updatedBy: auth.userId });

  return updatedResponse({ data: result[0] });
}

// ============================================================================
// DELETE HANDLERS
// ============================================================================

async function deleteStudent(id: string, auth: any) {
  // Soft delete
  const result = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (result.length === 0) {
    return notFoundResponse("Student");
  }

  logger.info("Student deleted via unified API", { id, deletedBy: auth.userId });

  return successResponse({ message: "Student deleted successfully" });
}

async function deleteTeacher(id: string, auth: any) {
  // Soft delete
  const result = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (result.length === 0) {
    return notFoundResponse("Teacher");
  }

  logger.info("Teacher deleted via unified API", { id, deletedBy: auth.userId });

  return successResponse({ message: "Teacher deleted successfully" });
}

async function deleteClass(id: string, auth: any) {
  // Soft delete
  const result = await db
    .update(classes)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(classes.id, id))
    .returning();

  if (result.length === 0) {
    return notFoundResponse("Class");
  }

  logger.info("Class deleted via unified API", { id, deletedBy: auth.userId });

  return successResponse({ message: "Class deleted successfully" });
}

async function deleteSubject(id: string, auth: any) {
  // Soft delete
  const result = await db
    .update(subjects)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(subjects.id, id))
    .returning();

  if (result.length === 0) {
    return notFoundResponse("Subject");
  }

  logger.info("Subject deleted via unified API", { id, deletedBy: auth.userId });

  return successResponse({ message: "Subject deleted successfully" });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getStudentGuidance(studentId: string) {
  const studentData = await db
    .select()
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);

  if (studentData.length === 0) {
    return notFoundResponse("Student");
  }

  const student = studentData[0];

  // Get assessment results
  const mbtiResult = await db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.userId, student.id),
        eq(assessments.type, "mbti")
      )
    )
    .orderBy(desc(assessments.createdAt))
    .limit(1);

  const riasecResult = await db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.userId, student.id),
        eq(assessments.type, "riasec")
      )
    )
    .orderBy(desc(assessments.createdAt))
    .limit(1);

  const grades = await getStudentGrades(student.id);

  const mbti = mbtiResult[0]?.results as any;
  const riasec = riasecResult[0]?.results as any;

  const mbtiType = mbti?.personalityType || "Unknown";
  const riasecCode = riasec?.topInterests
    ? (riasec.topInterests as string[]).slice(0, 3).join("")
    : undefined;

  const careerMatches = getCareerMatches(mbtiType, riasecCode);

  return successResponse({
    careerMatches: careerMatches.slice(0, 5),
    focusAreas: identifyWeakSubjects(grades),
    strengths: identifyStrengths(grades),
    learningStyle: getLearningStyle(mbtiType),
  });
}

async function getTeacherGuidance(teacherId: string, classId?: string) {
  // Get teacher's classes
  const teacherClasses = await db
    .select()
    .from(classes)
    .where(eq(classes.classTeacherId, teacherId));

  if (teacherClasses.length === 0) {
    return successResponse({
      message: "No classes assigned",
      classes: [],
    });
  }

  const classesWithInsights = await Promise.all(
    teacherClasses.map(async (cls) => {
      const insights = await getClassInsights(cls.id);
      return {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        ...insights,
      };
    })
  );

  return successResponse({
    classes: classesWithInsights,
  });
}

async function getCounselorAlerts() {
  // Reuse handleAlerts logic
  return await handleAlerts({} as any, "");
}

async function getParentGuidance(studentId: string) {
  return await getStudentGuidance(studentId);
}

async function getClassInsights(classId: string) {
  // Get enrolled students
  const enrollmentsData = await db
    .select({
      studentId: enrollments.studentId,
      studentFirstName: users.firstName,
      studentLastName: users.lastName,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .where(eq(enrollments.classId, classId));

  return {
    totalStudents: enrollmentsData.length,
    strugglingStudents: [],
    topPerformers: [],
    averageScore: 0,
  };
}

async function getStudentGrades(studentId: string): Promise<any[]> {
  // This would fetch from actual grades table
  return [];
}

function calculateAverageGrade(grades: any[]): number {
  if (grades.length === 0) return 0;
  return 75;
}

function generateLearningPlan(grades: any[]): any {
  return {
    weakAreas: [],
    strongAreas: [],
    recommendedFocus: [],
  };
}

function identifyWeakSubjects(grades: any[]): any[] {
  return [];
}

function identifyStrengths(grades: any[]): any[] {
  return [];
}

function identifySkillGaps(student: any, grades: any[]): any {
  return {};
}

function getLearningStyle(mbtiType: string): string {
  if (mbtiType.startsWith("N")) return "Visual and conceptual learning";
  if (mbtiType.startsWith("S")) return "Hands-on and practical learning";
  return "Balanced learning approach";
}

function getSuggestedAction(attendanceRate: number, mbtiType: string, grades: any[]): string {
  if (attendanceRate < 50) {
    return "Urgent: Schedule counseling session, check for personal/family issues";
  }
  if (mbtiType.startsWith("I")) {
    return "One-on-one conversation preferred, check if student is withdrawn due to stress";
  }
  return "Talk to student about barriers to attendance, provide support";
}

async function getTeacherRecommendations(classId: string) {
  const insights = await getClassInsights(classId);
  return successResponse({
    classId,
    ...insights,
  });
}

async function getStudentRecommendations(studentId: string) {
  const grades = await getStudentGrades(studentId);
  return successResponse({
    weakSubjects: identifyWeakSubjects(grades),
    recommendedResources: [],
  });
}
