/**
 * INDIVIDUAL SUBSCRIPTION MANAGEMENT API (Platform Admin)
 *
 * GET /api/billing/subscriptions/[subscriptionId] - Get subscription details
 * PATCH /api/billing/subscriptions/[subscriptionId] - Update subscription
 * DELETE /api/billing/subscriptions/[subscriptionId] - Cancel subscription
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import {
  subscriptions,
  subscriptionPlans,
  tenants,
  paymentTransactions,
} from "@/lib/db/schema";
import { invoices } from "@/lib/db/billing-schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface SubscriptionDetail {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  startDate: Date;
  endDate: Date;
  trialEndDate?: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  price: number;
  currency: string;
  billingCycle: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  isTrial: boolean;
  trialDays?: number | null;
  trialConverted: boolean;
  paymentMethodId?: string | null;
  paymentMethodType?: string | null;
  discountCode?: string | null;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  // Usage
  maxUsers: number;
  currentUsers: number;
  maxStudents?: number | null;
  currentStudents: number;
  maxTeachers?: number | null;
  currentTeachers: number;
  // Nested
  tenant?: {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    logo?: string;
    isActive?: boolean;
  };
  plan?: {
    id: string;
    name: string;
    description: string;
    tier: string;
    planType: string;
    features?: Array<{
      name: string;
      description: string;
      included: boolean;
      limit?: number;
    }>;
  };
  // Billing summary
  billingSummary?: {
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    totalPaid: number;
    totalPending: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateSubscriptionRequest {
  action?: "change_plan" | "cancel" | "reactivate" | "update_usage" | "update_payment";
  newPlanId?: string;
  newBillingCycle?: "monthly" | "yearly";
  cancelAtPeriodEnd?: boolean;
  autoRenew?: boolean;
  currentStudents?: number;
  currentTeachers?: number;
  currentUsers?: number;
  paymentMethodId?: string;
  reason?: string;
}

// ============================================================================
// GET /api/billing/subscriptions/[subscriptionId] - Get subscription details
// ============================================================================

export const GET = createApiRoute<{ subscriptionId: string }>(
  async (req, auth, context) => {
    const { userId } = auth;
    const { subscriptionId } = await context!.params!;

    // Fetch subscription with tenant and plan details
    const subscriptionData = await db
      .select({
        id: subscriptions.id,
        tenantId: subscriptions.tenantId,
        planId: subscriptions.planId,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        trialEndDate: subscriptions.trialEndDate,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        price: subscriptions.price,
        currency: subscriptions.currency,
        billingCycle: subscriptions.billingCycle,
        autoRenew: subscriptions.autoRenew,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        isTrial: subscriptions.isTrial,
        trialDays: subscriptions.trialDays,
        trialConverted: subscriptions.trialConverted,
        paymentMethodId: subscriptions.paymentMethodId,
        paymentMethodType: subscriptions.paymentMethodType,
        discountCode: subscriptions.discountCode,
        discountPercentage: subscriptions.discountPercentage,
        discountAmount: subscriptions.discountAmount,
        maxUsers: subscriptions.maxUsers,
        currentUsers: subscriptions.currentUsers,
        maxStudents: subscriptions.maxStudents,
        currentStudents: subscriptions.currentStudents,
        maxTeachers: subscriptions.maxTeachers,
        currentTeachers: subscriptions.currentTeachers,
        metadata: subscriptions.metadata,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        // Tenant details
        tenantId2: tenants.id,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        tenantDomain: tenants.domain,
        tenantLogo: tenants.logo,
        tenantIsActive: tenants.isActive,
        // Plan details
        planId2: subscriptionPlans.id,
        planName: subscriptionPlans.name,
        planDescription: subscriptionPlans.description,
        planTier: subscriptionPlans.tier,
        planType: subscriptionPlans.planType,
        planFeatures: subscriptionPlans.features,
      })
      .from(subscriptions)
      .leftJoin(tenants, eq(subscriptions.tenantId, tenants.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (subscriptionData.length === 0) {
      return { error: "Subscription not found", status: 404 };
    }

    const sub = subscriptionData[0];

    // Get billing summary from invoices
    const invoiceStats = await db
      .select({
        totalInvoices: count(),
        paidInvoices: count(
          sql`CASE WHEN ${invoices.status} = 'paid' THEN 1 END`
        ),
        pendingInvoices: count(
          sql`CASE WHEN ${invoices.status} = 'pending' THEN 1 END`
        ),
        totalPaid: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.totalAmount} ELSE 0 END), 0)`,
        totalPending: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'pending' THEN ${invoices.totalAmount} ELSE 0 END), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.subscriptionId, subscriptionId));

    // Format response
    const subscriptionDetail: SubscriptionDetail = {
      id: sub.id,
      tenantId: sub.tenantId,
      planId: sub.planId,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      trialEndDate: sub.trialEndDate,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      price: sub.price,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      autoRenew: sub.autoRenew,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      isTrial: sub.isTrial,
      trialDays: sub.trialDays,
      trialConverted: sub.trialConverted,
      paymentMethodId: sub.paymentMethodId,
      paymentMethodType: sub.paymentMethodType,
      discountCode: sub.discountCode,
      discountPercentage: sub.discountPercentage,
      discountAmount: sub.discountAmount,
      maxUsers: sub.maxUsers,
      currentUsers: sub.currentUsers,
      maxStudents: sub.maxStudents,
      currentStudents: sub.currentStudents,
      maxTeachers: sub.maxTeachers,
      currentTeachers: sub.currentTeachers,
      tenant: sub.tenantId2
        ? {
            id: sub.tenantId2,
            name: sub.tenantName || "",
            slug: sub.tenantSlug || "",
            domain: sub.tenantDomain || undefined,
            logo: sub.tenantLogo || undefined,
            isActive: sub.tenantIsActive ?? true,
          }
        : undefined,
      plan: sub.planId2
        ? {
            id: sub.planId2,
            name: sub.planName || "",
            description: sub.planDescription || "",
            tier: sub.planTier || "",
            planType: sub.planType || "",
            features: (sub.planFeatures as Array<{
              name: string;
              description: string;
              included: boolean;
              limit?: number;
            }> | null) || undefined,
          }
        : undefined,
      billingSummary: {
        totalInvoices: Number(invoiceStats[0]?.totalInvoices || 0),
        paidInvoices: Number(invoiceStats[0]?.paidInvoices || 0),
        pendingInvoices: Number(invoiceStats[0]?.pendingInvoices || 0),
        totalPaid: Number(invoiceStats[0]?.totalPaid || 0),
        totalPending: Number(invoiceStats[0]?.totalPending || 0),
      },
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };

    logger.info("Subscription details fetched", { userId, subscriptionId });

    return { data: subscriptionDetail };
  },
  ["admin"]
);

// ============================================================================
// PATCH /api/billing/subscriptions/[subscriptionId] - Update subscription
// ============================================================================

export const PATCH = createApiRoute<{ subscriptionId: string }>(
  async (req, auth, context) => {
    const { userId } = auth;
    const { subscriptionId } = await context!.params!;
    const body: UpdateSubscriptionRequest = await req.json();
    const { action } = body;

    // Verify subscription exists
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (existing.length === 0) {
      return { error: "Subscription not found", status: 404 };
    }

    const subscription = existing[0];

    // Handle different actions
    switch (action) {
      case "change_plan": {
        if (!body.newPlanId) {
          return {
            error: "newPlanId is required for change_plan action",
            status: 400,
          };
        }

        // Verify new plan exists
        const newPlan = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, body.newPlanId))
          .limit(1);

        if (newPlan.length === 0) {
          return { error: "New plan not found", status: 404 };
        }

        // Calculate new pricing
        const newBillingCycle = body.newBillingCycle || subscription.billingCycle;
        let newPrice = newPlan[0].price;

        if (newBillingCycle === "yearly") {
          newPrice = newPrice * 12;
          if (newPlan[0].yearlyDiscount) {
            newPrice = newPrice - (newPrice * newPlan[0].yearlyDiscount) / 100;
          }
        }

        // Update subscription with new plan
        await db
          .update(subscriptions)
          .set({
            planId: body.newPlanId,
            price: newPrice,
            billingCycle: newBillingCycle,
            maxUsers: newPlan[0].maxUsers || subscription.maxUsers,
            maxStudents: newPlan[0].maxStudents || subscription.maxStudents,
            maxTeachers: newPlan[0].maxTeachers || subscription.maxTeachers,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));

        logger.info("Subscription plan changed", {
          subscriptionId,
          oldPlanId: subscription.planId,
          newPlanId: body.newPlanId,
          updatedBy: userId,
        });

        return {
          data: { message: "Plan changed successfully" },
          message: "Plan changed successfully",
        };
      }

      case "cancel": {
        await db
          .update(subscriptions)
          .set({
            cancelAtPeriodEnd: true,
            autoRenew: false,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));

        logger.info("Subscription cancellation scheduled", {
          subscriptionId,
          cancelAtPeriodEnd: true,
          updatedBy: userId,
          reason: body.reason,
        });

        return {
          data: { message: "Subscription will be cancelled at the end of the current period" },
          message: "Subscription cancellation scheduled",
        };
      }

      case "reactivate": {
        if (subscription.status === "canceled") {
          return {
            error: "Cannot reactivate a canceled subscription",
            status: 400,
          };
        }

        await db
          .update(subscriptions)
          .set({
            cancelAtPeriodEnd: false,
            autoRenew: true,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));

        logger.info("Subscription reactivated", {
          subscriptionId,
          updatedBy: userId,
        });

        return {
          data: { message: "Subscription reactivated successfully" },
          message: "Subscription reactivated",
        };
      }

      case "update_usage": {
        const updates: Record<string, number> = {};
        if (body.currentStudents !== undefined) updates.currentStudents = body.currentStudents;
        if (body.currentTeachers !== undefined) updates.currentTeachers = body.currentTeachers;
        if (body.currentUsers !== undefined) updates.currentUsers = body.currentUsers;

        await db
          .update(subscriptions)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));

        logger.info("Subscription usage updated", {
          subscriptionId,
          updates,
          updatedBy: userId,
        });

        return {
          data: { message: "Usage updated successfully" },
          message: "Usage updated",
        };
      }

      case "update_payment": {
        await db
          .update(subscriptions)
          .set({
            paymentMethodId: body.paymentMethodId || subscription.paymentMethodId,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));

        logger.info("Subscription payment method updated", {
          subscriptionId,
          paymentMethodId: body.paymentMethodId,
          updatedBy: userId,
        });

        return {
          data: { message: "Payment method updated successfully" },
          message: "Payment method updated",
        };
      }

      default: {
        // Generic updates
        const { action: _, ...updates } = body;

        // Only allow specific fields to be updated
        const allowedUpdates: Record<string, unknown> = {};
        if (updates.autoRenew !== undefined) allowedUpdates.autoRenew = updates.autoRenew;
        if (updates.cancelAtPeriodEnd !== undefined) allowedUpdates.cancelAtPeriodEnd = updates.cancelAtPeriodEnd;

        if (Object.keys(allowedUpdates).length === 0) {
          return { error: "No valid fields to update", status: 400 };
        }

        await db
          .update(subscriptions)
          .set({
            ...allowedUpdates,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));

        logger.info("Subscription updated", {
          subscriptionId,
          updates: allowedUpdates,
          updatedBy: userId,
        });

        return {
          data: { message: "Subscription updated successfully" },
          message: "Subscription updated",
        };
      }
    }
  },
  ["admin"]
);

// ============================================================================
// DELETE /api/billing/subscriptions/[subscriptionId] - Cancel subscription immediately
// ============================================================================

export const DELETE = createApiRoute<{ subscriptionId: string }>(
  async (req, auth, context) => {
    const { userId } = auth;
    const { subscriptionId } = await context!.params!;

    // Verify subscription exists
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (existing.length === 0) {
      return { error: "Subscription not found", status: 404 };
    }

    // Immediately cancel the subscription
    await db
      .update(subscriptions)
      .set({
        status: "canceled",
        cancelAtPeriodEnd: true,
        autoRenew: false,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId));

    logger.info("Subscription canceled immediately", {
      subscriptionId,
      canceledBy: userId,
    });

    return {
      data: { message: "Subscription canceled successfully" },
      message: "Subscription canceled",
    };
  },
  ["admin"]
);
