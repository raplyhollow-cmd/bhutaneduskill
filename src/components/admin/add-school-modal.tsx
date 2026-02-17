"use client";

import { logger } from "@/lib/logger";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddSchoolModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSchoolModal({ open, onClose, onSuccess }: AddSchoolModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [schoolType, setSchoolType] = useState("HSS");
  const [level, setLevel] = useState("middle");
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Auto-generate school code
  const generateSchoolCode = () => {
    const abbrev = name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 3);
    const districtCode = district.substring(0, 3).toUpperCase();
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
      } else {
        alert(responseData.error || "Failed to create school");
      }
    } catch (error) {
      logger.error("[ADD SCHOOL] Error:", error);
      alert("Network error. Please try again.");
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
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            >
              {isLoading ? "Creating..." : "Create School"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
