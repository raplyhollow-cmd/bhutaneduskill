/**
 * Transport Management Database Schema
 * Handles school bus routes, vehicle tracking, and driver management
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum , json} from "drizzle-orm/pg-core";

// ============================================================================
// VEHICLES
// ============================================================================

/**
 * School transport vehicles (buses, vans)
 */
export const vehicles = pgTable("vehicles", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Vehicle details
  registrationNumber: text("registration_number").notNull().unique(),
  vehicleNumber: text("vehicle_number"), // License plate number
  vehicleType: text("vehicle_type").notNull(), // "bus", "van", "minibus"
  make: text("make"), // Toyota, Tata, etc.
  model: text("model"),
  year: integer("year"),
  color: text("color"),

  // Capacity
  seatingCapacity: integer("seating_capacity").notNull(),
  standingCapacity: integer("standing_capacity").default(0),

  // Features
  hasAC: boolean("has_ac").default(false),
  hasCCTV: boolean("has_cctv").default(false),
  hasGPS: boolean("has_gps").default(false),
  hasSpeedLimiter: boolean("has_speed_limiter").default(false),

  // Documents
  insuranceExpiry: text("insurance_expiry"), // ISO date
  fitnessExpiry: text("fitness_expiry"), // ISO date
  pollutionExpiry: text("pollution_expiry"), // ISO date

  // Status
  status: text("status").notNull().default("active"), // "active", "maintenance", "inactive", "retired"

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// DRIVERS
// ============================================================================

/**
 * Transport vehicle drivers
 */
export const drivers = pgTable("drivers", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Personal details
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  phone: text("phone").notNull(),
  emergencyContact: text("emergency_contact"),
  address: text("address"),

  // Driver details
  licenseNumber: text("license_number").notNull(),
  licenseType: text("license_type"), // "heavy", "light", "transport"
  licenseExpiry: text("licence_expiry"), // ISO date
  badgeNumber: text("badge_number"),

  // Employment
  employeeId: text("employee_id"),
  dateOfJoining: text("date_of_joining"), // ISO date

  // Status
  status: text("status").notNull().default("active"), // "active", "inactive", "on_leave"

  // Background check
  backgroundCheckVerified: boolean("background_check_verified").default(false),
  backgroundCheckDate: text("background_check_date"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TRANSPORT ROUTES
// ============================================================================

/**
 * Bus routes for school transport
 */
export const transportRoutes = pgTable("transport_routes", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Route details
  routeNumber: text("route_number").notNull(),
  routeName: text("route_name").notNull(), // "Thimphu City - Route 1"
  name: text("name"), // Alias for route_name
  description: text("description"),

  // Route path (JSON array of stops)
  stops: json("stops").$type<Array<{
    id: string;
    name: string;
    location: {
      latitude: number;
      longitude: number;
    };
    time: string; // HH:MM
    order: number;
    morningPickup: boolean;
    afternoonDrop: boolean;
  }>>(),

  // Timing
  morningStartTime: text("morning_start_time"), // HH:MM - first pickup
  morningEndTime: text("morning_end_time"), // HH:MM - reaches school
  afternoonStartTime: text("afternoon_start_time"), // HH:MM - leaves school
  afternoonEndTime: text("afternoon_end_time"), // HH:MM - last drop

  // Distance
  totalDistance: integer("total_distance"), // In km
  estimatedDuration: integer("estimated_duration"), // In minutes

  // Assignment
  vehicleId: text("vehicle_id"), // Assigned vehicle
  driverId: text("driver_id"), // Primary driver
  attendantId: text("attendant_id"), // Bus attendant

  // Capacity
  capacity: integer("capacity"), // Student capacity
  currentStudents: integer("current_students").default(0),

  // Fees (monthly)
  fee: integer("fee"), // Transport fee per month per student

  // Status
  isActive: boolean("is_active").default(true),
  academicYear: text("academic_year").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TRANSPORT ALLOCATIONS
// ============================================================================

/**
 * Student transport route allocations
 */
export const transportAllocations = pgTable("transport_allocations", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Student
  studentId: text("student_id").notNull(),
  studentName: text("student_name"), // Denormalized

  // Route assignment
  routeId: text("route_id").notNull(),
  vehicleId: text("vehicle_id"),

  // Stop details
  pickupStopId: text("pickup_stop_id"), // Morning pickup stop
  dropStopId: text("drop_stop_id"), // Afternoon drop stop
  pickupPoint: text("pickup_point"), // Display name
  dropPoint: text("drop_point"), // Display name

  // Timing
  pickupTime: text("pickup_time"), // Expected pickup time
  dropTime: text("drop_time"), // Expected drop time

  // Academic year
  academicYear: text("academic_year").notNull(),

  // Status
  status: text("status").notNull().default("active"), // "active", "inactive", "changed"

  // Fee
  feeWaived: boolean("fee_waived").default(false),
  notes: text("notes"),

  startDate: text("start_date"), // ISO date
  endDate: text("end_date"), // ISO date

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// BUS ATTENDANCE
// ============================================================================

/**
 * Daily bus attendance tracking
 */
export const busAttendance = pgTable("bus_attendance", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Student and route
  studentId: text("student_id").notNull(),
  routeId: text("route_id").notNull(),
  vehicleId: text("vehicle_id"),

  // Date and trip
  date: text("date").notNull(), // ISO date
  tripType: text("trip_type").notNull(), // "morning_pickup", "afternoon_drop", "both"

  // Attendance
  morningPresent: boolean("morning_present"),
  afternoonPresent: boolean("afternoon_present"),

  // Check-in details
  pickupTime: text("pickup_time"), // Actual time
  dropTime: text("drop_time"), // Actual time
  pickupLocation: json("pickup_location"), // GPS coordinates
  dropLocation: json("drop_location"), // GPS coordinates

  // Marked by
  markedBy: text("marked_by"), // Driver/attendant user ID

  // Notes
  absenceReason: text("absence_reason"),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// VEHICLE MAINTENANCE
// ============================================================================

/**
 * Vehicle maintenance records
 */
export const vehicleMaintenance = pgTable("vehicle_maintenance", {
  id: text("id").primaryKey(),
  vehicleId: text("vehicle_id").notNull(),

  // Maintenance details
  type: text("type").notNull(), // "routine", "repair", "inspection", "breakdown"
  description: text("description").notNull(),

  // Dates
  reportedDate: text("reported_date"), // ISO date
  scheduledDate: text("scheduled_date"), // ISO date
  completedDate: text("completed_date"), // ISO date

  // Cost
  estimatedCost: integer("estimated_cost"),
  actualCost: integer("actual_cost"),

  // Status
  status: text("status").notNull().default("pending"), // "pending", "in_progress", "completed", "cancelled"

  // Vendor
  vendorName: text("vendor_name"),
  vendorContact: text("vendor_contact"),
  invoiceNumber: text("invoice_number"),

  // Next service
  nextServiceDate: text("next_service_date"),
  nextServiceOdometer: integer("next_service_odometer"),

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// VEHICLE TRACKING
// ============================================================================

/**
 * Real-time vehicle location tracking
 */
export const vehicleTracking = pgTable("vehicle_tracking", {
  id: text("id").primaryKey(),
  vehicleId: text("vehicle_id").notNull(),
  assignedRouteId: text("assigned_route_id"), // Route currently assigned

  // Location
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  speed: integer("speed"), // km/h
  heading: integer("heading"), // Degrees

  // Status
  status: text("status").notNull(), // "moving", "stopped", "idle", "out_of_service"

  // Trip info
  currentTripId: text("current_trip_id"),
  routeId: text("route_id"),
  studentsOnBoard: integer("students_on_board").default(0),

  // Timestamp
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// ============================================================================
// INCIDENT REPORTS
// ============================================================================

/**
 * Transport-related incident reports
 */
export const transportIncidents = pgTable("transport_incidents", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Incident details
  type: text("type").notNull(), // "accident", "breakdown", "delay", "misbehavior", "other"
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  description: text("description").notNull(),

  // Location and time
  incidentDate: text("incident_date").notNull(), // ISO date
  incidentTime: text("incident_time"), // HH:MM
  location: text("location"),

  // Vehicles and people involved
  vehicleId: text("vehicle_id"),
  driverId: text("driver_id"),
  studentsInvolved: json("students_involved").$type<string[]>(), // Student IDs

  // Action taken
  actionTaken: text("action_taken"),
  reportedTo: text("reported_to"), // Parent, police, etc.
  reportReference: text("report_reference"), // Police report number, etc.

  // Status
  status: text("status").notNull().default("open"), // "open", "investigating", "resolved", "closed"

  // Reported by
  reportedBy: text("reported_by"), // User ID

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Vehicle = typeof vehicles.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type TransportRoute = typeof transportRoutes.$inferSelect;
export type TransportAllocation = typeof transportAllocations.$inferSelect;
export type BusAttendance = typeof busAttendance.$inferSelect;
export type VehicleMaintenance = typeof vehicleMaintenance.$inferSelect;
export type VehicleTracking = typeof vehicleTracking.$inferSelect;
export type TransportIncident = typeof transportIncidents.$inferSelect;
