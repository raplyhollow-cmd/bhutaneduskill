"use client";

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateScholarship } from "@/app/admin/content/actions";
import { portal } from "@/styles/design-tokens";

interface Scholarship {
  id: string;
  name: string;
  provider: string;
  type: string;
  scholarshipType?: "full" | "partial";
  amount?: string;
  coveragePercentage?: number | string;
  eligibility?: string;
  applicationOpenDate?: Date | string;
  applicationCloseDate?: Date | string;
  academicYear?: string;
}

interface EditScholarshipModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scholarship: Scholarship | null;
}

export function EditScholarshipModal({ open, onClose, onSuccess, scholarship }: EditScholarshipModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [type, setType] = useState("merit");
  const [scholarshipType, setScholarshipType] = useState<"full" | "partial">("partial");
  const [amount, setAmount] = useState("");
  const [coveragePercentage, setCoveragePercentage] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [applicationOpenDate, setApplicationOpenDate] = useState("");
  const [applicationCloseDate, setApplicationCloseDate] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  // Populate form when scholarship changes
  useEffect(() => {
    if (scholarship) {
      setName(scholarship.name || "");
      setProvider(scholarship.provider || "");
      setType(scholarship.type || "merit");
      setScholarshipType(scholarship.scholarshipType || "partial");
      setAmount(scholarship.amount || "");
      setCoveragePercentage(scholarship.coveragePercentage ? String(scholarship.coveragePercentage) : "");
      setEligibility(scholarship.eligibility || "");
      setApplicationOpenDate(
        scholarship.applicationOpenDate
          ? new Date(scholarship.applicationOpenDate).toISOString().split("T")[0]
          : ""
      );
      setApplicationCloseDate(
        scholarship.applicationCloseDate
          ? new Date(scholarship.applicationCloseDate).toISOString().split("T")[0]
          : ""
      );
      setAcademicYear(scholarship.academicYear || "");
    }
  }, [scholarship]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scholarship?.id) return;

    setIsLoading(true);

    try {
      // Map form data to match updateScholarship function expectations
      const payload = {
        name,
        provider,
        type: type as "merit" | "need_based" | "sports" | "arts" | "government" | "private",
        coversTuition: scholarshipType === "full",
        coversHostel: scholarshipType === "full",
        coversBooks: scholarshipType === "full",
        coversLiving: scholarshipType === "full",
        coveragePercentage: coveragePercentage ? parseFloat(coveragePercentage) : undefined,
        description: eligibility,
        applicationOpenDate: applicationOpenDate || undefined,
        applicationCloseDate: applicationCloseDate || undefined,
        academicYear,
      };

      await updateScholarship(scholarship.id, payload);

      onSuccess();
      onClose();
    } catch (error) {
      logger.error("[EDIT SCHOLARSHIP] Error:", error);
      alert(error instanceof Error ? error.message : "Failed to update scholarship. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!open || !scholarship) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Scholarship</h2>
          <p className="text-sm text-gray-600 mt-1">Update scholarship information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Scholarship Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Desi Scholarship"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-provider">Provider *</Label>
              <Input
                id="edit-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g., Royal Government of Bhutan"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-type">Scholarship Category *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merit">Merit-Based</SelectItem>
                  <SelectItem value="need-based">Need-Based</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="arts">Arts & Culture</SelectItem>
                  <SelectItem value="stem">STEM</SelectItem>
                  <SelectItem value="community">Community Service</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-scholarshipType">Coverage Type *</Label>
              <Select value={scholarshipType} onValueChange={(value: "full" | "partial") => setScholarshipType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Scholarship</SelectItem>
                  <SelectItem value="partial">Partial Scholarship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., Nu. 100,000 or Varies"
              />
            </div>

            <div>
              <Label htmlFor="edit-coveragePercentage">Coverage Percentage (%)</Label>
              <Input
                id="edit-coveragePercentage"
                type="number"
                min="0"
                max="100"
                step="1"
                value={coveragePercentage}
                onChange={(e) => setCoveragePercentage(e.target.value)}
                placeholder="e.g., 50"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-eligibility">Eligibility Criteria</Label>
            <Textarea
              id="edit-eligibility"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              placeholder="Describe the eligibility requirements..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-applicationOpenDate">Application Open Date</Label>
              <Input
                id="edit-applicationOpenDate"
                type="date"
                value={applicationOpenDate}
                onChange={(e) => setApplicationOpenDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit-applicationCloseDate">Application Close Date</Label>
              <Input
                id="edit-applicationCloseDate"
                type="date"
                value={applicationCloseDate}
                onChange={(e) => setApplicationCloseDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-academicYear">Academic Year</Label>
            <Input
              id="edit-academicYear"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g., 2026-2027"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name || !provider}
              className="flex-1"
              style={{ background: portal.admin.gradient }}
            >
              {isLoading ? "Updating..." : "Update Scholarship"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
