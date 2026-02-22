/**
 * SCHOOL ADMIN - FEE GENERATOR
 *
 * Allows school admins to generate annual/termly fee invoices
 * for all students in their school.
 *
 * This is a simplified version of the platform admin fee generator,
 * restricted to the school admin's own school.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Users,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeeBreakdownItem {
  feeType: string;
  amount: number;
  description: string;
}

interface SchoolData {
  id: string;
  name: string;
  type: string;
  schoolType: string;
  currentSessionYear?: string;
  feeGenerationDate?: string;
  feeGenerationStatus?: string;
}

interface FeeStatusData {
  students: {
    active: number;
  };
  fees: {
    totalGenerated: number;
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
    paymentRate: number;
  };
  session?: {
    year?: string;
    status?: string;
    generationDate?: string;
  };
}

const GOVERNMENT_FEE_TEMPLATE: FeeBreakdownItem[] = [
  { feeType: "sdf", amount: 300, description: "School Development Fund" },
  { feeType: "rimdro", amount: 200, description: "Annual Prayer/Blessing Fee" },
  { feeType: "diary", amount: 100, description: "School Diary & ID Card" },
  { feeType: "sports", amount: 150, description: "Sports Equipment Fee" },
];

const PRIVATE_FEE_TEMPLATE: FeeBreakdownItem[] = [
  { feeType: "tuition", amount: 25000, description: "Termly Tuition Fee" },
  { feeType: "lab", amount: 2000, description: "Laboratory Fee" },
  { feeType: "library", amount: 1000, description: "Library Fee" },
  { feeType: "sports", amount: 1500, description: "Sports Fee" },
];

const FEE_TYPE_OPTIONS = [
  { value: "sdf", label: "SDF" },
  { value: "rimdro", label: "Rimdro" },
  { value: "diary", label: "Diary" },
  { value: "sports", label: "Sports" },
  { value: "stationery", label: "Stationery" },
  { value: "tuition", label: "Tuition" },
  { value: "lab", label: "Lab" },
  { value: "library", label: "Library" },
  { value: "transport", label: "Transport" },
  { value: "uniform", label: "Uniform" },
  { value: "other", label: "Other" },
];

export default function SchoolAdminFeeGeneratorPage() {
  const router = useRouter();
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [feeStatus, setFeeStatus] = useState<FeeStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [sessionYear, setSessionYear] = useState(new Date().getFullYear().toString());
  const [term, setTerm] = useState<"annual" | "term1" | "term2">("annual");
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdownItem[]>([]);
  const [customDueDate, setCustomDueDate] = useState("");
  const [notifyParents, setNotifyParents] = useState(true);

  // Result state
  const [generationResult, setGenerationResult] = useState<{
    success: boolean;
    message: string;
    generated: number;
    skipped: number;
    totalFees: number;
    totalAmount: number;
  } | null>(null);

  useEffect(() => {
    fetchSchoolData();
  }, []);

  const fetchSchoolData = async () => {
    setLoading(true);
    try {
      // Get school ID from user profile
      const profileRes = await fetch("/api/user/profile");
      if (!profileRes.ok) throw new Error("Failed to fetch user profile");

      const profileData = await profileRes.json();
      const schoolId = profileData.schoolId;

      if (!schoolId) {
        throw new Error("No school associated with your account");
      }

      // Fetch fee status using school-admin API
      const response = await fetch(`/api/school-admin/fees/generate`);
      if (!response.ok) throw new Error("Failed to fetch school data");

      const data = await response.json();
      setSchool(data.school);
      setFeeStatus(data);

      // Set default session year if already set
      if (data.session?.year) {
        setSessionYear(data.session.year);
      }

      // Load appropriate template based on school type
      const isGovernment = data.school?.type === "public" || data.school?.schoolType === "public";
      setFeeBreakdown(isGovernment ? GOVERNMENT_FEE_TEMPLATE : PRIVATE_FEE_TEMPLATE);
    } catch (error) {
      console.error("Error fetching school data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addFeeItem = () => {
    setFeeBreakdown([...feeBreakdown, {
      feeType: "other",
      amount: 0,
      description: "New Fee Item"
    }]);
  };

  const removeFeeItem = (index: number) => {
    setFeeBreakdown(feeBreakdown.filter((_, i) => i !== index));
  };

  const updateFeeItem = (index: number, field: keyof FeeBreakdownItem, value: string | number) => {
    const updated = [...feeBreakdown];
    updated[index] = { ...updated[index], [field]: value };
    setFeeBreakdown(updated);
  };

  const handleGenerateFees = async () => {
    setGenerating(true);
    setGenerationResult(null);

    try {
      const response = await fetch(`/api/school-admin/fees/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionYear,
          term,
          feeBreakdown,
          dueDate: customDueDate || undefined,
          notifyParents,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate fees");
      }

      const result = await response.json();
      setGenerationResult(result);

      // Refresh fee status
      await fetchSchoolData();
    } catch (error) {
      setGenerationResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate fees",
        generated: 0,
        skipped: 0,
        totalFees: 0,
        totalAmount: 0,
      });
    } finally {
      setGenerating(false);
    }
  };

  const totalAmount = feeBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const isGovernment = school?.type === "public" || school?.schoolType === "public";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Fees
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fee Generator</h1>
            <p className="text-gray-600 mt-1">Generate annual/termly fee invoices for all students</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={isGovernment ? "secondary" : "default"}
              className={isGovernment ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}
            >
              {isGovernment ? "Government School" : "Private School"}
            </Badge>
            {school?.feeGenerationStatus === "generated" && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Fees Generated
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Session Configuration</CardTitle>
              <CardDescription>
                Configure the academic session and fee structure for {school?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* School Type Info */}
              <div className={cn(
                "p-4 rounded-lg border",
                isGovernment ? "bg-blue-50 border-blue-200" : "bg-purple-50 border-purple-200"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className={cn(
                    "w-5 h-5",
                    isGovernment ? "text-blue-600" : "text-purple-600"
                  )} />
                  <span className="font-semibold">
                    {isGovernment ? "Government School" : "Private School"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {isGovernment
                    ? "Annual billing: Single invoice generated in February (SDF + miscellaneous fees)"
                    : "Termly billing: Two invoices per year (February + July)"
                  }
                </p>
              </div>

              {/* Session Year */}
              <div>
                <Label htmlFor="sessionYear">Academic Session Year</Label>
                <Input
                  id="sessionYear"
                  type="text"
                  value={sessionYear}
                  onChange={(e) => setSessionYear(e.target.value)}
                  placeholder="2026"
                  className="mt-2"
                />
              </div>

              {/* Term Selection (Private Schools Only) */}
              {!isGovernment && (
                <div>
                  <Label>Term</Label>
                  <div className="flex gap-2 mt-2">
                    {[
                      { value: "term1", label: "Term 1 (February)" },
                      { value: "term2", label: "Term 2 (July)" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTerm(t.value as typeof term)}
                        className={cn(
                          "flex-1 p-3 rounded-lg border-2 text-center transition-all",
                          term === t.value
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Due Date */}
              <div>
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={customDueDate}
                  onChange={(e) => setCustomDueDate(e.target.value)}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Fee Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Breakdown</CardTitle>
              <CardDescription>
                Configure the fee items for this session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {feeBreakdown.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    {/* Fee Type */}
                    <div>
                      <Label className="text-xs">Fee Type</Label>
                      <select
                        value={item.feeType}
                        onChange={(e) => updateFeeItem(index, "feeType", e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md text-sm"
                      >
                        {FEE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <Label className="text-xs">Amount (Nu.)</Label>
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateFeeItem(index, "amount", parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateFeeItem(index, "description", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFeeItem(index)}
                    className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add Fee Button */}
              <Button
                type="button"
                variant="outline"
                onClick={addFeeItem}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Fee Item
              </Button>

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold">Total per Student:</span>
                <span className="text-2xl font-bold">Nu. {totalAmount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleGenerateFees}
                disabled={generating || feeBreakdown.length === 0}
                className="w-full"
                size="lg"
                style={{
                  background: isGovernment
                    ? "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)"
                    : "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
                }}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Generate Invoices for {feeStatus?.students.active || 0} Students
                  </>
                )}
              </Button>

              {/* Result */}
              {generationResult && (
                <div className={cn(
                  "mt-4 p-4 rounded-lg",
                  generationResult.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {generationResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-semibold">{generationResult.message}</span>
                  </div>
                  {generationResult.success && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Fees generated for: {generationResult.generated} students</p>
                      {generationResult.skipped > 0 && <p>• Skipped: {generationResult.skipped} students</p>}
                      <p>• Total fee records: {generationResult.totalFees}</p>
                      <p>• Expected collection: Nu. {generationResult.totalAmount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Session Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {feeStatus?.session.year ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Session Year</span>
                    <Badge>{feeStatus.session.year}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <Badge
                      variant={feeStatus.session.status === "generated" ? "secondary" : "default"}
                      className={feeStatus.session.status === "generated" ? "bg-green-100 text-green-700" : ""}
                    >
                      {feeStatus.session.status}
                    </Badge>
                  </div>
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="font-semibold">Nu. {feeStatus.fees.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Collected</span>
                      <span className="font-semibold text-green-600">Nu. {feeStatus.fees.totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-semibold text-orange-600">Nu. {feeStatus.fees.totalPending.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Payment Rate</span>
                      <span className="font-semibold">{feeStatus.fees.paymentRate}%</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No fees generated yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Student Count */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-center py-4">
                {feeStatus?.students.active || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
