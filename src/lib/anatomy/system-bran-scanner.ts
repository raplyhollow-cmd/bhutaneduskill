/**
 * SYSTEM BRAIN SCANNER
 *
 * Analyzes the codebase to detect:
 * - Database schema connections
 * - Feature dependencies
 * - API integrations
 * - Missing connections
 * - Orphaned features
 *
 * This is the "brain" that knows what's connected and what's not.
 */

import fs from "fs";
import path from "path";

// ============================================================================
// TYPES
// ============================================================================

export interface SystemNode {
  id: string;
  name: string;
  type: "table" | "feature" | "api" | "page" | "component";
  status: "healthy" | "degraded" | "orphaned" | "missing";
  connections: string[];
  dependencies: string[];
  file?: string;
}

export interface ConnectionInfo {
  source: string;
  target: string;
  type: "fk" | "reference" | "import" | "api";
  strength: "strong" | "weak" | "missing";
}

export interface BrainScanResult {
  nodes: SystemNode[];
  connections: ConnectionInfo[];
  health: {
    total: number;
    healthy: number;
    orphaned: number;
    missing: number;
    score: number;
  };
  issues: Array<{
    type: "orphan" | "missing_connection" | "broken_import" | "deprecated";
    severity: "critical" | "warning" | "info";
    message: string;
    fix?: string;
  }>;
}

// ============================================================================
// DATABASE TABLE CONNECTIONS (from schema analysis)
// ============================================================================

const KNOWN_FOREIGN_KEYS: Record<string, string[]> = {
  // Core tables
  students: ["schoolId", "userId", "classId", "sectionId", "guardianId"],
  teachers: ["schoolId", "userId", "departmentId"],
  classes: ["schoolId", "grade", "section"],
  subjects: ["schoolId"],
  schools: [], // Root table

  // Academic
  attendance: ["studentId", "classId", "subjectId", "teacherId", "date"],
  homework: ["classId", "subjectId", "teacherId", "schoolId"],
  submissions: ["homeworkId", "studentId"],
  exams: ["classId", "subjectId", "schoolId", "academicYearId"],
  results: ["examId", "studentId", "subjectId"],
  assessments: ["studentId", "type", "schoolId"],

  // Skills & Career
  skills: ["category", "schoolId"],
  student_skills: ["studentId", "skillId"],
  careers: [],
  learning_paths: ["studentId", "careerId"],
  career_roadmaps: ["careerId"],

  // Behavior
  behavior_records: ["studentId", "reportedBy", "schoolId"],
  interventions: ["studentId", "counselorId", "schoolId"],
  counselor_notes: ["studentId", "counselorId"],

  // Transport
  transport_routes: ["schoolId"],
  transport_allocations: ["routeId", "studentId", "stopId"],
  transport: ["schoolId"],

  // Library
  library_books: ["schoolId"],
  library_loans: ["bookId", "studentId", "schoolId"],
  library_fines: ["loanId", "studentId"],

  // Fees & Billing
  fees: ["studentId", "feeType", "schoolId"],
  fee_payments: ["feeId", "studentId", "schoolId"],
  invoices: ["schoolId", "studentId"],
  subscriptions: ["schoolId", "planId"],
  plans: [], // Root table

  // Payroll
  payroll_records: ["schoolId", "employeeId"],
  employee_salaries: ["userId", "schoolId", "structureId"],
  salary_structures: ["schoolId"],

  // Communication
  announcements: ["schoolId", "senderId"],
  notifications: ["userId", "schoolId"],
  messages: ["senderId", "receiverId", "schoolId"],

  // Meetings & Sessions
  meetings: ["schoolId", "hostId"],
  sessions: ["studentId", "counselorId"],
  appointments: ["studentId", "counselorId", "schoolId"],

  // Reports & Analytics
  reports: ["schoolId", "type"],
  analytics: ["schoolId"],

  // Timetable
  timetable_slots: ["schoolId", "classId", "subjectId", "teacherId"],
  schedule_exceptions: ["schoolId", "classId"],

  // HR
  departments: ["schoolId"],
  leave_requests: ["userId", "schoolId", "approverId"],
};

// Map foreign keys to target tables
const FK_TARGET_MAP: Record<string, string> = {
  schoolId: "schools",
  userId: "users",
  studentId: "students",
  teacherId: "teachers",
  classId: "classes",
  subjectId: "subjects",
  sectionId: "sections",
  departmentId: "departments",
  guardianId: "users",
  examId: "exams",
  homeworkId: "homework",
  loanId: "library_loans",
  feeId: "fees",
  planId: "plans",
  routeId: "transport_routes",
  stopId: "transport_stops",
  bookId: "library_books",
  careerId: "careers",
  counselorId: "users",
  skillId: "skills",
  structureId: "salary_structures",
  senderId: "users",
  receiverId: "users",
  hostId: "users",
  approverId: "users",
  reportedBy: "users",
  academicYearId: "academic_years",
};

// ============================================================================
// FEATURE DEFINITIONS (from src/features/)
// ============================================================================

const UNIFIED_API_RESOURCES = [
  "users", "schools", "students", "teachers", "classes", "subjects",
  "departments", "batches", "sections",
  "attendance", "homework", "lessons", "exams", "results", "assessments",
  "skills", "student_skills", "careers", "learning_paths",
  "behavior_records", "interventions", "counselor_notes",
  "transport", "transport_allocations", "transport_routes",
  "library_books", "library_loans", "library_fines",
  "fees", "fee_payments", "invoices", "plans", "subscriptions",
  "announcements", "communication", "notifications", "messages",
  "reports", "analytics", "audit_logs",
  "teaching_resources", "resource_shares",
  "meetings", "sessions", "appointments",
  "workforce_data",
  "timetable_slots", "schedule_exceptions",
  "submissions", "rubrics",
  "roadmaps", "skill_gaps",
  "treatment_plans",
  "teacher_assignments",
  "leave_requests",
  "journal",
  "grade_configurations",
  "rub_colleges",
  // Payroll
  "payroll_records", "employee_salaries", "salary_structures", "payroll_runs",
];

// ============================================================================
// SCAN FUNCTIONS
// ============================================================================

/**
 * Main scan function - builds complete brain map
 */
export function scanSystemBrain(): BrainScanResult {
  const nodes: SystemNode[] = [];
  const connections: ConnectionInfo[] = [];
  const issues: BrainScanResult["issues"] = [];

  // 1. Scan database tables
  for (const [tableName, fks] of Object.entries(KNOWN_FOREIGN_KEYS)) {
    const node: SystemNode = {
      id: tableName,
      name: tableName,
      type: "table",
      status: "healthy",
      connections: [],
      dependencies: [],
    };

    // Build connections from foreign keys
    for (const fk of fks) {
      const targetTable = FK_TARGET_MAP[fk];
      if (targetTable) {
        node.connections.push(targetTable);
        connections.push({
          source: tableName,
          target: targetTable,
          type: "fk",
          strength: "strong",
        });
      }
    }

    nodes.push(node);
  }

  // 2. Scan feature definitions
  for (const resourceName of UNIFIED_API_RESOURCES) {
    const existingNode = nodes.find(n => n.id === resourceName);
    if (existingNode) {
      existingNode.type = "feature";
      // Check if API route exists
      const apiPath = path.join(process.cwd(), "src", "app", "api", "resources", resourceName);
      const hasApiRoute = fs.existsSync(apiPath);
      if (!hasApiRoute) {
        existingNode.status = "missing";
        issues.push({
          type: "missing_connection",
          severity: "warning",
          message: `Feature "${resourceName}" missing API route`,
          fix: `Create /api/resources/${resourceName}/route.ts`,
        });
      }
    } else {
      // Feature exists but no database table - might be virtual
      nodes.push({
        id: resourceName,
        name: resourceName,
        type: "feature",
        status: "healthy",
        connections: ["api-center"],
        dependencies: [],
      });
      connections.push({
        source: resourceName,
        target: "api-center",
        type: "api",
        strength: "strong",
      });
    }
  }

  // 3. Detect orphaned nodes (no connections)
  for (const node of nodes) {
    if (node.connections.length === 0 && node.id !== "schools" && node.id !== "users" && node.id !== "plans") {
      node.status = "orphaned";
      issues.push({
        type: "orphan",
        severity: "info",
        message: `Table "${node.id}" has no foreign key connections`,
        fix: `Add foreign keys to connect to related tables`,
      });
    }
  }

  // 4. Check for critical missing tables
  const criticalTables = ["users", "schools", "students", "teachers", "classes"];
  for (const table of criticalTables) {
    if (!nodes.find(n => n.id === table)) {
      issues.push({
        type: "missing_connection",
        severity: "critical",
        message: `Critical table "${table}" not found in schema`,
        fix: `Create ${table} table in database schema`,
      });
    }
  }

  // 5. Calculate health score
  const healthy = nodes.filter(n => n.status === "healthy").length;
  const orphaned = nodes.filter(n => n.status === "orphaned").length;
  const missing = nodes.filter(n => n.status === "missing").length;
  const total = nodes.length;
  const score = Math.round((healthy / total) * 100);

  return {
    nodes,
    connections,
    health: {
      total,
      healthy,
      orphaned,
      missing,
      score,
    },
    issues,
  };
}

/**
 * Get nodes grouped by type
 */
export function getNodesByType(scan: BrainScanResult): Record<string, SystemNode[]> {
  const grouped: Record<string, SystemNode[]> = {};
  for (const node of scan.nodes) {
    if (!grouped[node.type]) {
      grouped[node.type] = [];
    }
    grouped[node.type].push(node);
  }
  return grouped;
}

/**
 * Get connections for a specific node
 */
export function getNodeConnections(nodeId: string, scan: BrainScanResult): {
  incoming: ConnectionInfo[];
  outgoing: ConnectionInfo[];
} {
  const incoming = scan.connections.filter(c => c.target === nodeId);
  const outgoing = scan.connections.filter(c => c.source === nodeId);
  return { incoming, outgoing };
}

/**
 * Get critical issues (severity: critical or warning)
 */
export function getCriticalIssues(scan: BrainScanResult): BrainScanResult["issues"] {
  return scan.issues.filter(i => i.severity === "critical" || i.severity === "warning");
}
