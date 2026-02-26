"use client";

import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { portal } from "@/styles/design-tokens";

interface School {
  id: string;
  name: string;
  code: string;
  schoolType: string;
  level: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  districtName?: string;
  isActive?: boolean;
}

interface EditSchoolModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  school: School | null;
}

export function EditSchoolModal({ open, onClose, onSuccess, school }: EditSchoolModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form fields - initialize with school data when it changes
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [district, setDistrict] = useState("");
  const [schoolType, setSchoolType] = useState("HSS");
  const [level, setLevel] = useState("middle");
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Populate form when school data changes
  useEffect(() => {
    if (school) {
      setName(school.name || "");
      setCode(school.code || "");
      setDistrict(school.districtName || "");
      setSchoolType(school.schoolType || "HSS");
      setLevel(school.level || "middle");
      setAddress(school.address || "");
      setContactEmail(school.contactEmail || "");
      setContactPhone(school.contactPhone || "");
      setIsActive(school.isActive !== undefined ? school.isActive : true);
    }
  }, [school]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;

    setIsLoading(true);

    try {
      const payload = {
        name,
        code,
        schoolType,
        level,
        address,
        contactEmail,
        contactPhone,
        isActive,
      };
      logger.debug("[EDIT SCHOOL] Sending payload:", payload);

      const response = await fetch(`/api/schools/${school.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      logger.debug("[EDIT SCHOOL] Response status:", response.status);
      const responseData = await response.json();
      logger.debug("[EDIT SCHOOL] Response data:", responseData);

      if (response.ok) {
        toast({
          title: "School updated",
          description: `${name} has been updated successfully.`,
          variant: "success",
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: "Failed to update school",
          description: responseData.error || "Please try again.",
          variant: "error",
        });
      }
    } catch (error) {
      logger.error("[EDIT SCHOOL] Error:", error);
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit School</h2>
              <p className="text-sm text-gray-600 mt-1">Update school details</p>
            </div>
            {isActive ? (
              <Badge className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            ) : (
              <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                Inactive
              </Badge>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="edit-name">School Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Royal High School"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-code">School Code *</Label>
            <Input
              id="edit-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., RHS-THI-2024"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Share this code with school administrators for signup
            </p>
          </div>

          <div>
            <Label htmlFor="edit-district">District *</Label>
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
              <Label htmlFor="edit-schoolType">School Type *</Label>
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
              <Label htmlFor="edit-level">Level *</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary (PP-6)</SelectItem>
                  <SelectItem value="middle">Middle (7-10)</SelectItem>
                  <SelectItem value="secondary">Secondary (11-12)</SelectItem>
                  <SelectItem value="higher_secondary">Higher Secondary (11-12)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-address">Address</Label>
            <Textarea
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full school address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-contactEmail">Contact Email *</Label>
              <Input
                id="edit-contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="admin@school.bt"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-contactPhone">Contact Phone *</Label>
              <Input
                id="edit-contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+975 17 123 456"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-status">Status</Label>
            <Select value={isActive ? "active" : "inactive"} onValueChange={(val) => setIsActive(val === "active")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={isLoading || !name || !code || !contactEmail || !contactPhone}
              className="flex-1"
              style={{ background: portal.admin.gradient }}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
