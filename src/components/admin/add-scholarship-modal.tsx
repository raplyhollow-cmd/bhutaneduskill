"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createScholarship } from "@/app/admin/content/actions";

interface AddScholarshipModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddScholarshipModal({ open, onClose, onSuccess }: AddScholarshipModalProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Map form data to match createScholarship function expectations
      const code = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
      const payload = {
        name,
        code,
        type: type as "merit" | "need_based" | "sports" | "arts" | "government" | "private",
        provider,
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

      await createScholarship(payload);

      onSuccess();
      onClose();

      // Reset form
      setName("");
      setProvider("");
      setType("merit");
      setScholarshipType("partial");
      setAmount("");
      setCoveragePercentage("");
      setEligibility("");
      setApplicationOpenDate("");
      setApplicationCloseDate("");
      setAcademicYear("");
    } catch (error) {
      console.error("[ADD SCHOLARSHIP] Error:", error);
      alert(error instanceof Error ? error.message : "Failed to create scholarship. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Scholarship</h2>
          <p className="text-sm text-gray-600 mt-1">Add a scholarship to the database</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Scholarship Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Desi Scholarship"
                required
              />
            </div>

            <div>
              <Label htmlFor="provider">Provider *</Label>
              <Input
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g., Royal Government of Bhutan"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Scholarship Category *</Label>
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
              <Label htmlFor="scholarshipType">Coverage Type *</Label>
              <Select value={scholarshipType} onValueChange={(value: any) => setScholarshipType(value)}>
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
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., Nu. 100,000 or Varies"
              />
            </div>

            <div>
              <Label htmlFor="coveragePercentage">Coverage Percentage (%)</Label>
              <Input
                id="coveragePercentage"
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
            <Label htmlFor="eligibility">Eligibility Criteria</Label>
            <Textarea
              id="eligibility"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              placeholder="Describe the eligibility requirements..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="applicationOpenDate">Application Open Date</Label>
              <Input
                id="applicationOpenDate"
                type="date"
                value={applicationOpenDate}
                onChange={(e) => setApplicationOpenDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="applicationCloseDate">Application Close Date</Label>
              <Input
                id="applicationCloseDate"
                type="date"
                value={applicationCloseDate}
                onChange={(e) => setApplicationCloseDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="academicYear">Academic Year</Label>
            <Input
              id="academicYear"
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
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            >
              {isLoading ? "Creating..." : "Create Scholarship"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
