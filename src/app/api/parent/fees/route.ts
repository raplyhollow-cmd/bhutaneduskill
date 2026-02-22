/**
 * GET /api/parent/fees - Fetch fee/invoice information for parent's children
 *
 * Returns fee payment status and amounts for all children linked to the parent,
 * querying student_fees table linked to children's schools.
 */

import { createSafeHandler } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, parents, parentToStudent, students, studentFees, schools, feePayments } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

/**
 * Student fee information
 */
interface StudentFeeInfo {
  id: string;
  studentId: string;
  studentName: string;
  feeType: string;
  amount: number;
  totalAmount: number | null;
  amountPaid: number | null;
  amountPending: number | null;
  amountWaived: number | null;
  currency: string;
  frequency: string;
  dueDate: string;
  status: string;
  isRecurring: boolean;
  description: string;
  isOverdue: boolean;
  lastPaymentDate: string | null;
  year: number;
}

/**
 * Fee summary for a child
 */
interface ChildFeeSummary {
  childId: string;
  childName: string;
  schoolName: string | null;
  totalFees: number;
  totalPaid: number;
  totalPending: number;
  totalWaived: number;
  fees: StudentFeeInfo[];
  overdueCount: number;
  overdueAmount: number;
}

/**
 * Response type
 */
interface FeesResponse {
  children: ChildFeeSummary[];
  summary: {
    totalFees: number;
    totalPaid: number;
    totalPending: number;
    totalWaived: number;
    totalOverdue: number;
  };
}

export const GET = createSafeHandler<FeesResponse>(async (req) => {
  // Authenticate parent
  const authResult = await requireAuth(['parent']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId, user } = authResult;

  logger.info("Fetching fees for parent's children", { route: "/api/parent/fees", userId });

  // Get parent record for this user
  const parentRecords = await db.query.parents.findMany({
    where: eq(parents.userId, userId),
    columns: { id: true },
  });

  if (parentRecords.length === 0) {
    logger.warn("No parent record found for user", { userId });
    return {
      success: true,
      data: {
        children: [],
        summary: {
          totalFees: 0,
          totalPaid: 0,
          totalPending: 0,
          totalWaived: 0,
          totalOverdue: 0,
        },
      },
    };
  }

  const parentId = parentRecords[0].id;

  // Get all parent-student relationships
  const relationships = await db.query.parentToStudent.findMany({
    where: eq(parentToStudent.parentId, parentId),
  });

  if (relationships.length === 0) {
    logger.info("No children linked to parent", { parentId });
    return {
      success: true,
      data: {
        children: [],
        summary: {
          totalFees: 0,
          totalPaid: 0,
          totalPending: 0,
          totalWaived: 0,
          totalOverdue: 0,
        },
      },
    };
  }

  const studentIds = relationships.map((r) => r.studentId);

  // Get user data for all linked students
  const linkedChildren = await db.query.users.findMany({
    where: and(
      eq(users.type, "student"),
      inArray(users.id, studentIds)
    ),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
      schoolId: true,
    },
  });

  if (linkedChildren.length === 0) {
    return {
      success: true,
      data: {
        children: [],
        summary: {
          totalFees: 0,
          totalPaid: 0,
          totalPending: 0,
          totalWaived: 0,
          totalOverdue: 0,
        },
      },
    };
  }

  // Get school data for all children
  const schoolIds = linkedChildren.map((c) => c.schoolId).filter(Boolean) as string[];
  const schoolsData = schoolIds.length > 0
    ? await db.query.schools.findMany({
        where: inArray(schools.id, schoolIds),
        columns: { id: true, name: true },
      })
    : [];

  const schoolMap = new Map(schoolsData.map((s) => [s.id, s.name]));

  // Get all fees for all linked children
  const allFees = studentIds.length > 0
    ? await db.query.studentFees.findMany({
        where: inArray(studentFees.studentId, studentIds),
        orderBy: [desc(studentFees.dueDate)],
      })
    : [];

  // Group fees by child
  const feesByChild = new Map<string, typeof allFees>();
  for (const fee of allFees) {
    if (!feesByChild.has(fee.studentId)) {
      feesByChild.set(fee.studentId, []);
    }
    feesByChild.get(fee.studentId)!.push(fee);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build response for each child
  const childrenFeeSummaries: ChildFeeSummary[] = linkedChildren.map((child) => {
    const childFees = feesByChild.get(child.id) || [];
    const childName = child.name || `${child.firstName} ${child.lastName || ""}`.trim();
    const schoolName = child.schoolId ? schoolMap.get(child.schoolId) || null : null;

    let totalFees = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalWaived = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    const feeInfo: StudentFeeInfo[] = childFees.map((fee) => {
      const amount = fee.amount || 0;
      const paid = fee.amountPaid || 0;
      const waived = fee.amountWaived || 0;
      const pending = fee.amountPending || (amount - paid - waived);
      const totalAmount = fee.totalAmount || amount;

      const dueDate = new Date(fee.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const isOverdue = fee.status !== "paid" && fee.status !== "waived" && dueDate < today;

      totalFees += totalAmount;
      totalPaid += paid;
      totalWaived += waived;
      totalPending += pending;

      if (isOverdue) {
        overdueCount++;
        overdueAmount += pending;
      }

      return {
        id: fee.id,
        studentId: fee.studentId,
        studentName: childName,
        feeType: fee.feeType,
        amount,
        totalAmount,
        amountPaid: paid,
        amountPending: pending,
        amountWaived: waived,
        currency: fee.currency,
        frequency: fee.frequency,
        dueDate: fee.dueDate,
        status: fee.status,
        isRecurring: fee.isRecurring || false,
        description: fee.description,
        isOverdue,
        lastPaymentDate: fee.lastPaymentDate || null,
        year: fee.year,
      };
    });

    return {
      childId: child.id,
      childName,
      schoolName,
      totalFees,
      totalPaid,
      totalPending,
      totalWaived,
      fees: feeInfo,
      overdueCount,
      overdueAmount,
    };
  });

  // Calculate overall summary
  const summary = {
    totalFees: childrenFeeSummaries.reduce((sum, c) => sum + c.totalFees, 0),
    totalPaid: childrenFeeSummaries.reduce((sum, c) => sum + c.totalPaid, 0),
    totalPending: childrenFeeSummaries.reduce((sum, c) => sum + c.totalPending, 0),
    totalWaived: childrenFeeSummaries.reduce((sum, c) => sum + c.totalWaived, 0),
    totalOverdue: childrenFeeSummaries.reduce((sum, c) => sum + c.overdueAmount, 0),
  };

  logger.info("Successfully fetched fees for parent's children", {
    route: "/api/parent/fees",
    userId,
    childrenCount: childrenFeeSummaries.length,
    summary,
  });

  return {
    success: true,
    data: {
      children: childrenFeeSummaries,
      summary,
    },
  };
});
