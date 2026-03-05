/**
 * Subscriptions Feature Definition
 */

import { defineFeature } from "@/lib/features/define-feature";

export const SubscriptionsFeature = defineFeature({
  name: "subscriptions",
  tableName: "subscriptions",

  schema: {
    id: {
      type: "text",
      required: true,
      primary: true,
      label: "ID",
    },
    name: {
      type: "text",
      required: true,
      label: "Name",
      sortable: true,
    },
    createdAt: {
      type: "timestamp",
      label: "Created At",
      sortable: true,
    },
    updatedAt: {
      type: "timestamp",
      label: "Updated At",
      sortable: true,
    },
  },

  permissions: {
    read: ["school-admin", "teacher", "ministry"],
    create: ["school-admin"],
    update: ["school-admin"],
    delete: ["school-admin"],
  },

  ui: {
    title: "Subscriptions",
    titlePlural: "Subscriptions",
    basePath: "/admin/subscriptions",
    icon: "FileText",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "createdAt", label: "Created", sortable: true },
    ],
  },

  // Webhooks (external service callbacks)
  webhooks: {
    // Stripe webhook for payment events
    stripe: {
      source: "stripe",
      verifySignature: true,
      secretHeader: "stripe-signature",
      handler: async (data: any, request: Request) => {
        const { logger } = await import("@/lib/logger");
        const { db } = await import("@/lib/db");
        const { subscriptions } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");

        const eventType = data.type;
        const eventData = data.data;

        logger.info("Stripe webhook received", { eventType });

        switch (eventType) {
          case "checkout.session.completed": {
            // New subscription started
            const sessionId = eventData.id;
            const customerId = eventData.customer;
            const subscriptionId = eventData.subscription;

            logger.info("Checkout completed", { sessionId, customerId, subscriptionId });

            // Update subscription record
            if (subscriptionId) {
              await db
                .update(subscriptions)
                .set({
                  status: "active",
                  stripeSubscriptionId: subscriptionId,
                  stripeCustomerId: customerId,
                  updatedAt: new Date(),
                })
                .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
            }

            return { success: true, message: "Checkout completed" };
          }

          case "customer.subscription.created":
          case "customer.subscription.updated": {
            // Subscription created or updated
            const subscription = eventData;
            const status = subscription.status;
            const customerId = subscription.customer;

            logger.info("Subscription updated", { subscriptionId: subscription.id, status });

            await db
              .update(subscriptions)
              .set({
                status: status === "active" ? "active" : status === "past_due" ? "past_due" : "cancelled",
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

            return { success: true, message: "Subscription updated" };
          }

          case "customer.subscription.deleted": {
            // Subscription cancelled
            const subscription = eventData;

            logger.info("Subscription cancelled", { subscriptionId: subscription.id });

            await db
              .update(subscriptions)
              .set({
                status: "cancelled",
                cancelledAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

            return { success: true, message: "Subscription cancelled" };
          }

          case "invoice.paid": {
            // Payment succeeded
            const invoice = eventData;
            const subscriptionId = invoice.subscription;

            logger.info("Invoice paid", { subscriptionId, amount: invoice.amount_paid });

            // Update subscription if it was past_due
            if (subscriptionId) {
              await db
                .update(subscriptions)
                .set({
                  status: "active",
                  updatedAt: new Date(),
                })
                .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
            }

            return { success: true, message: "Invoice paid" };
          }

          case "invoice.payment_failed": {
            // Payment failed
            const invoice = eventData;
            const subscriptionId = invoice.subscription;

            logger.info("Invoice payment failed", { subscriptionId });

            if (subscriptionId) {
              await db
                .update(subscriptions)
                .set({
                  status: "past_due",
                  updatedAt: new Date(),
                })
                .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
            }

            return { success: true, message: "Payment failed recorded" };
          }

          default:
            return { success: true, message: "Event acknowledged" };
        }
      },
    },
  },
});
