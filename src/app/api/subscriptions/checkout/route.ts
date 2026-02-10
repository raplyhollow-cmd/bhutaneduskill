import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createRMAGateway } from "@/lib/payment/rma-gateway";

// ============================================================================
// POST /api/subscriptions/checkout - Initiate subscription checkout
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { planId, subscriptionType, billingInterval } = body;

    // Validate subscription type
    if (!["school", "user"].includes(subscriptionType)) {
      return NextResponse.json(
        { error: "Invalid subscription type. Must be 'school' or 'user'" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.APP_URL || request.nextUrl.origin;
    const successUrl = `${baseUrl}/billing/success?session={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/billing/cancel`;

    // Handle school subscription (B2B)
    if (subscriptionType === "school") {
      // Only admins can subscribe schools
      if (currentUser.type !== "admin") {
        return NextResponse.json(
          { error: "Only school admins can subscribe" },
          { status: 403 }
        );
      }

      const { subscriptionPlans: subscriptionPlansTable, schoolSubscriptions: schoolSubscriptionsTable } =
        await import("@/lib/db/subscription-schema");

      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlansTable.id, planId),
      });

      if (!plan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }

      // Check for existing subscription
      const existingSubscription = await db.query.schoolSubscriptions.findFirst({
        where: eq(schoolSubscriptionsTable.schoolId, currentUser.schoolId || ""),
      });

      const amount = billingInterval === "monthly"
        ? Math.floor(plan.price / 12)
        : plan.price;

      // Create or update subscription
      const subscriptionId = existingSubscription?.id || nanoid();

      if (!existingSubscription) {
        await db.insert(schoolSubscriptionsTable).values({
          id: subscriptionId,
          schoolId: currentUser.schoolId || "",
          planId: plan.id,
          status: "trialing",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          currentStudentCount: 0,
          currentTeacherCount: 0,
          currentStorageUsed: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Initiate RMA payment
      const gateway = createRMAGateway();
      const paymentResult = await gateway.initiatePayment({
        referenceId: subscriptionId,
        amount,
        currency: "BTN",
        paymentMethod: "internet_banking",
        customerName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
        customerEmail: currentUser.email || undefined,
        customerPhone: currentUser.phone || undefined,
        customerId: currentUser.id,
        returnUrl: successUrl.replace("{CHECKOUT_SESSION_ID}", subscriptionId),
        cancelUrl,
        description: `School Subscription - ${plan.name} (${billingInterval})`,
        metadata: {
          type: "school_subscription",
          planId,
          subscriptionId,
        },
      });

      if (!paymentResult.success) {
        return NextResponse.json(
          { error: paymentResult.error || "Failed to initiate payment" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        subscriptionId,
        paymentUrl: paymentResult.paymentUrl,
        qrCodeData: paymentResult.qrCodeData,
        amount: `Nu.${amount.toLocaleString()}`,
        plan: plan.name,
      });
    }

    // Handle user premium subscription (B2C)
    if (subscriptionType === "user") {
      const { premiumPlans: premiumPlansTable, userSubscriptions: userSubscriptionsTable } =
        await import("@/lib/db/subscription-schema");

      const plan = await db.query.premiumPlans.findFirst({
        where: eq(premiumPlansTable.id, planId),
      });

      if (!plan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }

      // Check for existing active subscription
      const existingSubscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptionsTable.userId, currentUser.id),
          eq(userSubscriptionsTable.status, "active")
        ),
      });

      if (existingSubscription) {
        return NextResponse.json(
          { error: "You already have an active subscription" },
          { status: 400 }
        );
      }

      // Calculate price
      let amount = plan.yearlyPrice || plan.monthlyPrice || 0;
      if (billingInterval === "monthly" && plan.monthlyPrice) {
        amount = plan.monthlyPrice;
      } else if (plan.lifetimePrice) {
        amount = plan.lifetimePrice;
      }

      // Create subscription record
      const subscriptionId = nanoid();

      await db.insert(userSubscriptionsTable).values({
        id: subscriptionId,
        userId: currentUser.id,
        planId: plan.id,
        status: "active",
        autoRenew: true,
        currentPeriodStart: new Date(),
        currentPeriodEnd: billingInterval === "lifetime"
          ? null
          : new Date(Date.now() + (billingInterval === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000),
        aiConsultationsUsed: 0,
        premiumAssessmentsTaken: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Initiate RMA payment
      const gateway = createRMAGateway();
      const paymentResult = await gateway.initiatePayment({
        referenceId: subscriptionId,
        amount,
        currency: "BTN",
        paymentMethod: "internet_banking",
        customerName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
        customerEmail: currentUser.email || undefined,
        customerPhone: currentUser.phone || undefined,
        customerId: currentUser.id,
        returnUrl: successUrl.replace("{CHECKOUT_SESSION_ID}", subscriptionId),
        cancelUrl,
        description: `Premium Subscription - ${plan.name} (${billingInterval})`,
        metadata: {
          type: "user_subscription",
          planId,
          subscriptionId,
        },
      });

      if (!paymentResult.success) {
        return NextResponse.json(
          { error: paymentResult.error || "Failed to initiate payment" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        subscriptionId,
        paymentUrl: paymentResult.paymentUrl,
        qrCodeData: paymentResult.qrCodeData,
        amount: `Nu.${amount.toLocaleString()}`,
        plan: plan.name,
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Subscription checkout error:", error);
    return NextResponse.json({ error: "Failed to initiate checkout" }, { status: 500 });
  }
}

// ============================================================================
// GET /api/subscriptions/checkout - Get available plans
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "school"; // "school" or "user"

    if (type === "school") {
      const { subscriptionPlans: subscriptionPlansTable } = await import("@/lib/db/subscription-schema");

      const plans = await db.query.subscriptionPlans.findMany({
        where: eq(subscriptionPlansTable.isActive, true),
        orderBy: [subscriptionPlansTable.sortOrder],
      });

      return NextResponse.json({ plans });
    }

    if (type === "user") {
      const { premiumPlans: premiumPlansTable } = await import("@/lib/db/subscription-schema");

      const plans = await db.query.premiumPlans.findMany({
        where: eq(premiumPlansTable.isActive, true),
        orderBy: [premiumPlansTable.sortOrder],
      });

      return NextResponse.json({ plans });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error) {
    console.error("Plans fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
