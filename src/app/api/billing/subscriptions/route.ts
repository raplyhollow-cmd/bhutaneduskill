/**
 * BILLING - SUBSCRIPTIONS API
 *
 * GET /api/billing/subscriptions - Get all subscriptions (with filters)
 * POST /api/billing/subscriptions - Create new subscription
 * PATCH /api/billing/subscriptions - Update subscription status
 * DELETE /api/billing/subscriptions - Cancel subscription
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { subscriptions, subscriptionPlans, tenants, users } from "@/lib/db/schema";
import { eq, desc, and, like, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const GET = createApiRoute(
  async (req, auth) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const plan = searchParams.get("plan");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(subscriptions.status, status));
    }
    if (plan) {
      conditions.push(eq(subscriptionPlans.id, plan));
    }
    if (search) {
      conditions.push(
        sql`${tenants.name} ILIKE ${`%${search}%`}`
      );
    }

    // Get subscriptions with related data
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const subscriptionsData = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        price: subscriptions.price,
        currency: subscriptions.currency,
        billingCycle: subscriptions.billingCycle,
        autoRenew: subscriptions.autoRenew,
        isTrial: subscriptions.isTrial,
        trialEndDate: subscriptions.trialEndDate,
        // Usage
        maxUsers: subscriptions.maxUsers,
        currentUsers: subscriptions.currentUsers,
        maxStudents: subscriptions.maxStudents,
        currentStudents: subscriptions.currentStudents,
        maxTeachers: subscriptions.maxTeachers,
        currentTeachers: subscriptions.currentTeachers,
        // Plan info
        planId: subscriptionPlans.id,
        planName: subscriptionPlans.name,
        planTier: subscriptionPlans.tier,
        // Tenant info
        tenantId: tenants.id,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        tenantDomain: tenants.domain,
      })
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .leftJoin(tenants, eq(subscriptions.tenantId, tenants.id))
      .where(whereClause)
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(subscriptions)
      .where(whereClause);

    // Calculate revenue stats
    const revenueStats = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${subscriptions.price}), 0)`,
        activeCount: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'active')`,
        trialCount: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'trialing')`,
        pastDueCount: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'past_due')`,
      })
      .from(subscriptions);

    // Get monthly recurring revenue (MRR)
    const mrrResult = await db
      .select({
        mrr: sql<number>`COALESCE(SUM(
          CASE
            WHEN ${subscriptions.billingCycle} = 'monthly' THEN ${subscriptions.price}
            ELSE ${subscriptions.price} / 12
          END
        ), 0)`,
      })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));

    // Format response data
    const formattedData = subscriptionsData.map((sub) => {
      return {
        id: sub.id,
        tenantName: sub.tenantName || "Unknown",
        tenantSlug: sub.tenantSlug,
        plan: sub.planName?.toLowerCase() || "unknown",
        status: sub.status,
        students: sub.currentStudents || 0,
        teachers: sub.currentTeachers || 0,
        renewalDate: sub.currentPeriodEnd?.toISOString() || sub.endDate?.toISOString() || new Date().toISOString(),
        totalPaid: sub.price || 0,
        isTrial: sub.isTrial,
        trialEndDate: sub.trialEndDate?.toISOString(),
        autoRenew: sub.autoRenew,
        price: sub.price,
        currency: sub.currency,
        billingCycle: sub.billingCycle,
      };
    });

    return {
      data: formattedData,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
      },
      stats: {
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        activeSubscriptions: revenueStats[0]?.activeCount || 0,
        trialSubscriptions: revenueStats[0]?.trialCount || 0,
        pastDueSubscriptions: revenueStats[0]?.pastDueCount || 0,
        monthlyRecurring: mrrResult[0]?.mrr || 0,
        pendingInvoices: 0, // Will be updated from invoices endpoint
        overduePayments: revenueStats[0]?.pastDueCount || 0,
      },
    };
  },
  ["admin"]
);

export const POST = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;
    const body = await req.json();

    const { tenantId, planId, billingCycle = "yearly", isTrial = false, trialDays = 30 } = body;

    if (!tenantId || !planId) {
      return { error: "tenantId and planId are required", status: 400 };
    }

    // Get plan details
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (plan.length === 0) {
      return { error: "Plan not found", status: 404 };
    }

    const planData = plan[0];
    const now = new Date();
    const startDate = now;
    let endDate = new Date(now);
    let trialEndDate = null;

    if (isTrial && trialDays > 0) {
      trialEndDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      endDate = trialEndDate;
    } else {
      if (billingCycle === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
    }

    // Create subscription
    const subscriptionId = `sub-${nanoid()}`;
    await db.insert(subscriptions).values({
      id: subscriptionId,
      tenantId,
      planId,
      startDate,
      endDate,
      trialEndDate,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      status: isTrial ? "trialing" : "active",
      maxUsers: planData.maxUsers || 100,
      maxStudents: planData.maxStudents || 500,
      maxTeachers: planData.maxTeachers || 50,
      price: planData.price,
      currency: planData.currency,
      billingCycle,
      isTrial,
      trialDays: isTrial ? trialDays : 0,
      autoRenew: true,
      createdAt: now,
      updatedAt: now,
    });

    // Get created subscription with details
    const created = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        tenantId: tenants.id,
        tenantName: tenants.name,
        planName: subscriptionPlans.name,
        price: subscriptions.price,
        currency: subscriptions.currency,
      })
      .from(subscriptions)
      .leftJoin(tenants, eq(subscriptions.tenantId, tenants.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    return {
      data: created[0],
    };
  },
  ["admin"]
);

export const PATCH = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;
    const body = await req.json();

    const { subscriptionId, action, ...updates } = body;

    if (!subscriptionId) {
      return { error: "subscriptionId is required", status: 400 };
    }

    // Handle specific actions
    if (action === "cancel") {
      await db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscriptionId));

      return {
        message: "Subscription will be cancelled at the end of the current period",
      };
    }

    if (action === "activate") {
      await db
        .update(subscriptions)
        .set({
          status: "active",
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscriptionId));

      return {
        message: "Subscription activated successfully",
      };
    }

    if (action === "update_usage") {
      const { currentStudents, currentTeachers, currentUsers } = updates;

      await db
        .update(subscriptions)
        .set({
          ...(currentStudents !== undefined && { currentStudents }),
          ...(currentTeachers !== undefined && { currentTeachers }),
          ...(currentUsers !== undefined && { currentUsers }),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscriptionId));

      return {
        message: "Usage updated successfully",
      };
    }

    // Generic updates
    await db
      .update(subscriptions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId));

    return {
      message: "Subscription updated successfully",
    };
  },
  ["admin"]
);

export const DELETE = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscriptionId");

    if (!subscriptionId) {
      return { error: "subscriptionId is required", status: 400 };
    }

    await db
      .update(subscriptions)
      .set({
        status: "canceled",
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId));

    return {
      message: "Subscription canceled successfully",
    };
  },
  ["admin"]
);
