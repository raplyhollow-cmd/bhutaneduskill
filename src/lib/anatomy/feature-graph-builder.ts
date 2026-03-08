/**
 * FEATURE GRAPH BUILDER
 *
 * Builds force-directed graph data from the Unified Feature system.
 * Creates a "star pattern" with all features connected to the central API node.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface GraphNode {
  id: string;
  name: string;
  group: string;
  val: number; // Node size
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  value?: number; // Link thickness
}

export interface FeatureGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ============================================================================
// FEATURE NAMES (static list to avoid import issues)
// ============================================================================

const FEATURE_NAMES = [
  // Core entities
  "users", "schools", "students", "teachers", "classes", "subjects",

  // Organization
  "departments", "batches", "sections",

  // Academic
  "attendance", "homework", "lessons", "exams", "results", "assessments",

  // Skills & Career
  "skills", "student_skills", "careers", "learning_paths",

  // Behavior & Support
  "behavior_records", "interventions", "counselor_notes",

  // Transport
  "transport", "transport_allocations", "transport_routes",

  // Library
  "library_books", "library_loans", "library_fines",

  // Fees & Billing
  "fees", "fee_payments", "invoices", "plans", "subscriptions",

  // Communication
  "announcements", "communication", "notifications", "messages",

  // Reports & Analytics
  "reports", "analytics", "audit_logs",

  // Resources
  "teaching_resources", "resource_shares",

  // Meetings & Sessions
  "meetings", "sessions", "appointments",

  // Ministry
  "workforce_data",

  // Timetable & Scheduling
  "timetable_slots", "schedule_exceptions",

  // Submissions & Assessment
  "submissions", "rubrics",

  // Career & Skills
  "roadmaps", "skill_gaps",

  // Counseling
  "treatment_plans",

  // Teacher Assignments
  "teacher_assignments",
];

// ============================================================================
// FEATURE GROUPS
// ============================================================================

const FEATURE_GROUPS: Record<string, string> = {
  // Core entities
  users: "Core",
  schools: "Core",
  students: "Core",
  teachers: "Core",
  classes: "Core",
  subjects: "Core",

  // Organization
  departments: "Organization",
  batches: "Organization",
  sections: "Organization",

  // Academic
  attendance: "Academic",
  homework: "Academic",
  lessons: "Academic",
  exams: "Academic",
  results: "Academic",
  assessments: "Academic",

  // Skills & Career
  skills: "Skills",
  student_skills: "Skills",
  careers: "Skills",
  learning_paths: "Skills",

  // Behavior & Support
  behavior_records: "Behavior",
  interventions: "Behavior",
  counselor_notes: "Behavior",

  // Transport
  transport: "Transport",
  transport_allocations: "Transport",
  transport_routes: "Transport",

  // Library
  library_books: "Library",
  library_loans: "Library",
  library_fines: "Library",

  // Fees & Billing
  fees: "Billing",
  fee_payments: "Billing",
  invoices: "Billing",
  plans: "Billing",
  subscriptions: "Billing",

  // Communication
  announcements: "Communication",
  communication: "Communication",
  notifications: "Communication",
  messages: "Communication",

  // Reports & Analytics
  reports: "Reports",
  analytics: "Reports",
  audit_logs: "Reports",

  // Resources
  teaching_resources: "Resources",
  resource_shares: "Resources",

  // Meetings & Sessions
  meetings: "Meetings",
  sessions: "Meetings",
  appointments: "Meetings",

  // Ministry
  workforce_data: "Ministry",

  // Timetable & Scheduling
  timetable_slots: "Academic",
  schedule_exceptions: "Academic",

  // Submissions & Assessment
  submissions: "Academic",
  rubrics: "Academic",

  // Career & Skills
  roadmaps: "Skills",
  skill_gaps: "Skills",

  // Counseling
  treatment_plans: "Behavior",

  // Teacher Assignments
  teacher_assignments: "Organization",
};

// ============================================================================
// DISPLAY NAMES
// ============================================================================

function getDisplayName(id: string): string {
  return id
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ============================================================================
// GROUP COLORS (for default state)
// ============================================================================

function getGroupColor(group: string): string {
  const colors: Record<string, string> = {
    Core: "#3b82f6", // Blue
    Organization: "#8b5cf6", // Purple
    Academic: "#10b981", // Green
    Skills: "#f59e0b", // Orange
    Behavior: "#ef4444", // Red
    Transport: "#06b6d4", // Cyan
    Library: "#ec4899", // Pink
    Billing: "#f97316", // Orange-red
    Communication: "#14b8a6", // Teal
    Reports: "#6366f1", // Indigo
    Resources: "#84cc16", // Lime
    Meetings: "#a855f7", // Purple
    Ministry: "#f43f5e", // Rose
  };
  return colors[group] || "#64748b"; // Default slate
}

// ============================================================================
// BUILD GRAPH
// ============================================================================

/**
 * Build force-directed graph data from features
 *
 * Creates a "star pattern" with:
 * - Center node: "api" (the universal API)
 * - Outer nodes: each feature resource
 * - Links: all features → center
 */
export function buildFeatureGraph(): FeatureGraphData {
  // Create center API node
  const centerNode: GraphNode = {
    id: "api-center",
    name: "Universal API",
    group: "System",
    val: 20, // Larger size for center
    color: "#8b5cf6", // Purple for AI/Brain metaphor
  };

  // Create feature nodes
  const featureNodes: GraphNode[] = FEATURE_NAMES.map((name) => ({
    id: name,
    name: getDisplayName(name),
    group: FEATURE_GROUPS[name] || "Other",
    val: 10, // Standard size
    color: getGroupColor(FEATURE_GROUPS[name] || "Other"),
  }));

  // Create links (all features → center)
  const links: GraphLink[] = FEATURE_NAMES.map((name) => ({
    source: name,
    target: "api-center",
    value: 1,
  }));

  return {
    nodes: [centerNode, ...featureNodes],
    links,
  };
}

/**
 * Build graph with health-based coloring
 */
export function buildHealthAwareGraph(
  healthMap: Map<string, { status: string; color: string }>
): FeatureGraphData {
  const baseGraph = buildFeatureGraph();

  // Update node colors based on health
  const nodes = baseGraph.nodes.map((node) => {
    if (node.id === "api-center") return node; // Keep center purple

    const health = healthMap.get(node.id);
    if (health) {
      return { ...node, color: health.color };
    }
    return node;
  });

  return {
    ...baseGraph,
    nodes,
  };
}

/**
 * Get node size based on health score
 */
export function getNodeSize(baseSize: number, healthScore: number): number {
  // Shrink unhealthy nodes slightly
  const multiplier = healthScore / 100;
  return Math.max(5, baseSize * (0.7 + 0.3 * multiplier));
}

// ============================================================================
// FEATURE LIST HELPERS
// ============================================================================

/**
 * Get all feature names
 */
export function getFeatureNames(): string[] {
  return [...FEATURE_NAMES];
}

/**
 * Get features by group
 */
export function getFeaturesByGroup(): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const name of FEATURE_NAMES) {
    const group = FEATURE_GROUPS[name] || "Other";
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(name);
  }

  return grouped;
}

/**
 * Get feature count
 */
export function getFeatureCount(): number {
  return FEATURE_NAMES.length;
}
