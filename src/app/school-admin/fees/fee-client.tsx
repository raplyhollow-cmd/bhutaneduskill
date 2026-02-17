"use client";

import { logger } from "@/lib/logger";
/**
 * FEE MANAGEMENT - CLIENT COMPONENT
 *
 * Client-side component with interactivity for fee management.
 */


import { useState } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { FeeManager } from "@/components/fees";
import { DollarSign } from "lucide-react";
import { fetchFeeData } from "../_actions";

interface FeeData {
  structures: Array<Record<string, unknown> | { id: string; name: string; description?: string; amount?: number; frequency?: string; dueDay?: number; classId?: string; applicableTo?: string; isActive?: boolean; grade?: number | null; totalAnnualAmount?: number | null; totalFees?: number | null }>;
  studentFees: Array<Record<string, unknown> | { id: string; studentId: string; studentName: string; studentRoll: string; classId: string; className: string; structureId: string; structureName: string; amount: number; paidAmount: number; waivedAmount: number; dueDate: string | null; status: "paid" | "partial" | "overdue" }>;
  payments: Array<Record<string, unknown> | { id: string; studentFeeId: string; studentName: string; amount: number; method: string; transactionId: string | null; date: string; receiptNumber: string | null; collectedBy: string | null }>;
  summary: {
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    totalWaived: number;
    collectionRate: number;
    defaulters: number;
  };
}

interface FeeClientProps {
  initialData: FeeData;
}

export function FeeClient({ initialData }: FeeClientProps) {
  const [data, setData] = useState<FeeData>(initialData);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const newData = await fetchFeeData();
      setData(newData);
    } catch (error) {
      logger.error("Failed to refresh fee data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="school-admin" userName="Admin" title="Fee Management" />
      <div className="lg:ml-64 p-6">
        <FeeManager
          structures={data.structures as any}
          studentFees={data.studentFees as any}
          payments={data.payments as any}
          summary={data.summary}
          onPrintReceipt={(paymentId) => logger.debug("Print receipt:", paymentId)}
          onExport={(type) => logger.debug("Export:", type)}
        />
      </div>
    </div>
  );
}
