"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlideInForm } from "@/components/form/slide-in-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddSchoolSlideInProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Add School Slide-In Form
 *
 * Follows the flow diagram: School code is auto-generated as ABC-DIST-YYYY
 * Only school name is required from user.
 */
export function AddSchoolSlideIn({ isOpen, onClose, onSuccess }: AddSchoolSlideInProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    district: "Thimphu",
    address: "",
    contactEmail: "",
    contactPhone: "",
    subscriptionStatus: "pending_payment" as "active" | "trial" | "pending_payment" | "suspended",
    subscriptionTier: "basic" as "basic" | "premium" | "enterprise",
    maxStudents: 1000,
  });

  const [generatedCode, setGeneratedCode] = useState("");

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-generate code preview when name or district changes
      if (field === "name" || field === "district") {
        const currentYear = new Date().getFullYear();
        const nameCode = (field === "name" ? value : prev.name).substring(0, 3).toUpperCase();
        const districtCode = (field === "district" ? value : prev.district).substring(0, 3).toUpperCase();
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

    // Generate school code from name and district
    const currentYear = new Date().getFullYear();
    const nameCode = formData.name.substring(0, 3).toUpperCase();
    const districtCode = formData.district.substring(0, 3).toUpperCase();
    const schoolCode = `${nameCode}-${districtCode}-${currentYear}`;

    try {
      const response = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          code: schoolCode,
          address: formData.address,
          city: formData.district,
          districtId: formData.district,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          subscriptionTier: formData.subscriptionTier,
          maxStudents: formData.maxStudents,
          schoolType: "middle_secondary",
          level: "PP-XII",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess?.();
        router.refresh();
        // Reset and close
        setFormData({
          name: "",
          district: "Thimphu",
          address: "",
          contactEmail: "",
          contactPhone: "",
          subscriptionStatus: "pending_payment",
          subscriptionTier: "basic",
          maxStudents: 1000,
        });
        setGeneratedCode("");
        onClose();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to create school");
      }
    } catch (error) {
      console.error("Save error:", error);
      throw error;
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
      district: "Thimphu",
      address: "",
      contactEmail: "",
      contactPhone: "",
      subscriptionStatus: "pending_payment",
      subscriptionTier: "basic",
      maxStudents: 1000,
    });
    setGeneratedCode("");
  };

  // Generate preview code on mount
  useState(() => {
    const currentYear = new Date().getFullYear();
    setGeneratedCode(`ABC-THI-${currentYear}`);
  });

  return (
    <SlideInForm
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New School"
      description="School code will be auto-generated as ABC-DIST-YYYY format."
      onSave={handleSave}
      portalType="admin"
    >
      <div className="space-y-5">
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

        {/* School Code Preview (Auto-generated) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-ceramic-primary">
            School Code (Auto-generated)
          </Label>
          <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
            <p className="text-sm font-mono text-gray-700">
              {generatedCode || "ABC-THI-2026"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Format: ABC-DIST-YYYY (First 3 letters of name, district code, year)
            </p>
          </div>
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

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Required field:</span> School Name only
          </p>
          <p className="text-xs text-blue-700 mt-1">
            School code will be auto-generated. Click "Save" when done.
          </p>
        </div>
      </div>
    </SlideInForm>
  );
}
