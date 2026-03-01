/**
 * Hostel Management Database Schema
 * Handles hostel buildings, rooms, allocations, attendance, and facilities
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum , json} from "drizzle-orm/pg-core";

// ============================================================================
// HOSTEL BUILDINGS
// ============================================================================

/**
 * Hostel buildings/dormitories
 */
export const hostelBuildings = pgTable("hostel_buildings", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Building details
  name: text("name").notNull(),
  code: text("code").unique(), // "H1", "GH" (Girls Hostel), etc.
  type: text("type").notNull(), // "boys", "girls", "staff", "mixed"
  description: text("description"),

  // Location
  address: text("address"),
  buildingNumber: text("building_number"),

  // Capacity
  totalFloors: integer("total_floors"),
  totalRooms: integer("total_rooms"),
  totalCapacity: integer("total_capacity"), // Total beds

  // Facilities
  hasCommonRoom: boolean("has_common_room").default(false),
  hasStudyRoom: boolean("has_study_room").default(false),
  hasTVRoom: boolean("has_tv_room").default(false),
  hasKitchen: boolean("has_kitchen").default(false),
  hasLaundry: boolean("has_laundry").default(false),
  hasGym: boolean("has_gym").default(false),
  hasPrayerRoom: boolean("has_prayer_room").default(false),

  // Utilities
  hasHotWater: boolean("has_hot_water").default(false),
  hasAC: boolean("has_ac").default(false),
  hasHeating: boolean("has_heating").default(false),
  hasWiFi: boolean("has_wifi").default(false),

  // Safety
  hasFireExtinguisher: boolean("has_fire_extinguisher").default(false),
  hasFireAlarm: boolean("has_fire_alarm").default(false),
  hasCCTV: boolean("has_cctv").default(false),
  hasSecurityGuard: boolean("has_security_guard").default(false),

  // Warden info
  wardenId: text("warden_id"), // Staff user ID
  wardenContact: text("warden_contact"),
  wardenResidence: text("warden_residence"), // Room number if living in hostel

  // Status
  status: text("status").notNull().default("active"), // "active", "maintenance", "inactive"

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// HOSTEL ROOMS
// ============================================================================

/**
 * Individual rooms within hostels
 */
export const hostelRooms = pgTable("hostel_rooms", {
  id: text("id").primaryKey(),
  hostelId: text("hostel_id").notNull(),
  schoolId: text("school_id").notNull(),

  // Room details
  roomNumber: text("room_number").notNull(),
  floor: integer("floor").notNull(),
  roomType: text("room_type").notNull(), // "single", "double", "triple", "dormitory", "suite"

  // Capacity
  capacity: integer("capacity").notNull(), // Number of beds
  occupiedBeds: integer("occupied_beds").default(0),

  // Facilities
  hasAttachedBathroom: boolean("has_attached_bathroom").default(false),
  hasBalcony: boolean("has_balcony").default(false),
  hasAC: boolean("has_ac").default(false),
  hasStudyTable: boolean("has_study_table").default(true),
  hasWardrobe: boolean("has_wardrobe").default(true),

  // Dimensions
  area: integer("area"), // Square feet

  // Bed details
  bedDetails: json("bed_details").$type<Array<{
    bedNumber: string;
    occupied: boolean;
    occupantId?: string;
  }>>(),

  // Condition
  condition: text("condition").notNull().default("good"), // "excellent", "good", "fair", "needs_repair"

  // Status
  status: text("status").notNull().default("available"), // "available", "full", "maintenance", "unavailable"
  maintenanceReason: text("maintenance_reason"),

  // Last maintenance
  lastMaintenanceDate: text("last_maintenance_date"),
  nextMaintenanceDate: text("next_maintenance_date"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// HOSTEL ALLOCATIONS
// ============================================================================

/**
 * Student hostel room allocations
 */
export const hostelAllocations = pgTable("hostel_allocations", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Student
  studentId: text("student_id").notNull(),
  studentName: text("student_name"),

  // Allocation details
  hostelId: text("hostel_id").notNull(),
  roomId: text("room_id").notNull(),
  bedNumber: text("bed_number"),

  // Allocation period
  allocationDate: text("allocation_date").notNull(), // ISO date
  academicYear: text("academic_year").notNull(),
  semester: text("semester"), // "spring", "fall", "summer", "winter"

  // Status
  status: text("status").notNull().default("active"), // "active", "inactive", "pending_evacuation", "completed"

  // Checkout
  checkoutDate: text("checkout_date"),
  checkoutReason: text("checkout_reason"),
  checkoutProcessedBy: text("checkout_processed_by"),

  // Fees
  feeType: text("fee_type"), // "annual", "semester", "monthly"
  feeAmount: integer("fee_amount"),
  feePaid: integer("fee_paid").default(0),
  feeWaived: integer("fee_waived").default(0),
  feeOutstanding: integer("fee_outstanding"),

  // Emergency contact
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelation: text("emergency_contact_relation"),

  // Guardian/Local guardian
  localGuardianName: text("local_guardian_name"),
  localGuardianPhone: text("local_guardian_phone"),
  localGuardianAddress: text("local_guardian_address"),

  // Medical info
  bloodGroup: text("blood_group"),
  medicalConditions: text("medical_conditions"),
  allergies: text("allergies"),

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// HOSTEL ATTENDANCE
// ============================================================================

/**
 * Daily hostel attendance (night stay)
 */
export const hostelAttendance = pgTable("hostel_attendance", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Student and room
  studentId: text("student_id").notNull(),
  roomId: text("room_id"),
  hostelId: text("hostel_id"),

  // Date
  date: text("date").notNull(), // ISO date

  // Attendance status
  status: text("status").notNull(), // "present", "absent", "late", "excused", "on_leave"

  // Timing
  checkInTime: text("check_in_time"), // HH:MM
  checkOutTime: text("check_out_time"), // HH:MM

  // Leave details
  leaveType: text("leave_type"), // "weekend", "holiday", "permission", "medical", "emergency"
  leaveReason: text("leave_reason"),
  leaveApprovedBy: text("leave_approved_by"), // Staff user ID

  // Gate pass
  gatePassNumber: text("gate_pass_number"),
  gatePassIssuedBy: text("gate_pass_issued_by"),
  gatePassIssuedAt: text("gate_pass_issued_at"),

  // Return details
  expectedReturnDate: text("expected_return_date"),
  actualReturnDate: text("actual_return_date"),
  returnLateBy: integer("return_late_by"), // Hours

  // Remarks
  remarks: text("remarks"),
  markedBy: text("marked_by"), // Warden/user ID

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// ROOM INSPECTIONS
// ============================================================================

/**
 * Regular room inspections by wardens
 */
export const roomInspections = pgTable("room_inspections", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Room
  roomId: text("room_id").notNull(),
  hostelId: text("hostel_id"),

  // Inspection details
  inspectionDate: text("inspection_date").notNull(), // ISO date
  inspectionType: text("inspection_type").notNull(), // "routine", "surprise", "complaint_based"

  // Inspector
  inspectedBy: text("inspected_by").notNull(), // Warden user ID
  inspectorName: text("inspector_name"),
  inspectorRole: text("inspector_role"),

  // Scores (1-5 scale)
  cleanlinessScore: integer("cleanliness_score"), // 1-5
  disciplineScore: integer("discipline_score"), // 1-5
  safetyScore: integer("safety_score"), // 1-5
  overallScore: integer("overall_score"), // 1-5

  // Findings
  findings: json("findings").$type<Array<{
    category: string;
    issue: string;
    severity: "low" | "medium" | "high";
    actionRequired: boolean;
  }>>(),

  // Violations
  violationsFound: boolean("violations_found").default(false),
  violationDetails: text("violation_details"),
  violationPenalty: text("violation_penalty"),

  // Prohibited items found
  prohibitedItems: json("prohibited_items").$type<string[]>(),

  // Follow-up required
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: text("follow_up_date"),
  followUpActions: text("follow_up_actions"),

  // Status
  status: text("status").notNull().default("completed"), // "completed", "follow_up_pending", "resolved"

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// HOSTEL LEAVE REQUESTS
// ============================================================================

/**
 * Student leave requests for hostel
 */
export const hostelLeaveRequests = pgTable("hostel_leave_requests", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Student
  studentId: text("student_id").notNull(),
  studentName: text("student_name"),
  roomId: text("room_id"),
  hostelId: text("hostel_id"),

  // Leave details
  leaveType: text("leave_type").notNull(), // "weekend", "holiday", "permission", "medical", "emergency"
  leaveReason: text("leave_reason").notNull(),

  // Dates
  fromDate: text("from_date").notNull(), // ISO date
  fromTime: text("from_time"), // HH:MM
  toDate: text("to_date").notNull(), // ISO date
  toTime: text("to_time"), // HH:MM
  numberOfDays: integer("number_of_days"),

  // Destination
  destination: text("destination"), // Where going
  purpose: text("purpose"), // Detailed purpose

  // Accompanying person
  companionName: text("companion_name"),
  companionRelation: text("companion_relation"),
  companionPhone: text("companion_phone"),

  // Parent approval
  parentApproved: boolean("parent_approved").default(false),
  parentApprovalDate: text("parent_approval_date"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),

  // Status
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected", "cancelled", "completed"

  // Approval
  approvedBy: text("approved_by"), // Warden user ID
  approvalDate: text("approval_date"),
  approvalNotes: text("approval_notes"),
  rejectionReason: text("rejection_reason"),

  // Gate pass
  gatePassIssued: boolean("gate_pass_issued").default(false),
  gatePassNumber: text("gate_pass_number"),

  // Actuals
  actualDepartureTime: text("actual_departure_time"),
  actualReturnTime: text("actual_return_time"),
  lateReturnReason: text("late_return_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// HOSTEL COMPLAINTS
// ============================================================================

/**
 * Hostel maintenance and discipline complaints
 */
export const hostelComplaints = pgTable("hostel_complaints", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Complainant
  complainantId: text("complainant_id").notNull(), // Student or Staff ID
  complainantName: text("complainant_name"),
  complainantType: text("complainant_type").notNull(), // "student", "staff", "parent"

  // Category
  category: text("category").notNull(), // "maintenance", "electricity", "plumbing", "furniture", "food", "discipline", "other"

  // Details
  title: text("title").notNull(),
  description: text("description").notNull(),

  // Location
  hostelId: text("hostel_id"),
  roomId: text("room_id"),
  location: text("location"), // Specific location description

  // Urgency
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "emergency"

  // Status
  status: text("status").notNull().default("open"), // "open", "in_progress", "resolved", "rejected", "closed"

  // Resolution
  assignedTo: text("assigned_to"), // Staff user ID
  assignedDate: text("assigned_date"),
  resolutionDetails: text("resolution_details"),
  resolvedDate: text("resolved_date"),
  resolvedBy: text("resolved_by"),

  // Feedback
  complainantSatisfaction: integer("complainant_satisfaction"), // 1-5 rating
  complainantFeedback: text("complainant_feedback"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// HOSTEL VISITORS
// ============================================================================

/**
 * Visitor log for hostel
 */
export const hostelVisitors = pgTable("hostel_visitors", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Visitor details
  visitorName: text("visitor_name").notNull(),
  visitorPhone: text("visitor_phone"),
  visitorEmail: text("visitor_email"),
  visitorIdProof: text("visitor_id_proof"), // "CID", "passport", etc.
  visitorIdNumber: text("visitor_id_number"),

  // Relation to student
  relation: text("relation").notNull(), // "parent", "guardian", "sibling", "relative", "friend"

  // Student being visited
  studentId: text("student_id").notNull(),
  studentName: text("student_name"),
  roomId: text("room_id"),
  hostelId: text("hostel_id"),

  // Visit details
  visitDate: text("visit_date").notNull(), // ISO date
  checkInTime: text("check_in_time").notNull(), // HH:MM
  checkOutTime: text("check_out_time"), // HH:MM
  purpose: text("purpose"),

  // Approval
  approvedBy: text("approved_by"), // Warden who approved
  approvalNotes: text("approval_notes"),

  // Items brought/given
  itemsBrought: json("items_brought").$type<string[]>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// HOSTEL FACILITIES
// ============================================================================

/**
 * Common facilities and amenities in hostels
 */
export const hostelFacilities = pgTable("hostel_facilities", {
  id: text("id").primaryKey(),
  hostelId: text("hostel_id").notNull(),
  schoolId: text("school_id").notNull(),

  // Facility details
  name: text("name").notNull(),
  type: text("type").notNull(), // "recreation", "study", "dining", "washing", "sports", "other"
  description: text("description"),

  // Location
  floor: integer("floor"),
  roomNumber: text("room_number"),

  // Capacity
  capacity: integer("capacity"), // Max users at once

  // Availability
  openTime: text("open_time"), // HH:MM
  closeTime: text("close_time"), // HH:MM
  availableDays: json("available_days").$type<string[]>(), // ["monday", "tuesday", ...]

  // Equipment
  equipment: json("equipment").$type<Array<{
    name: string;
    quantity: number;
    condition: string;
  }>>(),

  // Status
  status: text("status").notNull().default("active"), // "active", "maintenance", "inactive"

  // Rules
  rules: json("rules").$type<string[]>(),

  // In charge
  inChargeStaffId: text("in_charge_staff_id"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// HOSTEL MESS (Dining) MANAGEMENT
// ============================================================================

/**
 * Mess/dining hall management
 */
export const hostelMess = pgTable("hostel_mess", {
  id: text("id").primaryKey(),
  hostelId: text("hostel_id").notNull(),
  schoolId: text("school_id").notNull(),

  // Mess details
  name: text("name").notNull(),
  type: text("type").notNull(), // "veg", "non_veg", "both"

  // Capacity
  seatingCapacity: integer("seating_capacity"),

  // Timings
  breakfastStart: text("breakfast_start"), // HH:MM
  breakfastEnd: text("breakfast_end"),
  lunchStart: text("lunch_start"),
  lunchEnd: text("lunch_end"),
  dinnerStart: text("dinner_start"),
  dinnerEnd: text("dinner_end"),

  // Menu
  weeklyMenu: json("weekly_menu").$type<{
    monday: { breakfast: string[]; lunch: string[]; dinner: string[]; snacks?: string[] };
    tuesday: { breakfast: string[]; lunch: string[]; dinner: string[]; snacks?: string[] };
    wednesday: { breakfast: string[]; lunch: string[]; dinner: string[]; snacks?: string[] };
    thursday: { breakfast: string[]; lunch: string[]; dinner: string[]; snacks?: string[] };
    friday: { breakfast: string[]; lunch: string[]; dinner: string[]; snacks?: string[] };
    saturday: { breakfast: string[]; lunch: string[]; dinner: string[]; snacks?: string[] };
    sunday: { breakfast: string[]; lunch: string[]; dinner: string[]; snacks?: string[] };
  }>(),

  // Staff
  messManager: text("mess_manager"), // Staff user ID
  cooks: json("cooks").$type<string[]>(), // Staff IDs

  // Status
  status: text("status").notNull().default("active"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// MESS ATTENDANCE
// ============================================================================

/**
 * Daily meal attendance
 */
export const messAttendance = pgTable("mess_attendance", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Student
  studentId: text("student_id").notNull(),
  hostelId: text("hostel_id"),

  // Date
  date: text("date").notNull(), // ISO date

  // Meal attendance
  breakfastPresent: boolean("breakfast_present"),
  lunchPresent: boolean("lunch_present"),
  dinnerPresent: boolean("dinner_present"),
  snacksPresent: boolean("snacks_present"),

  // Special meal requests
  specialDiet: text("special_diet"), // "vegan", "gluten_free", etc.
  skipReason: text("skip_reason"), // If skipped meals

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// HOSTEL FEES
// ============================================================================

/**
 * Hostel fee structure and payments
 */
export const hostelFees = pgTable("hostel_fees", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Applicability
  academicYear: text("academic_year").notNull(),
  roomType: text("room_type").notNull(), // "single", "double", "triple", "dormitory"

  // Fee amounts
  admissionFee: integer("admission_fee"), // One-time
  securityDeposit: integer("security_deposit"), // Refundable
  annualFee: integer("annual_fee"),
  semesterFee: integer("semester_fee"),
  monthlyFee: integer("monthly_fee"),

  // Mess fees
  messFeeIncluded: boolean("mess_fee_included").default(true),
  monthlyMessFee: integer("monthly_mess_fee"),

  // Other charges
  electricityCharge: integer("electricity_charge"), // Monthly
  waterCharge: integer("water_charge"), // Monthly
  maintenanceCharge: integer("maintenance_charge"), // Annual

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// HOSTEL PAYMENTS
// ============================================================================

/**
 * Individual hostel fee payments
 */
export const hostelPayments = pgTable("hostel_payments", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Student
  studentId: text("student_id").notNull(),
  allocationId: text("allocation_id").notNull(),

  // Payment details
  feeType: text("fee_type").notNull(), // "admission", "security", "annual", "semester", "monthly", "mess"
  amount: integer("amount").notNull(),
  paymentDate: text("payment_date").notNull(), // ISO date
  paymentMethod: text("payment_method"), // "cash", "online", "cheque", "card"

  // Period covered
  forMonth: text("for_month"), // YYYY-MM format for monthly fees
  forSemester: text("for_semester"),
  forYear: text("for_year"),

  // Reference
  receiptNumber: text("receipt_number").unique(),
  receiptUrl: text("receipt_url"),
  transactionId: text("transaction_id"), // For online payments

  // Status
  status: text("status").notNull().default("paid"), // "paid", "pending", "failed", "refunded"

  // Refund
  refundedAmount: integer("refunded_amount"),
  refundReason: text("refund_reason"),
  refundDate: text("refund_date"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// HOSTEL RULES
// ============================================================================

/**
 * Hostel rules and regulations
 */
export const hostelRules = pgTable("hostel_rules", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Rule details
  title: text("title").notNull(),
  category: text("category").notNull(), // "general", "discipline", "safety", "timing", "visitors", "prohibited"
  description: text("description").notNull(),

  // Applicability
  appliesToHostel: text("applies_to_hostel"), // Specific hostel ID, or null for all
  appliesToRole: text("applies_to_role"), // "all", "students", "staff"

  // Priority
  severity: text("severity").notNull().default("medium"), // "low", "medium", "high", "critical"

  // Penalty for violation
  penaltyType: text("penalty_type"), // "warning", "fine", "suspension", "eviction"
  penaltyAmount: integer("penalty_amount"),
  penaltyDescription: text("penalty_description"),

  // Display
  displayOrder: integer("display_order"),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type HostelBuilding = typeof hostelBuildings.$inferSelect;
export type HostelRoom = typeof hostelRooms.$inferSelect;
export type HostelAllocation = typeof hostelAllocations.$inferSelect;
export type HostelAttendance = typeof hostelAttendance.$inferSelect;
export type RoomInspection = typeof roomInspections.$inferSelect;
export type HostelLeaveRequest = typeof hostelLeaveRequests.$inferSelect;
export type HostelComplaint = typeof hostelComplaints.$inferSelect;
export type HostelVisitor = typeof hostelVisitors.$inferSelect;
export type HostelFacility = typeof hostelFacilities.$inferSelect;
export type HostelMess = typeof hostelMess.$inferSelect;
export type MessAttendance = typeof messAttendance.$inferSelect;
export type HostelFee = typeof hostelFees.$inferSelect;
export type HostelPayment = typeof hostelPayments.$inferSelect;
export type HostelRule = typeof hostelRules.$inferSelect;
