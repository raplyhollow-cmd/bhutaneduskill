/**
 * ID CARD TEMPLATES
 * Pre-configured ID card templates for students, teachers, and staff
 */

import jsPDF from "jspdf";

export interface IDCardDimensions {
  width: number;  // mm
  height: number; // mm
}

export interface IDCardLayout {
  orientation: "portrait" | "landscape";
  showPhoto: boolean;
  showBarcode: boolean;
  showQRCode: boolean;
  logoPosition: "left" | "center" | "right";
  photoPosition: "left" | "right";
}

export interface IDCardColors {
  background: string;
  primary: string;
  secondary: string;
  text: string;
  accent: string;
}

export interface IDCardTemplate {
  name: string;
  description: string;
  dimensions: IDCardDimensions;
  layout: IDCardLayout;
  colors: IDCardColors;
  fields: string[]; // Fields to display
  frontFields: Array<{ label: string; field: string; position: { x: number; y: number } }>;
  backFields: Array<{ label: string; field: string; position: { x: number; y: number } }>;
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

/**
 * Standard Student ID Card
 * Landscape orientation, 85.6mm x 53.98mm (credit card size)
 */
export const STUDENT_ID_TEMPLATE: IDCardTemplate = {
  name: "Standard Student ID",
  description: "Credit card size student ID with photo and QR code",
  dimensions: {
    width: 85.6,
    height: 53.98,
  },
  layout: {
    orientation: "landscape",
    showPhoto: true,
    showBarcode: false,
    showQRCode: true,
    logoPosition: "left",
    photoPosition: "left",
  },
  colors: {
    background: "rgb(255, 255, 255)",
    primary: "rgb(0, 102, 204)",     // Royal blue
    secondary: "rgb(255, 165, 0)",   // Orange
    text: "rgb(51, 51, 51)",         // Dark gray
    accent: "rgb(0, 51, 102)",       // Navy
  },
  fields: ["name", "id", "grade", "section", "dob", "bloodGroup", "emergency", "validThru"],
  frontFields: [
    { label: "Name", field: "name", position: { x: 35, y: 15 } },
    { label: "ID No", field: "id", position: { x: 35, y: 22 } },
    { label: "Class", field: "grade", position: { x: 55, y: 15 } },
    { label: "Section", field: "section", position: { x: 55, y: 22 } },
    { label: "Valid Thru", field: "validThru", position: { x: 35, y: 45 } },
  ],
  backFields: [
    { label: "Date of Birth", field: "dob", position: { x: 10, y: 15 } },
    { label: "Blood Group", field: "bloodGroup", position: { x: 50, y: 15 } },
    { label: "Emergency Contact", field: "emergency", position: { x: 10, y: 25 } },
    { label: "School Address", field: "address", position: { x: 10, y: 35 } },
  ],
};

/**
 * Teacher ID Card
 * Similar to student but with different fields and colors
 */
export const TEACHER_ID_TEMPLATE: IDCardTemplate = {
  name: "Teacher ID Card",
  description: "Professional ID card for teachers",
  dimensions: {
    width: 85.6,
    height: 53.98,
  },
  layout: {
    orientation: "landscape",
    showPhoto: true,
    showBarcode: true,
    showQRCode: true,
    logoPosition: "left",
    photoPosition: "left",
  },
  colors: {
    background: "rgb(255, 255, 255)",
    primary: "rgb(25, 25, 112)",     // Midnight blue
    secondary: "rgb(178, 34, 34)",   // Firebrick
    text: "rgb(0, 0, 0)",
    accent: "rgb(105, 105, 105)",    // Dim gray
  },
  fields: ["name", "employeeId", "department", "designation", "phone", "bloodGroup", "emergency"],
  frontFields: [
    { label: "Name", field: "name", position: { x: 35, y: 15 } },
    { label: "Employee ID", field: "employeeId", position: { x: 35, y: 22 } },
    { label: "Department", field: "department", position: { x: 35, y: 29 } },
    { label: "Designation", field: "designation", position: { x: 35, y: 36 } },
  ],
  backFields: [
    { label: "Contact", field: "phone", position: { x: 10, y: 15 } },
    { label: "Blood Group", field: "bloodGroup", position: { x: 50, y: 15 } },
    { label: "Emergency", field: "emergency", position: { x: 10, y: 25 } },
    { label: "Terms", field: "terms", position: { x: 10, y: 40 } },
  ],
};

/**
 * Staff ID Card
 * For non-teaching staff
 */
export const STAFF_ID_TEMPLATE: IDCardTemplate = {
  name: "Staff ID Card",
  description: "ID card for administrative and support staff",
  dimensions: {
    width: 85.6,
    height: 53.98,
  },
  layout: {
    orientation: "landscape",
    showPhoto: true,
    showBarcode: true,
    showQRCode: true,
    logoPosition: "left",
    photoPosition: "left",
  },
  colors: {
    background: "rgb(255, 255, 255)",
    primary: "rgb(34, 139, 34)",      // Forest green
    secondary: "rgb(70, 130, 180)",   // Steel blue
    text: "rgb(51, 51, 51)",
    accent: "rgb(0, 100, 0)",         // Dark green
  },
  fields: ["name", "employeeId", "role", "department", "phone", "emergency"],
  frontFields: [
    { label: "Name", field: "name", position: { x: 35, y: 15 } },
    { label: "Staff ID", field: "employeeId", position: { x: 35, y: 22 } },
    { label: "Role", field: "role", position: { x: 35, y: 29 } },
    { label: "Department", field: "department", position: { x: 35, y: 36 } },
  ],
  backFields: [
    { label: "Contact", field: "phone", position: { x: 10, y: 15 } },
    { label: "Emergency", field: "emergency", position: { x: 10, y: 25 } },
    { label: "Valid Thru", field: "validThru", position: { x: 10, y: 40 } },
  ],
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const ID_TEMPLATES: Record<string, IDCardTemplate> = {
  student: STUDENT_ID_TEMPLATE,
  teacher: TEACHER_ID_TEMPLATE,
  staff: STAFF_ID_TEMPLATE,
};

/**
 * Get template by user type
 */
export function getIDTemplate(userType: string): IDCardTemplate {
  switch (userType) {
    case "teacher":
      return TEACHER_ID_TEMPLATE;
    case "school_admin":
    case "admin":
    case "counselor":
      return STAFF_ID_TEMPLATE;
    case "student":
    default:
      return STUDENT_ID_TEMPLATE;
  }
}

/**
 * Get validation expiry date (end of academic year)
 */
export function getDefaultValidThru(): string {
  const now = new Date();
  const currentYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return `12/31/${currentYear}`;
}
