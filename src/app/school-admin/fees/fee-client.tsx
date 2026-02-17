"use client";

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
  structures: any[];
  studentFees: any[];
  payments: any[];
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
      console.error("Failed to refresh fee data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="school-admin" userName="Admin" title="Fee Management" />
      <div className="lg:ml-64 p-6">
        <FeeManager
          structures={data.structures}
          studentFees={data.studentFees}
          payments={data.payments}
          summary={data.summary}
          onPrintReceipt={(paymentId) => console.log("Print receipt:", paymentId)}
          onExport={(type) => console.log("Export:", type)}
        />
      </div>
    </div>
  );
}
