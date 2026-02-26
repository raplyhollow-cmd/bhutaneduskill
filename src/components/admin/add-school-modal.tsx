"use client";

import { logger } from "@/lib/logger";
import { useToast } from "@/components/ui/toaster";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { portal } from "@/styles/design-tokens";

interface AddSchoolModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSchoolModal({ open, onClose, onSuccess }: AddSchoolModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [schoolType, setSchoolType] = useState("HSS");
  const [level, setLevel] = useState("middle");
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("pending_payment");
  const [subscriptionTier, setSubscriptionTier] = useState("basic");
  const [trialDays, setTrialDays] = useState(30);

  // Auto-generate school code
  // Format: ABC-DIST-YYYY (Abbreviation-District-Year)
  // - Abbreviation: First 3 chars of school name (uppercase)
  // - District: First 4 chars of district name (uppercase)
  // - Year: Current year (4 digits)
  // Example: TIM-THIM-2024 for Thimphu, PAR-PARO-2024 for Paro
  const generateSchoolCode = () => {
    const abbrev = name.substring(0, 3).toUpperCase();
    const districtCode = district.substring(0, 4).toUpperCase();
    const year = new Date().getFullYear();
    return `${abbrev}-${districtCode}-${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        name,
        code: generateSchoolCode(),
        schoolType,
        level,
        address,
        contactEmail,
        contactPhone,
        subscriptionStatus,
        subscriptionTier,
        trialDays,
      };
      logger.debug("[ADD SCHOOL] Sending payload:", payload);

      const response = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      logger.debug("[ADD SCHOOL] Response status:", response.status);
      const responseData = await response.json();
      logger.debug("[ADD SCHOOL] Response data:", responseData);

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setName("");
        setDistrict("");
        setAddress("");
        setContactEmail("");
        setContactPhone("");
        setSubscriptionStatus("pending_payment");
        setSubscriptionTier("basic");
        setTrialDays(30);
        toast({
          title: "School created",
          description: `"${name}" has been added successfully.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Failed to create school",
          description: responseData.error || "Unknown error",
          variant: "error",
        });
      }
    } catch (error) {
      logger.error("[ADD SCHOOL] Error:", error);
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New School</h2>
          <p className="text-sm text-gray-600 mt-1">Register a new school on the platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name">School Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Royal High School"
              required
            />
          </div>

          <div>
            <Label htmlFor="district">District *</Label>
            <Select value={district} onValueChange={setDistrict} required>
              <SelectTrigger>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {["Thimphu", "Paro", "Punakha", "Wangdue", "Trongsa", "Bumthang", "Trashigang", "Mongar", "Samtse", "Sarpang"].map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schoolType">School Type *</Label>
              <Select value={schoolType} onValueChange={setSchoolType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HSS">Higher Secondary</SelectItem>
                  <SelectItem value="MSS">Middle Secondary</SelectItem>
                  <SelectItem value="LSS">Lower Secondary</SelectItem>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="level">Level *</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary (PP-6)</SelectItem>
                  <SelectItem value="middle">Middle (7-10)</SelectItem>
                  <SelectItem value="secondary">Secondary (11-12)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full school address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="admin@school.bt"
                required
              />
            </div>

            <div>
              <Label htmlFor="contactPhone">Contact Phone *</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+975 17 123 456"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="subscriptionStatus">Payment Status *</Label>
            <Select value={subscriptionStatus} onValueChange={(value) => {
              setSubscriptionStatus(value);
              // Auto-set tier based on status
              if (value === "pending_payment") setSubscriptionTier("basic");
              else if (value === "active") setSubscriptionTier("standard");
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_payment">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    Pending Payment
                  </span>
                </SelectItem>
                <SelectItem value="trial">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Free Trial
                  </span>
                </SelectItem>
                <SelectItem value="active">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Active / Paid
                  </span>
                </SelectItem>
                <SelectItem value="suspended">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Suspended
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(subscriptionStatus === "active" || subscriptionStatus === "trial") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subscriptionTier">
                  {subscriptionStatus === "trial" ? "Trial Tier" : "Subscription Tier"}
                </Label>
                <Select value={subscriptionTier} onValueChange={setSubscriptionTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (PP-6)</SelectItem>
                    <SelectItem value="standard">Standard (PP-10)</SelectItem>
                    <SelectItem value="premium">Premium (PP-12)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {subscriptionStatus === "trial" && (
                <div>
                  <Label htmlFor="trialDays">Trial Duration</Label>
                  <Select value={trialDays.toString()} onValueChange={(v) => setTrialDays(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Renewal Date Preview */}
          {(subscriptionStatus === "active" || subscriptionStatus === "trial") && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {subscriptionStatus === "trial" ? "Trial Expires:" : "Subscription Expires:"}
              </p>
              <p className="text-lg font-semibold text-blue-700">
                {(() => {
                  const now = new Date();
                  const currentYear = now.getFullYear();
                  const dec31 = new Date(currentYear, 11, 31); // Dec 31

                  if (subscriptionStatus === "trial") {
                    const trialExpiry = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
                    const expiryDate = trialExpiry > dec31 ? trialExpiry : dec31;
                    return expiryDate.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                  } else {
                    // Active subscriptions expire on Dec 31
                    const expiryDate = now > dec31
                      ? new Date(currentYear + 1, 11, 31)
                      : dec31;
                    return expiryDate.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                  }
                })()}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {subscriptionStatus === "trial"
                  ? `After trial, subscription must be renewed by Dec 31`
                  : "All school subscriptions expire on December 31st annually"
                }
              </p>
            </div>
          )}

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Generated School Code:</strong> {name && district ? generateSchoolCode() : "N/A"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Share this code with school administrators for signup
            </p>
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
              disabled={isLoading || !name || !district || !contactEmail || !contactPhone}
              className="flex-1"
              style={{ background: portal.admin.gradient }}
            >
              {isLoading ? "Creating..." : "Create School"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
