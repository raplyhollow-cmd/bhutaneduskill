"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, CreditCard, Building2 } from "lucide-react";

export interface SchoolDetailForModal {
  id: string;
  name: string;
  code: string;
  schoolType: string;
  level: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  maxStudents?: number;
}

interface ApproveSchoolModalProps {
  open: boolean;
  onClose: () => void;
  onApprove: (tier: string) => void;
  school: SchoolDetailForModal | null;
}

const TIERS = {
  basic: {
    name: "Small",
    students: 100,
    description: "For schools starting out",
  },
  standard: {
    name: "Medium",
    students: 500,
    description: "For growing schools",
  },
  premium: {
    name: "Large",
    students: 1000,
    description: "For established institutions",
  },
};

export function ApproveSchoolModal({ open, onClose, onApprove, school }: ApproveSchoolModalProps) {
  const [selectedTier, setSelectedTier] = useState("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);

  const handleApprove = async () => {
    if (!paymentVerified) {
      alert("Please verify payment before approving the school.");
      return;
    }

    setIsLoading(true);
    await onApprove(selectedTier);
    setIsLoading(false);
    setPaymentVerified(false);
  };

  const handleClose = () => {
    setPaymentVerified(false);
    setSelectedTier("standard");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Approve School
          </DialogTitle>
          <DialogDescription>
            Review and approve {school?.name} for platform access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* School Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{school?.name}</h3>
                <p className="text-sm text-gray-600">Code: {school?.code}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>{school?.schoolType}</span>
                  <span>{school?.level}</span>
                  <span>Max: {school?.maxStudents || 1000} students</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Plan Selection */}
          <div>
            <Label className="text-base font-medium">Select Capacity Plan</Label>
            <p className="text-sm text-gray-500 mt-1">All plans include full platform access. Pricing based on student capacity.</p>
            <RadioGroup value={selectedTier} onValueChange={setSelectedTier} className="mt-3">
              {Object.entries(TIERS).map(([key, tier]) => (
                <div
                  key={key}
                  className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTier === key
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedTier(key)}
                >
                  <RadioGroupItem value={key} id={key} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor={key} className="font-semibold text-gray-900 cursor-pointer text-base">
                        {tier.name}
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">{tier.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="px-3 py-1 bg-gray-100 rounded-full">
                        <strong>{tier.students}</strong> students
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">Full platform access</span>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Payment Verification */}
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900">Payment Verification</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Confirm that payment has been received for this school before approving.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="paymentVerified"
                    checked={paymentVerified}
                    onChange={(e) => setPaymentVerified(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="paymentVerified" className="text-sm text-yellow-900 cursor-pointer">
                    I verify that payment has been received
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info for Invoicing */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Billing Information</h4>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">Email:</span> {school?.contactEmail}</p>
              <p><span className="text-gray-500">Phone:</span> {school?.contactPhone}</p>
              <p><span className="text-gray-500">Address:</span> {school?.address}, {school?.city}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isLoading || !paymentVerified}
            style={{ background: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)" }}
            className="text-white"
          >
            {isLoading ? "Approving..." : "Approve School"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
