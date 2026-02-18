/**
 * REPORT CARD TEMPLATES
 * Pre-configured templates for different school levels
 */

import type { ReportCardTemplate } from "@/lib/db/schema";

export interface ReportCardLayout {
  showLogo: boolean;
  showSchoolName: boolean;
  showStudentPhoto: boolean;
  showAttendance: boolean;
  showActivities: boolean;
  showRemarks: boolean;
  subjectsPerPage: number;
  orientation: "portrait" | "landscape";
}

export interface ReportCardColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface ReportCardSignatures {
  showClassTeacher: boolean;
  showPrincipal: boolean;
  showParent: boolean;
  customSignatures: Array<{ title: string; name: string }>;
}

export interface ReportCardTemplateConfig {
  name: string;
  description: string;
  templateType: "primary" | "middle" | "secondary" | "senior_secondary";
  layout: ReportCardLayout;
  colors: ReportCardColors;
  customSections?: Array<{ title: string; content: string; position: "header" | "footer" | "left" | "right" }>;
  signatures: ReportCardSignatures;
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

/**
 * Primary School Template (Classes PP-6)
 * Colorful, simple layout with larger fonts
 */
export const PRIMARY_TEMPLATE: ReportCardTemplateConfig = {
  name: "Primary School",
  description: "For classes PP to VI with colorful, child-friendly design",
  templateType: "primary",
  layout: {
    showLogo: true,
    showSchoolName: true,
    showStudentPhoto: true,
    showAttendance: true,
    showActivities: true,
    showRemarks: true,
    subjectsPerPage: 6,
    orientation: "portrait",
  },
  colors: {
    primary: "rgb(34, 139, 34)",    // Forest green
    secondary: "rgb(70, 130, 180)",  // Steel blue
    accent: "rgb(255, 165, 0)",      // Orange
    background: "rgb(255, 250, 240)", // Floral white
    text: "rgb(51, 51, 51)",          // Dark gray
  },
  signatures: {
    showClassTeacher: true,
    showPrincipal: true,
    showParent: true,
    customSignatures: [],
  },
};

/**
 * Middle School Template (Classes 7-8)
 * Balanced layout for growing students
 */
export const MIDDLE_TEMPLATE: ReportCardTemplateConfig = {
  name: "Middle School",
  description: "For classes VII and VIII with balanced layout",
  templateType: "middle",
  layout: {
    showLogo: true,
    showSchoolName: true,
    showStudentPhoto: true,
    showAttendance: true,
    showActivities: true,
    showRemarks: true,
    subjectsPerPage: 8,
    orientation: "portrait",
  },
  colors: {
    primary: "rgb(0, 102, 204)",      // Royal blue
    secondary: "rgb(102, 102, 102)",  // Gray
    accent: "rgb(204, 51, 0)",        // Red-orange
    background: "rgb(255, 255, 255)", // White
    text: "rgb(0, 0, 0)",             // Black
  },
  signatures: {
    showClassTeacher: true,
    showPrincipal: true,
    showParent: true,
    customSignatures: [],
  },
};

/**
 * Secondary School Template (Classes 9-10)
 * Professional layout for BCSE year students
 */
export const SECONDARY_TEMPLATE: ReportCardTemplateConfig = {
  name: "Secondary School",
  description: "For classes IX and X preparing for BCSE",
  templateType: "secondary",
  layout: {
    showLogo: true,
    showSchoolName: true,
    showStudentPhoto: true,
    showAttendance: true,
    showActivities: false,
    showRemarks: true,
    subjectsPerPage: 10,
    orientation: "landscape",
  },
  colors: {
    primary: "rgb(0, 51, 102)",       // Navy blue
    secondary: "rgb(128, 128, 128)",  // Gray
    accent: "rgb(204, 102, 0)",       // Rust
    background: "rgb(248, 248, 248)", // Light gray
    text: "rgb(0, 0, 0)",             // Black
  },
  signatures: {
    showClassTeacher: true,
    showPrincipal: true,
    showParent: false,
    customSignatures: [
      { title: "Exam Controller", name: "" },
    ],
  },
};

/**
 * Senior Secondary Template (Classes 11-12)
 * Professional layout for RUB-bound students
 */
export const SENIOR_SECONDARY_TEMPLATE: ReportCardTemplateConfig = {
  name: "Senior Secondary",
  description: "For classes XI and XII preparing for RUB",
  templateType: "senior_secondary",
  layout: {
    showLogo: true,
    showSchoolName: true,
    showStudentPhoto: true,
    showAttendance: true,
    showActivities: false,
    showRemarks: true,
    subjectsPerPage: 12,
    orientation: "landscape",
  },
  colors: {
    primary: "rgb(25, 25, 112)",      // Midnight blue
    secondary: "rgb(105, 105, 105)",  // Dim gray
    accent: "rgb(178, 34, 34)",       // Firebrick red
    background: "rgb(250, 250, 250)", // Snow white
    text: "rgb(0, 0, 0)",             // Black
  },
  signatures: {
    showClassTeacher: true,
    showPrincipal: true,
    showParent: false,
    customSignatures: [
      { title: "Exam Controller", name: "" },
      { title: "Vice Principal", name: "" },
    ],
  },
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const DEFAULT_TEMPLATES: Record<string, ReportCardTemplateConfig> = {
  primary: PRIMARY_TEMPLATE,
  middle: MIDDLE_TEMPLATE,
  secondary: SECONDARY_TEMPLATE,
  senior_secondary: SENIOR_SECONDARY_TEMPLATE,
};

/**
 * Get template by type
 */
export function getTemplate(templateType: string): ReportCardTemplateConfig {
  return DEFAULT_TEMPLATES[templateType] || MIDDLE_TEMPLATE;
}

/**
 * Get template by class grade
 */
export function getTemplateByGrade(grade: number): ReportCardTemplateConfig {
  if (grade <= 6) return PRIMARY_TEMPLATE;
  if (grade <= 8) return MIDDLE_TEMPLATE;
  if (grade <= 10) return SECONDARY_TEMPLATE;
  return SENIOR_SECONDARY_TEMPLATE;
}

/**
 * Grade to letter conversion (Bhutan grading scale)
 */
export function getGradeFromPercentage(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F"; // Fail
}

/**
 * Get grade point (4.0 scale)
 */
export function getGradePoint(percentage: number): number {
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.6;
  if (percentage >= 70) return 3.0;
  if (percentage >= 60) return 2.0;
  if (percentage >= 50) return 1.0;
  return 0.0;
}

/**
 * Get grade remarks
 */
export function getGradeRemarks(percentage: number): string {
  if (percentage >= 90) return "Outstanding";
  if (percentage >= 80) return "Excellent";
  if (percentage >= 70) return "Very Good";
  if (percentage >= 60) return "Good";
  if (percentage >= 50) return "Satisfactory";
  return "Needs Improvement";
}

/**
 * Convert database template to config
 */
export function dbTemplateToConfig(template: ReportCardTemplate): ReportCardTemplateConfig {
  return {
    name: template.name,
    description: template.description || "",
    templateType: template.templateType as any,
    layout: template.layout as ReportCardLayout,
    colors: template.colors as ReportCardColors,
    customSections: template.customSections as any,
    signatures: template.signatures as ReportCardSignatures,
  };
}
