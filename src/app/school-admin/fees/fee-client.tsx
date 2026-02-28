"use client";

import { logger } from "@/lib/logger";
/**
 * FEE MANAGEMENT - CLIENT COMPONENT
 *
 * Client-side component with interactivity for fee management.
 */


import { useState } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { FeeManager, type FeeStructure, type StudentFee, type Payment } from "@/components/fees";
import { DollarSign } from "lucide-react";
import { fetchFeeData } from "../_actions";

interface FeeData {
  structures: unknown[];
  studentFees: unknown[];
  payments: unknown[];
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
