/**
 * Inventory Management Database Schema
 * Handles school assets, supplies, equipment, and inventory tracking
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum , json} from "drizzle-orm/pg-core";

// ============================================================================
// INVENTORY CATEGORIES
// ============================================================================

/**
 * Inventory item categories
 */
export const inventoryCategories = pgTable("inventory_categories", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Category details
  name: text("name").notNull(),
  code: text("code").unique(), // "STAT", "LAB", "FURN", etc.
  description: text("description"),

  // Hierarchy
  parentId: text("parent_id"), // For subcategories
  level: integer("level").default(0), // 0 = root, 1 = subcategory, etc.

  // Depreciation settings
  depreciationRate: integer("depreciation_rate"), // Annual percentage
  usefulLifeYears: integer("useful_life_years"),

  // Reorder settings
  alertThreshold: integer("alert_threshold"), // Minimum quantity before alert

  // Status
  isActive: boolean("is_active").default(true),

  // Display
  displayOrder: integer("display_order"),
  icon: text("icon"),
  color: text("color"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// INVENTORY ITEMS
// ============================================================================

/**
 * Individual inventory items
 */
export const inventoryItems = pgTable("inventory_items", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Item details
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku").unique(), // Stock Keeping Unit
  barcode: text("barcode").unique(),
  qrCode: text("qr_code"),

  // Classification
  categoryId: text("category_id").notNull(),
  itemType: text("item_type").notNull(), // "asset", "consumable", "equipment", "furniture", "stationery", "book"

  // Asset details (for fixed assets)
  isFixedAsset: boolean("is_fixed_asset").default(false),
  assetTag: text("asset_tag").unique(),
  serialNumber: text("serial_number"),
  purchaseDate: text("purchase_date"), // ISO date
  purchasePrice: integer("purchase_price"),
  currentValue: integer("current_value"),
  depreciation: integer("depreciation"),

  // Specifications
  manufacturer: text("manufacturer"),
  model: text("model"),
  year: integer("year"),
  specifications: json("specifications").$type<Record<string, any>>(),

  // Location
  location: text("location"), // Building, room, shelf
  buildingId: text("building_id"),
  roomId: text("room_id"),
  shelf: text("shelf"),
  rack: text("rack"),
  bin: text("bin"),

  // Stock management
  quantity: integer("quantity").notNull().default(0),
  minimumStock: integer("minimum_stock"),
  maximumStock: integer("maximum_stock"),
  reorderLevel: integer("reorder_level"),
  reorderQuantity: integer("reorder_quantity"),

  // Unit
  unit: text("unit").notNull(), // "pieces", "boxes", "liters", "kg", "sets", etc.

  // Status
  condition: text("condition").notNull().default("new"), // "new", "good", "fair", "poor", "damaged"
  status: text("status").notNull().default("available"), // "available", "in_use", "reserved", "maintenance", "disposed", "lost"

  // Assignment
  assignedTo: text("assigned_to"), // User ID (teacher, staff, student)
  assignedDate: text("assigned_date"), // ISO date
  assignedUntil: text("assigned_until"), // ISO date

  // Maintenance
  lastMaintenanceDate: text("last_maintenance_date"),
  nextMaintenanceDate: text("next_maintenance_date"),
  warrantyExpiry: text("warranty_expiry"), // ISO date

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// INVENTORY TRANSACTIONS
// ============================================================================

/**
 * Stock movement transactions
 */
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Item
  itemId: text("item_id").notNull(),

  // Transaction details
  transactionType: text("transaction_type").notNull(), // "purchase", "sale", "transfer", "adjustment", "return", "damage", "loss", "disposal"
  transactionDate: text("transaction_date").notNull(), // ISO date

  // Quantity
  quantity: integer("quantity").notNull(), // Positive for incoming, negative for outgoing
  balanceAfter: integer("balance_after").notNull(),

  // Value
  unitPrice: integer("unit_price"),
  totalValue: integer("total_value"),

  // Reference
  referenceNumber: text("reference_number"), // Invoice number, PO number, etc.
  referenceType: text("reference_type"), // "purchase_order", "invoice", "transfer_note", etc.

  // Source/Destination
  sourceLocation: text("source_location"),
  destinationLocation: text("destination_location"),

  // Person involved
  performedBy: text("performed_by"), // User ID
  authorizedBy: text("authorized_by"), // User ID who approved

  // Reason
  reason: text("reason"),

  // Supporting documents
  documentUrls: json("document_urls").$type<string[]>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// PURCHASE ORDERS
// ============================================================================

/**
 * Purchase orders for inventory items
 */
export const purchaseOrders = pgTable("purchase_orders", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // PO details
  orderNumber: text("order_number").unique().notNull(),
  orderDate: text("order_date").notNull(), // ISO date
  expectedDeliveryDate: text("expected_delivery_date"), // ISO date
  actualDeliveryDate: text("actual_delivery_date"), // ISO date

  // Vendor
  vendorId: text("vendor_id").notNull(),
  vendorName: text("vendor_name"),
  vendorAddress: text("vendor_address"),
  vendorContact: text("vendor_contact"),
  vendorPhone: text("vendor_phone"),
  vendorEmail: text("vendor_email"),

  // Items
  items: json("items").$type<Array<{
    itemId?: string;
    itemName: string;
    description?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    tax?: number;
  }>>(),

  // Financials
  subtotal: integer("subtotal").notNull(),
  taxAmount: integer("tax_amount").default(0),
  discountAmount: integer("discount_amount").default(0),
  shippingCost: integer("shipping_cost").default(0),
  otherCharges: integer("other_charges").default(0),
  totalAmount: integer("total_amount").notNull(),

  // Payment terms
  paymentTerms: text("payment_terms"), // "COD", "NET 30", "NET 60", etc.
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending", "partial", "paid", "overdue"
  paymentDueDate: text("payment_due_date"),
  amountPaid: integer("amount_paid").default(0),

  // Delivery
  deliveryAddress: text("delivery_address"),
  deliveryInstructions: text("delivery_instructions"),

  // Status
  status: text("status").notNull().default("pending"), // "pending", "approved", "ordered", "partial_received", "received", "cancelled"

  // Approval
  approvedBy: text("approved_by"), // User ID
  approvedDate: text("approved_date"),
  approvalNotes: text("approval_notes"),

  // Notes
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),

  // Documents
  documentUrls: json("document_urls").$type<string[]>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// VENDORS
// ============================================================================

/**
 * Inventory vendors and suppliers
 */
export const inventoryVendors = pgTable("inventory_vendors", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Vendor details
  name: text("name").notNull(),
  code: text("code").unique(),
  vendorType: text("vendor_type"), // "regular", "preferred", "blacklisted"

  // Contact info
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  website: text("website"),

  // Address
  address: text("address"),
  city: text("city"),
  district: text("district"),
  country: text("country").default("Bhutan"),
  postalCode: text("postal_code"),

  // Business details
  taxId: text("tax_id"),
  licenseNumber: text("license_number"),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankBranch: text("bank_branch"),

  // Terms
  paymentTerms: text("payment_terms"), // "COD", "NET 30", etc.
  creditLimit: integer("credit_limit"),
  creditPeriod: integer("credit_period"), // Days
  discountPercentage: integer("discount_percentage").default(0),

  // Categories supplied
  categoryIds: json("category_ids").$type<string[]>(),

  // Performance
  rating: integer("rating"), // 1-5
  totalOrders: integer("total_orders").default(0),
  totalAmount: integer("total_amount").default(0),

  // Notes
  notes: text("notes"),

  // Status
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// ASSET ASSIGNMENTS
// ============================================================================

/**
 * Asset assignment to users/departments
 */
export const assetAssignments = pgTable("asset_assignments", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Asset
  itemId: text("item_id").notNull(),
  itemName: text("item_name"),

  // Assigned to
  assignedToId: text("assigned_to_id").notNull(), // User ID
  assignedToName: text("assigned_to_name"),
  assignedToType: text("assigned_to_type").notNull(), // "teacher", "staff", "student", "department", "room"

  // Assignment details
  assignmentType: text("assignment_type").notNull(), // "permanent", "temporary", "loan"
  assignmentDate: text("assignment_date").notNull(), // ISO date
  expectedReturnDate: text("expected_return_date"), // ISO date
  actualReturnDate: text("actual_return_date"), // ISO date

  // Condition
  conditionAtAssignment: text("condition_at_assignment"),
  conditionAtReturn: text("condition_at_return"),

  // Status
  status: text("status").notNull().default("active"), // "active", "returned", "overdue", "lost", "damaged"

  // Approval
  approvedBy: text("approved_by"), // User ID
  approvedDate: text("approved_date"),

  // Notes
  assignmentNotes: text("assignment_notes"),
  returnNotes: text("return_notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// ASSET MAINTENANCE
// ============================================================================

/**
 * Asset maintenance schedules and records
 */
export const assetMaintenance = pgTable("asset_maintenance", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Asset
  itemId: text("item_id").notNull(),
  itemName: text("item_name"),

  // Maintenance details
  maintenanceType: text("maintenance_type").notNull(), // "preventive", "corrective", "emergency", "calibration"
  description: text("description").notNull(),

  // Schedule
  scheduledDate: text("scheduled_date"), // ISO date
  completedDate: text("completed_date"), // ISO date
  nextMaintenanceDate: text("next_maintenance_date"), // ISO date

  // Cost
  estimatedCost: integer("estimated_cost"),
  actualCost: integer("actual_cost"),

  // Vendor/Service provider
  vendorId: text("vendor_id"),
  vendorName: text("vendor_name"),
  performedBy: text("performed_by"), // User ID or vendor contact

  // Status
  status: text("status").notNull().default("scheduled"), // "scheduled", "in_progress", "completed", "cancelled", "overdue"

  // Work details
  workPerformed: text("work_performed"),
  partsReplaced: json("parts_replaced").$type<Array<{
    partName: string;
    partNumber: string;
    quantity: number;
    cost: number;
  }>>(),

  // Documents
  reportUrls: json("report_urls").$type<string[]>(),
  invoiceUrls: json("invoice_urls").$type<string[]>(),

  // Downtime
  downtimeStart: text("downtime_start"), // ISO datetime
  downtimeEnd: text("downtime_end"), // ISO datetime
  downtimeReason: text("downtime_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// ASSET DISPOSAL
// ============================================================================

/**
 * Asset disposal and write-off records
 */
export const assetDisposal = pgTable("asset_disposal", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Asset
  itemId: text("item_id").notNull(),
  itemName: text("item_name"),
  originalValue: integer("original_value"),
  currentValue: integer("current_value"),

  // Disposal details
  disposalType: text("disposal_type").notNull(), // "sold", "scrapped", "donated", "lost", "destroyed", "written_off"
  disposalDate: text("disposal_date").notNull(), // ISO date

  // Reason
  reason: text("reason").notNull(),
  reasonDetails: text("reason_details"),

  // Sale details (if sold)
  soldTo: text("sold_to"),
  soldPrice: integer("sold_price"),
  saleReference: text("sale_reference"),

  // Approval
  approvedBy: text("approved_by"), // User ID
  approvedDate: text("approved_date"),
  approvalNotes: text("approval_notes"),

  // Documents
  documentUrls: json("document_urls").$type<string[]>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// STOCK ADJUSTMENTS
// ============================================================================

/**
 * Stock adjustment records for discrepancies
 */
export const stockAdjustments = pgTable("stock_adjustments", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Adjustment details
  adjustmentDate: text("adjustment_date").notNull(), // ISO date
  adjustmentType: text("adjustment_type").notNull(), // "damage", "loss", "theft", "expired", "correction", "physical_count"

  // Items affected
  items: json("items").$type<Array<{
    itemId: string;
    itemName: string;
    expectedQuantity: number;
    actualQuantity: number;
    adjustment: number;
    reason: string;
    unitPrice?: number;
    value?: number;
  }>>(),

  // Total value adjustment
  totalValueChange: integer("total_value_change"),

  // Reference
  referenceNumber: text("reference_number"),

  // Approval
  performedBy: text("performed_by"), // User ID
  approvedBy: text("approved_by"), // User ID
  approvedDate: text("approved_date"),

  // Supporting documents
  notes: text("notes"),
  documentUrls: json("document_urls").$type<string[]>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// INVENTORY ALERTS
// ============================================================================

/**
 * Low stock and other inventory alerts
 */
export const inventoryAlerts = pgTable("inventory_alerts", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Alert details
  alertType: text("alert_type").notNull(), // "low_stock", "overstock", "expired", "maintenance_due", "warranty_expiry"
  severity: text("severity").notNull(), // "info", "warning", "critical"

  // Item
  itemId: text("item_id").notNull(),
  itemName: text("item_name"),

  // Message
  title: text("title").notNull(),
  message: text("message").notNull(),

  // Status
  status: text("status").notNull().default("active"), // "active", "acknowledged", "resolved", "dismissed"

  // Resolution
  resolvedBy: text("resolved_by"), // User ID
  resolvedDate: text("resolved_date"),
  resolutionNotes: text("resolution_notes"),

  // Notifications sent
  notificationSent: boolean("notification_sent").default(false),
  notificationSentAt: text("notification_sent_at"),
  notifiedUsers: json("notified_users").$type<string[]>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// INVENTORY REPORTS
// ============================================================================

/**
 * Generated inventory reports
 */
export const inventoryReports = pgTable("inventory_reports", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Report details
  reportType: text("report_type").notNull(), // "stock_summary", "valuation", "movement", "consumption", "expired"
  reportName: text("report_name").notNull(),

  // Period
  reportPeriodStart: text("report_period_start"), // ISO date
  reportPeriodEnd: text("report_period_end"), // ISO date
  generatedDate: text("generated_date").notNull(), // ISO date

  // Report data
  summary: json("summary").$type<Record<string, any>>(),
  details: json("details").$type<Record<string, any>>(),

  // Generated by
  generatedBy: text("generated_by"), // User ID

  // File
  fileUrl: text("file_url"),
  fileType: text("file_type"), // "pdf", "excel", "csv"

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// INVENTORY SETTINGS
// ============================================================================

/**
 * Per-school inventory settings
 */
export const inventorySettings = pgTable("inventory_settings", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // General settings
  defaultReorderLevel: integer("default_reorder_level").default(10),
  defaultMinimumStock: integer("default_minimum_stock").default(5),
  lowStockAlertEnabled: boolean("low_stock_alert_enabled").default(true),
  expiryAlertEnabled: boolean("expiry_alert_enabled").default(true),
  expiryAlertDays: integer("expiry_alert_days").default(30),

  // Approval settings
  purchaseOrderApprovalRequired: boolean("purchase_order_approval_required").default(true),
  purchaseOrderApprovalThreshold: integer("purchase_order_approval_threshold"), // Amount above which approval is needed
  disposalApprovalRequired: boolean("disposal_approval_required").default(true),

  // Depreciation settings
  depreciationMethod: text("depreciation_method").default("straight_line"), // "straight_line", "declining_balance"
  defaultUsefulLife: integer("default_useful_life").default(5), // Years

  // Numbering
  assetNumberPrefix: text("asset_number_prefix").default("AST"),
  purchaseOrderPrefix: text("purchase_order_prefix").default("PO"),
  purchaseOrderNextNumber: integer("purchase_order_next_number").default(1),

  // Notifications
  alertEmails: json("alert_emails").$type<string[]>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type InventoryCategory = typeof inventoryCategories.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InventoryVendor = typeof inventoryVendors.$inferSelect;
export type AssetAssignment = typeof assetAssignments.$inferSelect;
export type AssetMaintenance = typeof assetMaintenance.$inferSelect;
export type AssetDisposal = typeof assetDisposal.$inferSelect;
export type StockAdjustment = typeof stockAdjustments.$inferSelect;
export type InventoryAlert = typeof inventoryAlerts.$inferSelect;
export type InventoryReport = typeof inventoryReports.$inferSelect;
export type InventorySettings = typeof inventorySettings.$inferSelect;
