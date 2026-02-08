/**
 * SCHOOL ADMIN - FEE MANAGEMENT
 * Updated with new FeeManager component
 */
"use client";

import { PortalHeader } from "@/components/shared/portal-sidebar";
import { FeeManager } from "@/components/fees";
import { DollarSign } from "lucide-react";

// Mock data
const mockStructures = [
  {
    id: "fs1",
    name: "Class 10 Tuition",
    category: "tuition" as const,
    amount: 15000,
    frequency: "quarterly" as const,
    dueDay: 31,
    classId: "class10",
    applicableTo: "class" as const,
    isActive: true,
  },
  {
    id: "fs2",
    name: "Library Fee",
    category: "library" as const,
    amount: 500,
    frequency: "yearly" as const,
    dueDay: 15,
    classId: "all",
    applicableTo: "all" as const,
    isActive: true,
  },
];

const mockStudentFees = [
  {
    id: "sf1",
    studentId: "s1",
    studentName: "Tashi Dorji",
    studentRoll: "01",
    classId: "class10a",
    className: "Class 10 A",
    structureId: "fs1",
    structureName: "Class 10 Tuition",
    amount: 15000,
    paidAmount: 15000,
    waivedAmount: 0,
    dueDate: "2025-01-31",
    status: "paid" as const,
  },
  {
    id: "sf2",
    studentId: "s2",
    studentName: "Karma Wangmo",
    studentRoll: "02",
    classId: "class10b",
    className: "Class 10 B",
    structureId: "fs1",
    structureName: "Class 10 Tuition",
    amount: 15000,
    paidAmount: 10000,
    waivedAmount: 0,
    dueDate: "2025-01-31",
    status: "partial" as const,
  },
  {
    id: "sf3",
    studentId: "s3",
    studentName: "Pema Lhamo",
    studentRoll: "03",
    classId: "class11a",
    className: "Class 11 A",
    structureId: "fs1",
    structureName: "Class 10 Tuition",
    amount: 15000,
    paidAmount: 0,
    waivedAmount: 0,
    dueDate: "2025-01-31",
    status: "overdue" as const,
  },
];

const mockPayments = [
  {
    id: "p1",
    studentFeeId: "sf1",
    studentName: "Tashi Dorji",
    amount: 15000,
    method: "bank_transfer" as const,
    transactionId: "TXN123456",
    date: "2025-01-25",
    receiptNumber: "REC-2025-001234",
    collectedBy: "Admin",
  },
  {
    id: "p2",
    studentFeeId: "sf2",
    studentName: "Karma Wangmo",
    amount: 10000,
    method: "cash" as const,
    date: "2025-01-28",
    receiptNumber: "REC-2025-001235",
    collectedBy: "Admin",
  },
];

const mockSummary = {
  totalExpected: 45000,
  totalCollected: 25000,
  totalPending: 20000,
  totalWaived: 0,
  collectionRate: 56,
  defaulters: 1,
};

export default function SchoolAdminFeesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="school-admin" userName="Admin" title="Fee Management" />
      <div className="lg:ml-64 p-6">
        <FeeManager
          structures={mockStructures}
          studentFees={mockStudentFees}
          payments={mockPayments}
          summary={mockSummary}
          onPrintReceipt={(paymentId) => console.log("Print receipt:", paymentId)}
          onExport={(type) => console.log("Export:", type)}
        />
      </div>
    </div>
  );
}
