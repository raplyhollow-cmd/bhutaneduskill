"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SlideInForm } from "@/components/form/slide-in-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";

interface School {
  id: string;
  name: string;
  code: string;
  schoolType: string;
  level: string;
  type?: string; // Ownership: public/private
  contactEmail: string;
  contactPhone: string;
  address: string;
  districtName?: string;
  city?: string;
  isActive?: boolean;
  subscriptionTier?: string;
  maxStudents?: number;
}

interface SchoolSlideInProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  school?: School | null; // If provided, edit mode
}

/**
 * School Slide-In Form (Add/Edit)
 *
 * Add mode: School code is auto-generated as ABC-DIST-YYYY
 * Edit mode: All fields are editable with existing data
 */
export function AddSchoolSlideIn({ isOpen, onClose, onSuccess, school }: SchoolSlideInProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const isEditMode = !!school;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    district: "Thimphu",
    type: "public" as "public" | "private",  // Ownership: Government/Private
    schoolLevel: "middle_secondary" as "primary" | "middle_secondary" | "higher_secondary",  // School level
    address: "",
    contactEmail: "",
    contactPhone: "",
    subscriptionStatus: "pending_payment" as "active" | "trial" | "pending_payment" | "suspended",
    subscriptionTier: "basic" as "basic" | "premium" | "enterprise",
    maxStudents: 1000,
    isActive: true,
  });

  const [generatedCode, setGeneratedCode] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (school) {
      console.log("[AddSchoolSlideIn] Loading school for edit:", { name: school.name, city: school.city, districtName: school.districtName });
      setFormData({
        name: school.name || "",
        code: school.code || "",
        district: school.city || school.districtName || "Thimphu",  // Prioritize city first
        type: (school.type as "public" | "private") || "public",
        schoolLevel: school.schoolType === "primary" || school.schoolType === "middle_secondary" || school.schoolType === "higher_secondary"
          ? school.schoolType
          : "middle_secondary",
        address: school.address || "",
        contactEmail: school.contactEmail || "",
        contactPhone: school.contactPhone || "",
        subscriptionStatus: "active",
        subscriptionTier: (school.subscriptionTier as "basic" | "premium" | "enterprise") || "basic",
        maxStudents: school.maxStudents || 1000,
        isActive: school.isActive !== undefined ? school.isActive : true,
      });
      console.log("[AddSchoolSlideIn] formData set to:", { district: school.city || school.districtName || "Thimphu" });
      setGeneratedCode(school.code || "");
    } else {
      // Reset for add mode
      setFormData({
        name: "",
        code: "",
        district: "Thimphu",
        type: "public",
        schoolLevel: "middle_secondary",
        address: "",
        contactEmail: "",
        contactPhone: "",
        subscriptionStatus: "pending_payment",
        subscriptionTier: "basic",
        maxStudents: 1000,
        isActive: true,
      });
      const currentYear = new Date().getFullYear();
      setGeneratedCode(`ABC-THI-${currentYear}`);
    }
  }, [school, isOpen]);

  const handleChange = (field: string, value: string | number | boolean) => {
    console.log(`[AddSchoolSlideIn] handleChange: ${field} =`, value);
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      console.log(`[AddSchoolSlideIn] formData updated:`, updated);

      // Auto-generate code preview when name or district changes (only in add mode)
      if (!isEditMode && (field === "name" || field === "district")) {
        const currentYear = new Date().getFullYear();
        const nameValue = String(field === "name" ? value : prev.name);
        const districtValue = String(field === "district" ? value : prev.district);
        const nameCode = nameValue.substring(0, 3).toUpperCase();
        const districtCode = districtValue.substring(0, 3).toUpperCase();
        setGeneratedCode(`${nameCode}-${districtCode}-${currentYear}`);
      }

      return updated;
    });
  };

  const handleSave = async () => {
    // Only save if we have required fields
    if (!formData.name) {
      return;
    }

    // In edit mode, code is required
    if (isEditMode && !formData.code) {
      return;
    }

    console.log("[AddSchoolSlideIn] Current formData.district:", formData.district);

    try {
      let response;

      if (isEditMode && school) {
        // Update existing school - send the schoolLevel directly to match database schema
        const requestData = {
          name: formData.name,
          code: formData.code,
          schoolType: formData.schoolLevel,  // Send as-is: "primary", "middle_secondary", "higher_secondary"
          level: formData.schoolLevel === "primary" ? "PP-VI" :
                 formData.schoolLevel === "middle_secondary" ? "PP-X" :
                 formData.schoolLevel === "higher_secondary" ? "XI-XII" : "PP-XII",
          address: formData.address,
          city: formData.district,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          isActive: formData.isActive,
        };

        console.log("[AddSchoolSlideIn] Sending update request:", JSON.stringify(requestData, null, 2));
        console.log("[AddSchoolSlideIn] requestData.city:", requestData.city);

        response = await fetch(`/api/schools/${school.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });
      } else {
        // Create new school
        // Generate school code from name and district
        const currentYear = new Date().getFullYear();
        const nameCode = formData.name.substring(0, 3).toUpperCase();
        const districtCode = formData.district.substring(0, 3).toUpperCase();
        const schoolCode = `${nameCode}-${districtCode}-${currentYear}`;

        response = await fetch("/api/admin/schools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            code: schoolCode,
            type: formData.type,  // Ownership: public/private
            schoolType: formData.schoolLevel,  // School level: primary/middle_secondary/higher_secondary
            address: formData.address,
            city: formData.district,
            districtId: formData.district,
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone,
            subscriptionTier: formData.subscriptionTier,
            maxStudents: formData.maxStudents,
            level: formData.schoolLevel === "primary" ? "PP-VI" :
                   formData.schoolLevel === "middle_secondary" ? "PP-X" :
                   formData.schoolLevel === "higher_secondary" ? "XI-XII" : "PP-XII",
          }),
        });
      }

      if (response.ok) {
        const responseData = await response.json();
        console.log("[AddSchoolSlideIn] Update successful:", JSON.stringify(responseData, null, 2));

        // Show success toast
        success({
          title: isEditMode ? "School updated!" : "School created!",
          description: `${formData.name} has been ${isEditMode ? "updated" : "added"} successfully.`,
        });
        onSuccess?.();
        router.refresh();
        // Reset and close
        setFormData({
          name: "",
          code: "",
          district: "Thimphu",
          type: "public",
          schoolLevel: "middle_secondary",
          address: "",
          contactEmail: "",
          contactPhone: "",
          subscriptionStatus: "pending_payment",
          subscriptionTier: "basic",
          maxStudents: 1000,
          isActive: true,
        });
        setGeneratedCode("");
        onClose();
      } else {
        const data = await response.json();
        const errorMessage = data.error || (isEditMode ? "Failed to update school" : "Failed to create school");
        // Show error toast
        error({
          title: "Error",
          description: errorMessage,
        });
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("Save error:", err);
      // Show error toast for network/other errors
      if (err instanceof Error) {
        error({
          title: "Error",
          description: err.message,
        });
      }
      throw err;
    }
  };

  const handleClose = () => {
    // Check if there are unsaved changes
    if (formData.name) {
      const confirmed = confirm("You have unsaved changes. Are you sure you want to close?");
      if (!confirmed) return;
    }
    onClose();
    // Reset form
    setFormData({
      name: "",
      code: "",
      district: "Thimphu",
      type: "public",
      schoolLevel: "middle_secondary",
      address: "",
      contactEmail: "",
      contactPhone: "",
      subscriptionStatus: "pending_payment",
      subscriptionTier: "basic",
      maxStudents: 1000,
      isActive: true,
    });
    setGeneratedCode("");
  };

  // Generate preview code on mount (only for add mode)
  useEffect(() => {
    if (!isEditMode) {
      const currentYear = new Date().getFullYear();
      setGeneratedCode(`ABC-THI-${currentYear}`);
    }
  }, [isEditMode]);

  return (
    <SlideInForm
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? "Edit School" : "Add New School"}
      description={isEditMode ? "Update school details and information." : "School code will be auto-generated as ABC-DIST-YYYY format."}
      onSave={handleSave}
      portalType="admin"
    >
      <div className="space-y-5">
        {/* Status Badge (Edit Mode Only) */}
        {isEditMode && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Current Status</span>
            {formData.isActive ? (
              <Badge className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            ) : (
              <Badge className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>
            )}
          </div>
        )}

        {/* School Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-ceramic-primary">
            School Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g., Yangchenphug Higher Secondary School"
            className="w-full"
            required
          />
        </div>

        {/* School Code - Editable in edit mode, auto-generated in add mode */}
        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-medium text-ceramic-primary">
            School Code {isEditMode && <span className="text-red-500">*</span>}
          </Label>
          {isEditMode ? (
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              placeholder="e.g., YAN-THI-2026"
              className="w-full"
              required
            />
          ) : (
            <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
              <p className="text-sm font-mono text-gray-700">
                {generatedCode || "ABC-THI-2026"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Format: ABC-DIST-YYYY (First 3 letters of name, district code, year)
              </p>
            </div>
          )}
        </div>

        {/* District */}
        <div className="space-y-2">
          <Label htmlFor="district" className="text-sm font-medium text-ceramic-primary">
            District
          </Label>
          <Select
            value={formData.district}
            onValueChange={(value) => handleChange("district", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Thimphu">Thimphu</SelectItem>
              <SelectItem value="Paro">Paro</SelectItem>
              <SelectItem value="Punakha">Punakha</SelectItem>
              <SelectItem value="Wangdue">Wangdue Phodrang</SelectItem>
              <SelectItem value="Gasa">Gasa</SelectItem>
              <SelectItem value="Bumthang">Bumthang</SelectItem>
              <SelectItem value="Trongsa">Trongsa</SelectItem>
              <SelectItem value="Mongar">Mongar</SelectItem>
              <SelectItem value="Trashigang">Trashigang</SelectItem>
              <SelectItem value="Trashiyangtse">Trashiyangtse</SelectItem>
              <SelectItem value="Samdrup">Samdrup Jongkhar</SelectItem>
              <SelectItem value="Sarpang">Sarpang</SelectItem>
              <SelectItem value="Pemagatshel">Pemagatshel</SelectItem>
              <SelectItem value="Zhemgang">Zhemgang</SelectItem>
              <SelectItem value="Haa">Haa</SelectItem>
              <SelectItem value="Samtse">Samtse</SelectItem>
              <SelectItem value="Chukha">Chukha</SelectItem>
              <SelectItem value="Dagana">Dagana</SelectItem>
              <SelectItem value="Tsirang">Tsirang</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* School Type (Ownership) */}
        <div className="space-y-2">
          <Label htmlFor="type" className="text-sm font-medium text-ceramic-primary">
            School Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleChange("type", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select school type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Government</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* School Level */}
        <div className="space-y-2">
          <Label htmlFor="schoolLevel" className="text-sm font-medium text-ceramic-primary">
            School Level <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.schoolLevel}
            onValueChange={(value) => handleChange("schoolLevel", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select school level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary (PP-VI)</SelectItem>
              <SelectItem value="middle_secondary">Middle Secondary (PP-X)</SelectItem>
              <SelectItem value="higher_secondary">Higher Secondary (XI-XII)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium text-ceramic-primary">
            Address
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="School address..."
            className="w-full"
          />
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="contactEmail" className="text-sm font-medium text-ceramic-primary">
            Contact Email
          </Label>
          <Input
            id="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleChange("contactEmail", e.target.value)}
            placeholder="admin@school.bt"
            className="w-full"
          />
        </div>

        {/* Contact Phone */}
        <div className="space-y-2">
          <Label htmlFor="contactPhone" className="text-sm font-medium text-ceramic-primary">
            Contact Phone
          </Label>
          <Input
            id="contactPhone"
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => handleChange("contactPhone", e.target.value)}
            placeholder="+975 2 123456"
            className="w-full"
          />
        </div>

        {/* Max Students */}
        <div className="space-y-2">
          <Label htmlFor="maxStudents" className="text-sm font-medium text-ceramic-primary">
            Max Students
          </Label>
          <Input
            id="maxStudents"
            type="number"
            value={formData.maxStudents}
            onChange={(e) => handleChange("maxStudents", parseInt(e.target.value) || 1000)}
            placeholder="1000"
            className="w-full"
          />
        </div>

        {/* Status (Edit Mode Only) */}
        {isEditMode && (
          <div className="space-y-2">
            <Label htmlFor="isActive" className="text-sm font-medium text-ceramic-primary">
              Status
            </Label>
            <Select
              value={formData.isActive ? "active" : "inactive"}
              onValueChange={(value) => handleChange("isActive", value === "active")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Subscription Fields (Add Mode Only) */}
        {!isEditMode && (
          <>
            {/* Subscription Status */}
            <div className="space-y-2">
              <Label htmlFor="subscriptionStatus" className="text-sm font-medium text-ceramic-primary">
                Subscription Status
              </Label>
              <Select
                value={formData.subscriptionStatus}
                onValueChange={(value) => handleChange("subscriptionStatus", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_payment">Pending Payment</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subscription Tier */}
            <div className="space-y-2">
              <Label htmlFor="subscriptionTier" className="text-sm font-medium text-ceramic-primary">
                Subscription Tier
              </Label>
              <Select
                value={formData.subscriptionTier}
                onValueChange={(value) => handleChange("subscriptionTier", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Required field:</span> School Name {isEditMode && "and School Code"}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            {isEditMode
              ? "Make changes and click 'Save' to update the school."
              : "School code will be auto-generated. Click 'Save' when done."
            }
          </p>
        </div>
      </div>
    </SlideInForm>
  );
}
