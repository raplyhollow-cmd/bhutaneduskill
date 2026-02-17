"use client";

/**
 * Receipt Generator Component
 *
 * Generates printable fee receipts.
 */


import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface ReceiptGeneratorProps {
  payment?: {
    receiptNumber: string;
    amount: number;
    collectedAt: number;
    studentName?: string;
    paymentMethod?: string;
  };
  onClose?: () => void;
}

export function ReceiptGenerator({ payment, onClose }: ReceiptGeneratorProps) {
  const handlePrint = () => {
    window.print();
  };

  if (!payment) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div>
            <h2 className="text-xl font-bold">Fee Receipt</h2>
            <p className="text-sm text-gray-500">Bhutan Edu Skill</p>
          </div>

          <div className="border-t border-b py-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Receipt No:</span>
              <span className="font-medium">{payment.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid:</span>
              <span className="font-bold text-green-600">Nu. {payment.amount?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span className="font-medium">
                {payment.collectedAt ? new Date(payment.collectedAt * 1000).toLocaleDateString() : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method:</span>
              <span className="font-medium capitalize">{payment.paymentMethod || "-"}</span>
            </div>
            {payment.studentName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Student:</span>
                <span className="font-medium">{payment.studentName}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={handlePrint} size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
