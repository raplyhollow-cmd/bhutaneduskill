/**
 * Subscription & Monetization Database Schema
 * Handles B2B school subscriptions, B2C premium plans, and marketplace fees
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================

/**
 * Available subscription plans for schools
 */
export const subscriptionPlans = sqliteTable("subscription_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // "Starter", "Standard", "Premium", "Enterprise"
  slug: text("slug").notNull().unique(),
  description: text("description"),

  // Pricing (in Ngultrum per year)
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("BTN"),
  billingInterval: text("billing_interval").notNull().default("annual"), // "monthly", "quarterly", "annual"

  // Limits
  studentLimit: integer("student_limit").notNull(),
  teacherLimit: integer("teacher_limit"),
  storageLimit: integer("storage_limit"), // In GB
  apiCallsLimit: integer("api_calls_limit"), // Per month

  // Features (JSON array of feature slugs)
  features: text("features", { mode: "json" }).$type<string[]>(),

  // Feature flags
  hasCareerGuidance: integer("has_career_guidance", { mode: "boolean" }).default(false),
  hasLearningModules: integer("has_learning_modules", { mode: "boolean" }).default(false),
  hasParentPortal: integer("has_parent_portal", { mode: "boolean" }).default(false),
  hasTuitionMarketplace: integer("has_tuition_marketplace", { mode: "boolean" }).default(false),
  hasAIFeatures: integer("has_ai_features", { mode: "boolean" }).default(false),
  hasCustomBranding: integer("has_custom_branding", { mode: "boolean" }).default(false),
  hasPrioritySupport: integer("has_priority_support", { mode: "boolean" }).default(false),
  hasApiAccess: integer("has_api_access", { mode: "boolean" }).default(false),

  // Display
  isPopular: integer("is_popular", { mode: "boolean" }).default(false),
  sortOrder: integer("sort_order").notNull().default(0),

  isActive: integer("is_active", { mode: "boolean" }).default(true),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// SCHOOL SUBSCRIPTIONS
// ============================================================================

/**
 * Active school subscriptions
 */
export const schoolSubscriptions = sqliteTable("school_subscriptions", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  planId: text("plan_id").notNull().references(() => subscriptionPlans.id),

  // Status
  status: text("status").notNull().default("trialing"), // "trialing", "active", "past_due", "cancelled", "expired"
  trialEndsAt: integer("trial_ends_at", { mode: "timestamp" }),
  currentPeriodStart: integer("current_period_start", { mode: "timestamp" }),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  cancelledAt: integer("cancelled_at", { mode: "timestamp" }),

  // Limits tracking
  currentStudentCount: integer("current_student_count").default(0),
  currentTeacherCount: integer("current_teacher_count").default(0),
  currentStorageUsed: integer("current_storage_used").default(0), // In bytes

  // Customizations
  customDomain: text("custom_domain"),
  customLogo: text("custom_logo"),
  primaryColor: text("primary_color"),
  customTheme: text("custom_theme", { mode: "json" }),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// SUBSCRIPTION PAYMENTS
// ============================================================================

/**
 * Payment records for school subscriptions
 */
export const subscriptionPayments = sqliteTable("subscription_payments", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").notNull().references(() => schoolSubscriptions.id),

  // Payment details
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("BTN"),
  paymentMethod: text("payment_method").notNull(), // "rma", "bank_transfer", "check", "other"
  transactionId: text("transaction_id"),
  receiptNumber: text("receipt_number").notNull(),

  // Status
  status: text("status").notNull().default("pending"), // "pending", "completed", "failed", "refunded"

  // Payment gateway info
  gateway: text("gateway"), // "rma", "manual"
  gatewayResponse: text("gateway_response", { mode: "json" }),

  // Billing period
  periodStart: integer("period_start", { mode: "timestamp" }),
  periodEnd: integer("period_end", { mode: "timestamp" }),

  // Collected by
  collectedBy: text("collected_by"), // Platform admin user ID
  collectedAt: integer("collected_at", { mode: "timestamp" }),
  notes: text("notes"),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// B2C PREMIUM PLANS
// ============================================================================

/**
 * Individual premium plans for students/parents
 */
export const premiumPlans = sqliteTable("premium_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // "Plus", "Pro", "Lifetime"
  slug: text("slug").notNull().unique(),
  description: text("description"),

  // Pricing
  monthlyPrice: integer("monthly_price"),
  yearlyPrice: integer("yearly_price"),
  lifetimePrice: integer("lifetime_price"),
  currency: text("currency").notNull().default("BTN"),

  // Features
  features: text("features", { mode: "json" }).$type<string[]>(),

  // Limits
  aiCoachConsultations: integer("ai_coach_consultations"), // Per month
  premiumAssessments: integer("premium_assessments"), // Number of premium assessments
  careerReports: integer("career_reports"), // Detailed career reports

  // Display
  isPopular: integer("is_popular", { mode: "boolean" }).default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/**
 * User premium subscriptions
 */
export const userSubscriptions = sqliteTable("user_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: text("plan_id").notNull().references(() => premiumPlans.id),

  // Status
  status: text("status").notNull().default("active"), // "active", "cancelled", "expired"
  autoRenew: integer("auto_renew", { mode: "boolean" }).default(true),

  // Period
  currentPeriodStart: integer("current_period_start", { mode: "timestamp" }),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),

  // Usage tracking
  aiConsultationsUsed: integer("ai_consultations_used").default(0),
  premiumAssessmentsTaken: integer("premium_assessments_taken").default(0),

  // Payment
  lastPaymentId: text("last_payment_id"),

  cancelledAt: integer("cancelled_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// TUITION MARKETPLACE FEES
// ============================================================================

/**
 * Commission structure for tuition marketplace
 */
export const marketplaceCommission = sqliteTable("marketplace_commission", {
  id: text("id").primaryKey(),
  schoolId: text("school_id"), // Optional school-specific commission

  // Commission rates (in percentage, multiplied by 100 for storage)
  // e.g., 20% = 2000
  courseCommissionRate: integer("course_commission_rate").notNull().default(2000), // 20%
  sessionCommissionRate: integer("session_commission_rate").notNull().default(1500), // 15%

  // Platform fee for tutors
  tutorListingFee: integer("tutor_listing_fee").notNull().default(100), // Nu. 100

  isActive: integer("is_active", { mode: "boolean" }).default(true),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/**
 * Commission earnings from marketplace
 */
export const commissionEarnings = sqliteTable("commission_earnings", {
  id: text("id").primaryKey(),

  // Source
  sourceType: text("source_type").notNull(), // "course", "session"
  sourceId: text("source_id").notNull(),
  enrollmentId: text("enrollment_id"),
  transactionAmount: integer("transaction_amount").notNull(),

  // Commission calculation
  commissionRate: integer("commission_rate").notNull(), // In basis points (20% = 2000)
  commissionAmount: integer("commission_amount").notNull(), // Actual commission earned

  // Status
  status: text("status").notNull().default("pending"), // "pending", "available", "paid_out"

  // Payout
  payoutId: text("payout_id"),
  paidOutAt: integer("paid_out_at", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// FEATURE USAGE TRACKING
// ============================================================================

/**
 * Track feature usage for billing/limits
 */
export const featureUsage = sqliteTable("feature_usage", {
  id: text("id").primaryKey(),
  schoolId: text("school_id"),
  userId: text("user_id"), // For B2C tracking

  // Feature details
  feature: text("feature").notNull(), // "ai_assessment", "career_report", "storage", "api_call"
  quantity: integer("quantity").notNull().default(1), // Quantity consumed

  // Period
  period: text("period").notNull(), // "2024-01" for monthly tracking
  periodStart: integer("period_start", { mode: "timestamp" }),
  periodEnd: integer("period_end", { mode: "timestamp" }),

  // Metadata
  metadata: text("metadata", { mode: "json" }),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// DISCOUNT CODES
// ============================================================================

/**
 * Promotional discount codes
 */
export const discountCodes = sqliteTable("discount_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),

  // Discount details
  type: text("type").notNull(), // "percentage", "fixed_amount"
  value: integer("value").notNull(), // Percentage or amount in cents

  // Applicability
  appliesTo: text("applies_to").notNull(), // "school_subscription", "user_premium", "all"
  planIds: text("plan_ids", { mode: "json" }).$type<string[]>(), // Specific plans if applicable

  // Limits
  maxUses: integer("max_uses"), // Total uses allowed
  usedCount: integer("used_count").default(0),
  maxUsesPerUser: integer("max_uses_per_user").default(1),

  // Validity
  validFrom: integer("valid_from", { mode: "timestamp" }),
  validUntil: integer("valid_until", { mode: "timestamp" }),

  isActive: integer("is_active", { mode: "boolean" }).default(true),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// INVOICES
// ============================================================================

/**
 * Invoices for subscriptions
 */
export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),

  // Customer
  customerId: text("customer_id").notNull(), // School ID or User ID
  customerType: text("customer_type").notNull(), // "school", "user"

  // Subscription details
  subscriptionId: text("subscription_id"),
  subscriptionType: text("subscription_type").notNull(), // "school", "user"

  // Billing period
  periodStart: integer("period_start", { mode: "timestamp" }).notNull(),
  periodEnd: integer("period_end", { mode: "timestamp" }).notNull(),

  // Amounts
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").default(0),
  tax: integer("tax").default(0),
  total: integer("total").notNull(),

  // Currency
  currency: text("currency").notNull().default("BTN"),

  // Status
  status: text("status").notNull().default("draft"), // "draft", "sent", "paid", "overdue", "cancelled"
  dueDate: integer("due_date", { mode: "timestamp" }),
  paidAt: integer("paid_at", { mode: "timestamp" }),

  // Payment
  paymentId: text("payment_id"),

  // PDF
  invoiceUrl: text("invoice_url"),

  // Notes
  notes: text("notes"),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type SchoolSubscription = typeof schoolSubscriptions.$inferSelect;
export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
export type PremiumPlan = typeof premiumPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type MarketplaceCommission = typeof marketplaceCommission.$inferSelect;
export type CommissionEarning = typeof commissionEarnings.$inferSelect;
export type FeatureUsage = typeof featureUsage.$inferSelect;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
