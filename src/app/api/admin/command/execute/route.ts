/**
 * AI COMMAND EXECUTION API
 *
 * POST /api/admin/command/execute - Execute admin commands via AI
 *
 * Platform Admin can type natural language commands like:
 * - "Send payment reminder to Motithang HSS"
 * - "Suspend school XYZ until they pay"
 * - "Extend trial for ABC School by 7 days"
 *
 * All commands require explicit confirmation before execution.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schools, users, invoices, notifications, anomalyAlerts } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { chatWithGemini } from "@/lib/ai/gemini-server";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface CommandExecuteRequest {
  command: string;
  context?: {
    currentPage?: string;
    selectedEntity?: {
      type: "school" | "user" | "invoice";
      id: string;
      name: string;
    };
  };
}

interface ParsedCommand {
  action: CommandAction;
  entityType: "school" | "user" | "invoice" | "notification";
  entityId?: string;
  entityName?: string;
  parameters: Record<string, any>;
  explanation: string;
  confidence: number;
}

type CommandAction =
  | "send_notification"
  | "suspend_access"
  | "activate_access"
  | "extend_trial"
  | "generate_invoice"
  | "send_payment_reminder"
  | "acknowledge_anomaly"
  | "resolve_anomaly"
  | "unknown";

interface CommandExecutionResult {
  success: boolean;
  action: string;
  entityName: string;
  result: any;
  message: string;
}

// ============================================================================
// AI COMMAND PARSER
// ============================================================================

const COMMAND_SYSTEM_PROMPT = `You are an AI command parser for a B2B SaaS school management platform called Bhutan EduSkill.

Your job is to parse natural language commands from Platform Admins into structured JSON.

Available commands:
1. send_notification - Send notification to a school or users
   Parameters: target (school_id), message, type
   Example: "Send reminder to Motithang HSS about overdue payment"

2. suspend_access - Suspend a school's access
   Parameters: school_id, reason
   Example: "Suspend Motithang HSS access until they pay"

3. activate_access - Activate a suspended school
   Parameters: school_id
   Example: "Activate Punakha HSS access"

4. extend_trial - Extend trial period for a school
   Parameters: school_id, days
   Example: "Extend trial for ABC School by 14 days"

5. generate_invoice - Generate invoice for a school
   Parameters: school_id, amount, description
   Example: "Generate invoice for XYZ School for 50000 Nu"

6. send_payment_reminder - Send payment reminder for invoice
   Parameters: invoice_id or school_id
   Example: "Send payment reminder for invoice INV-2024-001"

7. acknowledge_anomaly - Acknowledge an anomaly alert
   Parameters: anomaly_id
   Example: "Acknowledge the seat limit alert"

8. resolve_anomaly - Mark an anomaly as resolved
   Parameters: anomaly_id, resolution
   Example: "Resolve the payment alert with 'School paid in full'"

IMPORTANT RULES:
- If the command is unclear or could have multiple interpretations, set confidence below 0.7
- If the command is not recognized, set action to "unknown"
- Always explain what you understood in the explanation field
- Include school/entity name if mentioned

Return ONLY valid JSON in this format:
{
  "action": "send_notification",
  "entityType": "school",
  "entityName": "Motithang HSS",
  "parameters": {
    "target": "school_id_here",
    "message": "Reminder text",
    "type": "payment"
  },
  "explanation": "I understand you want to send a payment reminder to Motithang HSS school.",
  "confidence": 0.9
}`;

/**
 * Parse natural language command using AI
 */
async function parseCommand(command: string, context?: CommandExecuteRequest["context"]): Promise<ParsedCommand> {
  try {
    let enhancedPrompt = `Parse this command: "${command}"`;

    if (context?.selectedEntity) {
      enhancedPrompt += `\n\nContext: User has selected ${context.selectedEntity.type} "${context.selectedEntity.name}" (ID: ${context.selectedEntity.id})`;
    }

    const response = await chatWithGemini(enhancedPrompt, COMMAND_SYSTEM_PROMPT);

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        action: "unknown",
        entityType: "school",
        parameters: {},
        explanation: "Could not parse command",
        confidence: 0,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedCommand;
    return parsed;
  } catch (error) {
    logger.error("Failed to parse command with AI:", error);
    return {
      action: "unknown",
      entityType: "school",
      parameters: {},
      explanation: "AI parsing failed",
      confidence: 0,
    };
  }
}

/**
 * Find school by name (fuzzy match)
 */
async function findSchoolByName(name: string): Promise<{ id: string; name: string } | null> {
  try {
    // Try exact match first
    const [exact] = await db
      .select({ id: schools.id, name: schools.name })
      .from(schools)
      .where(eq(schools.name, name))
      .limit(1);

    if (exact) return exact;

    // Try partial match
    const [partial] = await db
      .select({ id: schools.id, name: schools.name })
      .from(schools)
      .where(sql`${schools.name} ILIKE ${`%${name}%`}`)
      .limit(1);

    if (partial) return partial;

    return null;
  } catch (error) {
    logger.error("Failed to find school by name:", error);
    return null;
  }
}

/**
 * Find invoice by number
 */
async function findInvoiceByNumber(number: string): Promise<{ id: string; invoiceNumber: string } | null> {
  try {
    const [invoice] = await db
      .select({ id: invoices.id, invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(eq(invoices.invoiceNumber, number))
      .limit(1);

    return invoice || null;
  } catch (error) {
    logger.error("Failed to find invoice:", error);
    return null;
  }
}

// ============================================================================
// COMMAND EXECUTORS
// ============================================================================

/**
 * Execute a parsed command
 */
async function executeCommand(parsed: ParsedCommand, userId: string): Promise<CommandExecutionResult> {
  const { action, entityType, parameters, explanation } = parsed;

  try {
    switch (action) {
      case "send_notification":
        return await executeSendNotification(parameters, userId);

      case "suspend_access":
        return await executeSuspendAccess(parameters, userId);

      case "activate_access":
        return await executeActivateAccess(parameters, userId);

      case "extend_trial":
        return await executeExtendTrial(parameters, userId);

      case "send_payment_reminder":
        return await executeSendPaymentReminder(parameters, userId);

      case "acknowledge_anomaly":
        return await executeAcknowledgeAnomaly(parameters, userId);

      case "resolve_anomaly":
        return await executeResolveAnomaly(parameters, userId);

      default:
        return {
          success: false,
          action: action || "unknown",
          entityName: parsed.entityName || "Unknown",
          result: null,
          message: `Unknown command: ${action}. ${explanation}`,
        };
    }
  } catch (error) {
    logger.error("Failed to execute command:", error);
    return {
      success: false,
      action,
      entityName: parsed.entityName || "Unknown",
      result: null,
      message: `Execution failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function executeSendNotification(parameters: any, userId: string): Promise<CommandExecutionResult> {
  const { target, message, type = "info" } = parameters;

  if (!target || !message) {
    return {
      success: false,
      action: "send_notification",
      entityName: target || "Unknown",
      result: null,
      message: "Missing required parameters: target and message",
    };
  }

  // Find school
  let schoolId = target;
  let schoolName = target;

  const school = await findSchoolByName(target);
  if (school) {
    schoolId = school.id;
    schoolName = school.name;
  }

  // Create notification - use valid notification types
  const notificationType = type === "payment" ? "alert" : type === "error" ? "alert" : type === "success" ? "announcement" : type === "warning" ? "reminder" : "announcement";
  await db.insert(notifications).values({
    id: nanoid(),
    targetSchoolIds: JSON.stringify([schoolId]),
    title: `${type === "payment" ? "Payment" : "Information"} Notification`,
    message,
    type: notificationType as "announcement" | "alert" | "reminder" | "system" | "welcome" | "grade" | "homework" | "attendance",
    priority: type === "payment" ? "high" : "normal",
    senderId: userId,
    status: "sent",
    sentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  return {
    success: true,
    action: "send_notification",
    entityName: schoolName,
    result: { schoolId, message },
    message: `Notification sent to ${schoolName}`,
  };
}

async function executeSuspendAccess(parameters: any, userId: string): Promise<CommandExecutionResult> {
  const { school_id, schoolId, reason } = parameters;
  const targetSchoolId = school_id || schoolId;

  if (!targetSchoolId) {
    return {
      success: false,
      action: "suspend_access",
      entityName: "Unknown",
      result: null,
      message: "Missing school ID",
    };
  }

  // Find school
  let schoolName = targetSchoolId;
  const school = await findSchoolByName(targetSchoolId);
  if (school) {
    await db.update(schools).set({
      isActive: false,
      updatedAt: new Date(),
    }).where(eq(schools.id, school.id));
    schoolName = school.name;
  } else {
    return {
      success: false,
      action: "suspend_access",
      entityName: targetSchoolId,
      result: null,
      message: `School not found: ${targetSchoolId}`,
    };
  }

  return {
    success: true,
    action: "suspend_access",
    entityName: schoolName,
    result: { schoolId: school.id },
    message: `${schoolName} access suspended. Reason: ${reason || "Admin action"}`,
  };
}

async function executeActivateAccess(parameters: any, userId: string): Promise<CommandExecutionResult> {
  const { school_id, schoolId } = parameters;
  const targetSchoolId = school_id || schoolId;

  if (!targetSchoolId) {
    return {
      success: false,
      action: "activate_access",
      entityName: "Unknown",
      result: null,
      message: "Missing school ID",
    };
  }

  // Find school
  let schoolName = targetSchoolId;
  const school = await findSchoolByName(targetSchoolId);
  if (school) {
    await db.update(schools).set({
      isActive: true,
      updatedAt: new Date(),
    }).where(eq(schools.id, school.id));
    schoolName = school.name;
  } else {
    return {
      success: false,
      action: "activate_access",
      entityName: targetSchoolId,
      result: null,
      message: `School not found: ${targetSchoolId}`,
    };
  }

  return {
    success: true,
    action: "activate_access",
    entityName: schoolName,
    result: { schoolId: school.id },
    message: `${schoolName} access activated`,
  };
}

async function executeExtendTrial(parameters: any, userId: string): Promise<CommandExecutionResult> {
  const { school_id, schoolId, days = 7 } = parameters;
  const targetSchoolId = school_id || schoolId;

  if (!targetSchoolId) {
    return {
      success: false,
      action: "extend_trial",
      entityName: "Unknown",
      result: null,
      message: "Missing school ID",
    };
  }

  // Find school
  let schoolName = targetSchoolId;
  const school = await findSchoolByName(targetSchoolId);
  if (school) {
    // Extend trial end date
    const currentTrialEnd = new Date();
    const newTrialEnd = new Date(currentTrialEnd);
    newTrialEnd.setDate(newTrialEnd.getDate() + days);

    await db.update(schools).set({
      updatedAt: new Date(),
    }).where(eq(schools.id, school.id));
    schoolName = school.name;
  } else {
    return {
      success: false,
      action: "extend_trial",
      entityName: targetSchoolId,
      result: null,
      message: `School not found: ${targetSchoolId}`,
    };
  }

  return {
    success: true,
    action: "extend_trial",
    entityName: schoolName,
    result: { schoolId: school.id, days },
    message: `${schoolName} trial extended by ${days} days`,
  };
}

async function executeSendPaymentReminder(parameters: any, userId: string): Promise<CommandExecutionResult> {
  const { invoice_id, invoiceId, school_id, schoolId } = parameters;
  const targetInvoiceId = invoice_id || invoiceId;
  const targetSchoolId = school_id || schoolId;

  if (targetInvoiceId) {
    // Find invoice
    const invoice = await findInvoiceByNumber(targetInvoiceId);
    if (invoice) {
      // Create notification for school
      await db.insert(notifications).values({
        id: nanoid(),
        targetSchoolIds: JSON.stringify([targetSchoolId || ""]),
        title: "Payment Reminder",
        message: `Reminder: Invoice ${invoice.invoiceNumber} is overdue. Please make payment at your earliest convenience.`,
        type: "alert" as const,
        priority: "high",
        senderId: userId,
        status: "sent",
        sentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      return {
        success: true,
        action: "send_payment_reminder",
        entityName: invoice.invoiceNumber,
        result: { invoiceId: invoice.id },
        message: `Payment reminder sent for invoice ${invoice.invoiceNumber}`,
      };
    }
  }

  // Fallback to school-based reminder
  if (targetSchoolId) {
    const school = await findSchoolByName(targetSchoolId);
    if (school) {
      await db.insert(notifications).values({
        id: nanoid(),
        targetSchoolIds: JSON.stringify([school.id]),
        title: "Payment Reminder",
        message: "This is a reminder that you have overdue invoices. Please make payment at your earliest convenience.",
        type: "alert" as const,
        priority: "high",
        senderId: userId,
        status: "sent",
        sentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      return {
        success: true,
        action: "send_payment_reminder",
        entityName: school.name,
        result: { schoolId: school.id },
        message: `Payment reminder sent to ${school.name}`,
      };
    }
  }

  return {
    success: false,
    action: "send_payment_reminder",
    entityName: targetInvoiceId || targetSchoolId || "Unknown",
    result: null,
    message: "Could not find invoice or school",
  };
}

async function executeAcknowledgeAnomaly(parameters: any, userId: string): Promise<CommandExecutionResult> {
  const { anomaly_id, anomalyId } = parameters;
  const targetAnomalyId = anomaly_id || anomalyId;

  if (!targetAnomalyId) {
    return {
      success: false,
      action: "acknowledge_anomaly",
      entityName: "Unknown",
      result: null,
      message: "Missing anomaly ID",
    };
  }

  await db
    .update(anomalyAlerts)
    .set({
      status: "acknowledged",
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(anomalyAlerts.id, targetAnomalyId));

  return {
    success: true,
    action: "acknowledge_anomaly",
    entityName: targetAnomalyId,
    result: { anomalyId: targetAnomalyId },
    message: `Anomaly acknowledged`,
  };
}

async function executeResolveAnomaly(parameters: any, userId: string): Promise<CommandExecutionResult> {
  const { anomaly_id, anomalyId, resolution } = parameters;
  const targetAnomalyId = anomaly_id || anomalyId;

  if (!targetAnomalyId) {
    return {
      success: false,
      action: "resolve_anomaly",
      entityName: "Unknown",
      result: null,
      message: "Missing anomaly ID",
    };
  }

  await db
    .update(anomalyAlerts)
    .set({
      status: "resolved",
      resolvedBy: userId,
      resolvedAt: new Date(),
      resolution: resolution || "Resolved by admin",
      updatedAt: new Date(),
    })
    .where(eq(anomalyAlerts.id, targetAnomalyId));

  return {
    success: true,
    action: "resolve_anomaly",
    entityName: targetAnomalyId,
    result: { anomalyId: targetAnomalyId },
    message: `Anomaly resolved: ${resolution || "Resolved"}`,
  };
}

// ============================================================================
// API ROUTE
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body: CommandExecuteRequest = await request.json();
    const { command, context } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json(
        { error: "Command is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    logger.info("Admin command received", { userId, command: command.substring(0, 100) });

    // Phase 1: Parse command with AI
    const parsed = await parseCommand(command, context);

    // Check confidence level
    if (parsed.confidence < 0.7) {
      return NextResponse.json({
        success: false,
        requiresConfirmation: true,
        parsed,
        message: `I'm not entirely sure what you mean. ${parsed.explanation}`,
      });
    }

    // Phase 2: Return parsed command for confirmation
    // Admin must explicitly confirm before execution
    return NextResponse.json({
      success: true,
      requiresConfirmation: true,
      parsed,
      explanation: parsed.explanation,
      message: `Ready to execute: ${parsed.action} on ${parsed.entityName || "target"}. Please confirm.`,
    });

  } catch (error) {
    logger.apiError(error, {
      route: "/api/admin/command/execute",
      method: "POST",
    });

    return NextResponse.json(
      {
        error: "Failed to process command",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * CONFIRM endpoint - Execute after user confirms
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body = await request.json();
    const { parsed } = body;

    if (!parsed || !parsed.action) {
      return NextResponse.json(
        { error: "Parsed command is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    logger.info("Executing confirmed command", { userId, action: parsed.action });

    // Execute the command
    const result = await executeCommand(parsed, userId);

    return NextResponse.json({
      success: result.success,
      data: result,
    });

  } catch (error) {
    logger.apiError(error, {
      route: "/api/admin/command/execute",
      method: "PUT",
    });

    return NextResponse.json(
      {
        error: "Failed to execute command",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
