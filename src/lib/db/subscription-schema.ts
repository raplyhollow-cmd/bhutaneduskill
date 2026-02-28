/**
 * Subscription & Monetization Database Schema
 * Handles B2B school subscriptions, B2C premium plans, and marketplace fees
 *
 * NOTE: subscriptionPlans, discountCodes, and invoices are now in billing-schema.ts
 * This file re-exports them for backward compatibility and defines additional
 * subscription-related tables.
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum , json} from "drizzle-orm/pg-core";
import { subscriptionPlans, discountCodes, invoices } from "./billing-schema";

// Re-export billing tables from billing-schema.ts
export {
  subscriptionPlans,
  discountCodes,
  invoices,
  type SubscriptionPlan,
  type DiscountCode,
  type Invoice,
} from "./billing-schema";

// ============================================================================
// SCHOOL SUBSCRIPTIONS
// ============================================================================

/**
 * Active school subscriptions
 */
export const schoolSubscriptions = pgTable("school_subscriptions", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  planId: text("plan_id").notNull().references(() => subscriptionPlans.id),

  // Status
  status: text("status").notNull().default("trialing"), // "trialing", "active", "past_due", "cancelled", "expired"
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

  // Limits tracking
  currentStudentCount: integer("current_student_count").default(0),
  currentTeacherCount: integer("current_teacher_count").default(0),
  currentStorageUsed: integer("current_storage_used").default(0), // In bytes

  // Customizations
  customDomain: text("custom_domain"),
  customLogo: text("custom_logo"),
  primaryColor: text("primary_color"),
  customTheme: json("custom_theme"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// SUBSCRIPTION PAYMENTS
// ============================================================================

/**
 * Payment records for school subscriptions
 */
export const subscriptionPayments = pgTable("subscription_payments", {
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
  gatewayResponse: json("gateway_response"),

  // Billing period
  periodStart: timestamp("period_start", { withTimezone: true }),
  periodEnd: timestamp("period_end", { withTimezone: true }),

  // Collected by
  collectedBy: text("collected_by"), // Platform admin user ID
  collectedAt: timestamp("collected_at", { withTimezone: true }),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// B2C PREMIUM PLANS
// ============================================================================

/**
 * Individual premium plans for students/parents
 */
export const premiumPlans = pgTable("premium_plans", {
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
  features: json("features").$type<string[]>(),

  // Limits
  aiCoachConsultations: integer("ai_coach_consultations"), // Per month
  premiumAssessments: integer("premium_assessments"), // Number of premium assessments
  careerReports: integer("career_reports"), // Detailed career reports

  // Display
  isPopular: boolean("is_popular").default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

/**
 * User premium subscriptions
 */
export const userSubscriptions = pgTable("user_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: text("plan_id").notNull().references(() => premiumPlans.id),

  // Status
  status: text("status").notNull().default("active"), // "active", "cancelled", "expired"
  autoRenew: boolean("auto_renew").default(true),

  // Period
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),

  // Usage tracking
  aiConsultationsUsed: integer("ai_consultations_used").default(0),
  premiumAssessmentsTaken: integer("premium_assessments_taken").default(0),

  // Payment
  lastPaymentId: text("last_payment_id"),

  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TUITION MARKETPLACE FEES
// ============================================================================

/**
 * Commission structure for tuition marketplace
 */
export const marketplaceCommission = pgTable("marketplace_commission", {
  id: text("id").primaryKey(),
  schoolId: text("school_id"), // Optional school-specific commission

  // Commission rates (in percentage, multiplied by 100 for storage)
  // e.g., 20% = 2000
  courseCommissionRate: integer("course_commission_rate").notNull().default(2000), // 20%
  sessionCommissionRate: integer("session_commission_rate").notNull().default(1500), // 15%

  // Platform fee for tutors
  tutorListingFee: integer("tutor_listing_fee").notNull().default(100), // Nu. 100

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

/**
 * Commission earnings from marketplace
 */
export const commissionEarnings = pgTable("commission_earnings", {
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
  paidOutAt: timestamp("paid_out_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// FEATURE USAGE TRACKING
// ============================================================================

/**
 * Track feature usage for billing/limits
 */
export const featureUsage = pgTable("feature_usage", {
  id: text("id").primaryKey(),
  schoolId: text("school_id"),
  userId: text("user_id"), // For B2C tracking

  // Feature details
  feature: text("feature").notNull(), // "ai_assessment", "career_report", "storage", "api_call"
  quantity: integer("quantity").notNull().default(1), // Quantity consumed

  // Period
  period: text("period").notNull(), // "2024-01" for monthly tracking
  periodStart: timestamp("period_start", { withTimezone: true }),
  periodEnd: timestamp("period_end", { withTimezone: true }),

  // Metadata
  metadata: json("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SchoolSubscription = typeof schoolSubscriptions.$inferSelect;
export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
export type PremiumPlan = typeof premiumPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type MarketplaceCommission = typeof marketplaceCommission.$inferSelect;
export type CommissionEarning = typeof commissionEarnings.$inferSelect;
export type FeatureUsage = typeof featureUsage.$inferSelect;
