/**
 * Billing and Subscription Database Schema
 * Handles subscription plans, billing, and payment management
 * Supports recurring billing and invoice generation
 */

import { pgTable, text, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { tenants } from "./tenancy-schema";

// ============================================================================
// SUBSCRIPTION PLANS TABLE
// ============================================================================

/**
 * Available subscription plans for the platform
 * Plans define pricing, limits, and features
 */
export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey(),

  // Plan details
  name: text("name").notNull(), // "Starter", "Professional", "Enterprise", "Ministry"
  description: text("description").notNull(),

  // Pricing
  price: integer("price").notNull(), // Price in cents (e.g., 5000 = BTN 50.00)
  currency: text("currency").notNull().default("BTN"), // "BTN" | "USD" | "INR"
  billingCycle: text("billing_cycle").notNull(), // "monthly" | "yearly"

  // Limits
  maxSchools: integer("max_schools"), // Max number of schools (for ministry/district plans)
  maxUsers: integer("max_users"), // Max number of users
  maxStudents: integer("max_students"), // Max number of students
  maxTeachers: integer("max_teachers"), // Max number of teachers
  maxStorageGB: integer("max_storage_gb"), // Storage limit in GB

  // Features
  features: json("features").notNull().$type<Array<{
    name: string;
    description: string;
    included: boolean;
    limit?: number;
  }>>(),

  // Plan metadata
  planType: text("plan_type").notNull(), // "school" | "district" | "ministry" | "trial"
  tier: text("tier").notNull(), // "basic" | "standard" | "premium" | "enterprise"

  // Trial settings
  trialDays: integer("trial_days").default(0),
  trialPrice: integer("trial_price").default(0),

  // Discounts
  yearlyDiscount: integer("yearly_discount"), // Percentage discount for yearly billing

  // Status
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true), // Visible to public for signup

  // Display order for pricing page
  displayOrder: integer("display_order"),

  // Highlighting
  isFeatured: boolean("is_featured").default(false), // Highlight on pricing page
  badge: text("badge"), // e.g., "Most Popular", "Best Value"

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// SUBSCRIPTIONS TABLE
// ============================================================================

/**
 * Active subscriptions for tenants
 * Links tenants to subscription plans
 */
export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),

  // References
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull().references(() => subscriptionPlans.id),

  // Subscription period
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  trialEndDate: timestamp("trial_end_date", { withTimezone: true }),

  // Current period
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),

  // Status
  status: text("status").notNull().default("active"), // "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete"

  // Usage tracking
  maxUsers: integer("max_users").notNull(),
  currentUsers: integer("current_users").default(0),
  maxStudents: integer("max_students"),
  currentStudents: integer("current_students").default(0),
  maxTeachers: integer("max_teachers"),
  currentTeachers: integer("current_teachers").default(0),

  // Pricing snapshot at time of subscription
  price: integer("price").notNull(), // Price in cents
  currency: text("currency").notNull().default("BTN"),
  billingCycle: text("billing_cycle").notNull(), // "monthly" | "yearly"

  // Auto-renewal
  autoRenew: boolean("auto_renew").default(true),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),

  // Trial
  isTrial: boolean("is_trial").default(false),
  trialDays: integer("trial_days"),
  trialConverted: boolean("trial_converted").default(false),

  // Payment method
  paymentMethodId: text("payment_method_id"),
  paymentMethodType: text("payment_method_type"), // "card" | "bank" | "rma" | "manual"

  // Discount
  discountCode: text("discount_code"),
  discountPercentage: integer("discount_percentage"),
  discountAmount: integer("discount_amount"), // Fixed amount discount in cents

  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// INVOICES TABLE
// ============================================================================

/**
 * Billing invoices for subscriptions
 * Generated automatically for each billing period
 */
export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),

  // References
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id),
  tenantId: text("tenant_id").notNull(),

  // Invoice details
  invoiceNumber: text("invoice_number").unique().notNull(), // e.g., "INV-2024-001"
  invoiceDate: timestamp("invoice_date", { withTimezone: true }).notNull(),

  // Period covered
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),

  // Amounts
  amount: integer("amount").notNull(), // Subtotal in cents
  taxAmount: integer("tax_amount").default(0), // Tax in cents
  discountAmount: integer("discount_amount").default(0), // Discount in cents
  totalAmount: integer("total_amount").notNull(), // Final amount in cents

  // Currency
  currency: text("currency").notNull().default("BTN"),

  // Status
  status: text("status").notNull().default("pending"), // "draft" | "pending" | "paid" | "overdue" | "cancelled" | "refunded"

  // Due date
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),

  // Payment
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paymentMethod: text("payment_method"), // "card" | "bank" | "rma" | "cash" | "cheque"
  paymentDetails: json("payment_details").$type<{
    transactionId?: string;
    bankReference?: string;
    cardLast4?: string;
    paidBy?: string;
    notes?: string;
  }>(),

  // PDF
  pdfUrl: text("pdf_url"), // URL to generated PDF invoice

  // Line items
  lineItems: json("line_items").$type<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>>(),

  // Notes
  notes: text("notes"),
  internalNotes: text("internal_notes"),

  // Refund
  refundAmount: integer("refund_amount").default(0),
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// PAYMENT METHODS TABLE
// ============================================================================

/**
 * Payment methods stored for tenants
 * Supports multiple payment options
 */
export const paymentMethods = pgTable("payment_methods", {
  id: text("id").primaryKey(),

  // Reference
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // Type
  type: text("type").notNull(), // "card" | "bank_account" | "rma" | "manual"

  // Card details (tokenized)
  cardLast4: text("card_last4"),
  cardBrand: text("card_brand"), // "visa" | "mastercard" | "amex"
  cardExpiryMonth: integer("card_expiry_month"),
  cardExpiryYear: integer("card_expiry_year"),
  cardholderName: text("cardholder_name"),

  // Bank details
  bankName: text("bank_name"),
  bankAccountLast4: text("bank_account_last4"),
  bankAccountType: text("bank_account_type"), // "savings" | "current"

  // RMA details (Royal Monetary Authority)
  rmaAccountNumber: text("rma_account_number"),
  rmaBankCode: text("rma_bank_code"),

  // Manual payment info
  manualPaymentInstructions: text("manual_payment_instructions"),

  // Status
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),

  // Verification
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),

  // Token from payment processor
  provider: text("provider"), // "stripe" | "razorpay" | "rma" | "manual"
  providerToken: text("provider_token"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// DISCOUNT CODES TABLE
// ============================================================================

/**
 * Discount and coupon codes
 * Supports percentage and fixed amount discounts
 */
export const discountCodes = pgTable("discount_codes", {
  id: text("id").primaryKey(),

  // Code
  code: text("code").unique().notNull(),
  name: text("name").notNull(),

  // Discount type
  type: text("type").notNull(), // "percentage" | "fixed"
  value: integer("value").notNull(), // Percentage (0-100) or fixed amount in cents

  // Applicability
  applicablePlans: json("applicable_plans").$type<string[]>(), // Plan IDs this applies to, null = all plans

  // Limits
  maxUses: integer("max_uses"), // Total uses allowed
  currentUses: integer("current_uses").default(0),
  maxUsesPerUser: integer("max_uses_per_user"), // Uses per tenant

  // Duration
  duration: text("duration").notNull(), // "once" | "repeating" | "forever"
  durationMonths: integer("duration_months"), // For repeating discounts

  // Validity period
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }),

  // Requirements
  minimumAmount: integer("minimum_amount"), // Minimum subscription amount in cents
  newCustomersOnly: boolean("new_customers_only").default(false),

  // Status
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// DISCOUNT USAGES TABLE
// ============================================================================

/**
 * Track usage of discount codes
 */
export const discountUsages = pgTable("discount_usages", {
  id: text("id").primaryKey(),

  // References
  discountCodeId: text("discount_code_id").notNull().references(() => discountCodes.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  subscriptionId: text("subscription_id").references(() => subscriptions.id),

  // Usage details
  discountAmount: integer("discount_amount").notNull(), // Amount saved in cents

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// PAYMENT TRANSACTIONS TABLE
// ============================================================================

/**
 * Individual payment transactions
 * Tracks all payment attempts and results
 */
export const paymentTransactions = pgTable("payment_transactions", {
  id: text("id").primaryKey(),

  // References
  invoiceId: text("invoice_id").references(() => invoices.id),
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),

  // Transaction details
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull().default("BTN"),

  // Provider details
  provider: text("provider").notNull(), // "stripe" | "razorpay" | "rma" | "manual"
  providerTransactionId: text("provider_transaction_id"),
  providerStatus: text("provider_status"),

  // Status
  status: text("status").notNull(), // "pending" | "processing" | "succeeded" | "failed" | "refunded"

  // Payment method
  paymentMethodId: text("payment_method_id"),
  paymentMethodType: text("payment_method_type"),

  // Response details
  responseCode: text("response_code"),
  responseMessage: text("response_message"),
  failureReason: text("failure_reason"),

  // Refund
  refundAmount: integer("refund_amount").default(0),
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),

  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// USAGE RECORDS TABLE
// ============================================================================

/**
 * Usage tracking for subscription limits
 * Records daily/periodic usage metrics
 */
export const usageRecords = pgTable("usage_records", {
  id: text("id").primaryKey(),

  // Reference
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id),
  tenantId: text("tenant_id").notNull(),

  // Metric
  metric: text("metric").notNull(), // "users" | "students" | "teachers" | "storage" | "api_calls"
  quantity: integer("quantity").notNull(), // Usage amount

  // Period
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),

  // Description
  description: text("description"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;

export type DiscountCode = typeof discountCodes.$inferSelect;
export type NewDiscountCode = typeof discountCodes.$inferInsert;

export type DiscountUsage = typeof discountUsages.$inferSelect;
export type NewDiscountUsage = typeof discountUsages.$inferInsert;

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;

export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;
