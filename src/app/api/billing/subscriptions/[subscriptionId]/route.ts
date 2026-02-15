/**
 * INDIVIDUAL SUBSCRIPTION MANAGEMENT API (Platform Admin)
 *
 * GET /api/billing/subscriptions/[subscriptionId] - Get subscription details
 * PATCH /api/billing/subscriptions/[subscriptionId] - Update subscription
 * DELETE /api/billing/subscriptions/[subscriptionId] - Cancel subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  subscriptions,
  subscriptionPlans,
  tenants,
  invoices,
  paymentTransactions,
} from "@/lib/db/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
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
    code: string;
    type: string;
    status: string;
    email?: string;
    phone?: string;
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

type RouteContext = {
  params: Promise<{ subscriptionId: string }>;
};

// ============================================================================
// GET /api/billing/subscriptions/[subscriptionId] - Get subscription details
// ============================================================================

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;
  const { subscriptionId } = await context.params;

  try {
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
        tenantCode: tenants.code,
        tenantType: tenants.type,
        tenantStatus: tenants.status,
        tenantEmail: tenants.email,
        tenantPhone: tenants.phone,
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
      return NextResponse.json(
        { error: "Subscription not found", status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
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
            code: sub.tenantCode || "",
            type: sub.tenantType || "",
            status: sub.tenantStatus || "",
            email: sub.tenantEmail || undefined,
            phone: sub.tenantPhone || undefined,
          }
        : undefined,
      plan: sub.planId2
        ? {
            id: sub.planId2,
            name: sub.planName || "",
            description: sub.planDescription || "",
            tier: sub.planTier || "",
            planType: sub.planType || "",
            features: (sub.planFeatures as any) || undefined,
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

    return NextResponse.json({
      data: subscriptionDetail,
    } satisfies ApiSuccess<SubscriptionDetail>);

  } catch (error) {
    logger.apiError(error, {
      route: `/api/billing/subscriptions/${subscriptionId}`,
      method: "GET",
      userId,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch subscription details",
        status: 500,
        details: error instanceof Error ? error.message : undefined,
      } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/billing/subscriptions/[subscriptionId] - Update subscription
// ============================================================================

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;
  const { subscriptionId } = await context.params;

  try {
    const body: UpdateSubscriptionRequest = await request.json();
    const { action } = body;

    // Verify subscription exists
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found", status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    const subscription = existing[0];

    // Handle different actions
    switch (action) {
      case "change_plan": {
        if (!body.newPlanId) {
          return NextResponse.json(
            { error: "newPlanId is required for change_plan action", status: 400 } as ApiErrorResponse,
            { status: 400 }
          );
        }

        // Verify new plan exists
        const newPlan = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, body.newPlanId))
          .limit(1);

        if (newPlan.length === 0) {
          return NextResponse.json(
            { error: "New plan not found", status: 404 } as ApiErrorResponse,
            { status: 404 }
          );
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

        return NextResponse.json({
          data: { message: "Plan changed successfully" },
          message: "Plan changed successfully",
        } satisfies ApiSuccess<{ message: string }>);
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

        return NextResponse.json({
          data: { message: "Subscription will be cancelled at the end of the current period" },
          message: "Subscription cancellation scheduled",
        } satisfies ApiSuccess<{ message: string }>);
      }

      case "reactivate": {
        if (subscription.status === "canceled") {
          return NextResponse.json(
            { error: "Cannot reactivate a canceled subscription", status: 400 } as ApiErrorResponse,
            { status: 400 }
          );
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

        return NextResponse.json({
          data: { message: "Subscription reactivated successfully" },
          message: "Subscription reactivated",
        } satisfies ApiSuccess<{ message: string }>);
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

        return NextResponse.json({
          data: { message: "Usage updated successfully" },
          message: "Usage updated",
        } satisfies ApiSuccess<{ message: string }>);
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

        return NextResponse.json({
          data: { message: "Payment method updated successfully" },
          message: "Payment method updated",
        } satisfies ApiSuccess<{ message: string }>);
      }

      default: {
        // Generic updates
        const { action: _, ...updates } = body;

        // Only allow specific fields to be updated
        const allowedUpdates: Record<string, any> = {};
        if (updates.autoRenew !== undefined) allowedUpdates.autoRenew = updates.autoRenew;
        if (updates.cancelAtPeriodEnd !== undefined) allowedUpdates.cancelAtPeriodEnd = updates.cancelAtPeriodEnd;

        if (Object.keys(allowedUpdates).length === 0) {
          return NextResponse.json(
            { error: "No valid fields to update", status: 400 } as ApiErrorResponse,
            { status: 400 }
          );
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

        return NextResponse.json({
          data: { message: "Subscription updated successfully" },
          message: "Subscription updated",
        } satisfies ApiSuccess<{ message: string }>);
      }
    }

  } catch (error) {
    logger.apiError(error, {
      route: `/api/billing/subscriptions/${subscriptionId}`,
      method: "PATCH",
      userId,
    });
    return NextResponse.json(
      {
        error: "Failed to update subscription",
        status: 500,
        details: error instanceof Error ? error.message : undefined,
      } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/billing/subscriptions/[subscriptionId] - Cancel subscription immediately
// ============================================================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;
  const { subscriptionId } = await context.params;

  try {
    // Verify subscription exists
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found", status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
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

    return NextResponse.json({
      data: { message: "Subscription canceled successfully" },
      message: "Subscription canceled",
    } satisfies ApiSuccess<{ message: string }>);

  } catch (error) {
    logger.apiError(error, {
      route: `/api/billing/subscriptions/${subscriptionId}`,
      method: "DELETE",
      userId,
    });
    return NextResponse.json(
      {
        error: "Failed to cancel subscription",
        status: 500,
        details: error instanceof Error ? error.message : undefined,
      } as ApiErrorResponse,
      { status: 500 }
    );
  }
}
