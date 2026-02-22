/**
 * FEE PAYMENT MODAL
 *
 * A modal for parents to pay their annual session fees.
 * Uses placeholder QR code + manual receipt upload (since we don't have mBOB API yet).
 *
 * Flow:
 * 1. Parent sees fee breakdown
 * 2. Parent sees QR code placeholder + bank details
 * 3. Parent pays via mBOB/bank, takes screenshot
 * 4. Parent uploads receipt
 * 5. School admin verifies and approves
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Copy,
  QrCode,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeeItem {
  feeType: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface FeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  childId: string;
  fees: FeeItem[];
  totalAmount: number;
  sessionYear: string;
  onSuccess?: () => void;
}

const FEE_TYPE_LABELS: Record<string, string> = {
  sdf: "School Development Fund",
  rimdro: "Annual Prayer/Blessing",
  diary: "School Diary & ID Card",
  sports: "Sports Equipment",
  stationery: "Stationery",
  tuition: "Tuition Fee",
  lab: "Laboratory Fee",
  library: "Library Fee",
  transport: "Transport Fee",
  uniform: "Uniform Fee",
  other: "Other Fee",
};

export function FeePaymentModal({
  isOpen,
  onClose,
  childName,
  childId,
  fees,
  totalAmount,
  sessionYear,
  onSuccess,
}: FeePaymentModalProps) {
  const [step, setStep] = useState<"summary" | "payment" | "upload" | "success">("summary");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState("");

  const pendingFees = fees.filter(f => f.status !== "paid" && f.status !== "waived");

  const handlePayNow = () => {
    setStep("payment");
  };

  const handleUploadReceipt = () => {
    setStep("upload");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadResult({ success: false, message: "Please select a receipt image" });
      return;
    }

    if (!transactionId.trim()) {
      setUploadResult({ success: false, message: "Please enter transaction ID" });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("receipt", selectedFile);
      formData.append("transactionId", transactionId);
      formData.append("childId", childId);
      formData.append("amount", totalAmount.toString());
      formData.append("sessionYear", sessionYear);

      const response = await fetch("/api/parent/fees/upload-receipt", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult({ success: true, message: "Receipt uploaded successfully! Waiting for school verification." });
        setStep("success");
        onSuccess?.();
      } else {
        setUploadResult({ success: false, message: result.error || "Failed to upload receipt" });
      }
    } catch (error) {
      setUploadResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setStep("summary");
    setSelectedFile(null);
    setTransactionId("");
    setUploadResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            {step === "summary" && "Fee Summary"}
            {step === "payment" && "Payment Instructions"}
            {step === "upload" && "Upload Receipt"}
            {step === "success" && "Receipt Submitted"}
          </DialogTitle>
          <DialogDescription>
            {childName} - {sessionYear} Session
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Fee Summary */}
        {step === "summary" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {pendingFees.map((fee) => (
                <div key={fee.feeType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{FEE_TYPE_LABELS[fee.feeType] || fee.description}</p>
                    <p className="text-xs text-gray-500">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                  </div>
                  <p className="font-semibold">Nu. {fee.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
              <span className="font-semibold">Total Due</span>
              <span className="text-xl font-bold">Nu. {totalAmount.toLocaleString()}</span>
            </div>

            <Button onClick={handlePayNow} className="w-full" size="lg">
              Pay Now
            </Button>
          </div>
        )}

        {/* Step 2: Payment Instructions */}
        {step === "payment" && (
          <div className="space-y-4">
            {/* Placeholder QR Code */}
            <div className="flex justify-center">
              <div className="relative">
                {/* QR Code Placeholder */}
                <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-xl flex flex-col items-center justify-center p-4">
                  <QrCode className="w-24 h-24 text-gray-800 mb-2" />
                  <p className="text-xs text-center text-gray-600">Scan to pay via mBOB</p>
                </div>

                {/* Animated scan line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/50 animate-pulse" style={{ animation: "scan 2s linear infinite" }} />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-medium text-center">Scan QR code with mBOB app</p>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-semibold text-blue-900 mb-1">Bank Transfer Details</p>
                <div className="space-y-1 text-blue-800">
                  <div className="flex justify-between">
                    <span>Bank:</span>
                    <span className="font-medium">Bank of Bhutan</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Name:</span>
                    <span className="font-medium">{"School's Account"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account No:</span>
                    <span className="font-medium">{"XXXX XXXX XXXX"}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                After payment, take a screenshot and upload receipt for verification
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("summary")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleUploadReceipt} className="flex-1">
                I've Paid
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Upload Receipt */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="font-medium">Upload Payment Receipt</p>
              <p className="text-sm text-gray-500">Screenshot or photo of your payment confirmation</p>
            </div>

            <div>
              <Label htmlFor="receipt">Receipt Image</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-2"
              />
              {selectedFile && (
                <p className="text-xs text-gray-500 mt-1">Selected: {selectedFile.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="transactionId">Transaction ID / Reference Number</Label>
              <Input
                id="transactionId"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g., MB123456789"
                className="mt-2"
              />
            </div>

            {uploadResult && (
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg",
                uploadResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}>
                {uploadResult.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{uploadResult.message}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("payment")} className="flex-1" disabled={uploading}>
                Back
              </Button>
              <Button onClick={handleUpload} className="flex-1" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Submit Receipt"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-700">Receipt Submitted!</h3>
              <p className="text-sm text-gray-600 mt-1">
                Your payment receipt has been uploaded. The school will verify it within 1-2 business days.
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <p className="font-medium">What happens next?</p>
              <ul className="text-left mt-2 space-y-1 text-xs">
                <li>• School admin reviews your receipt</li>
                <li>• You'll receive SMS confirmation when verified</li>
                <li>• Your fee status will update to "Paid"</li>
              </ul>
            </div>

            <Button onClick={resetModal} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Add scan animation keyframes
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes scan {
      0% { top: 0; }
      50% { top: calc(100% - 4px); }
      100% { top: 0; }
    }
  `;
  document.head.appendChild(style);
}
