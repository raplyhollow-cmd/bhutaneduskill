"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Loader2 } from "lucide-react";
import { updateCounselor } from "@/app/admin/counselors/actions";

interface Counselor {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  schoolId?: string;
  department?: string;
}

interface EditCounselorModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  counselor: Counselor | null;
}

export function EditCounselorModal({ open, onClose, onSuccess, counselor }: EditCounselorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: counselor?.firstName || "",
    lastName: counselor?.lastName || "",
    email: counselor?.email || "",
    phone: counselor?.phone || "",
    schoolId: counselor?.schoolId || "",
    department: counselor?.department || "",
  });

  // Update form when counselor changes
  useEffect(() => {
    if (counselor) {
      setFormData({
        firstName: counselor.firstName || "",
        lastName: counselor.lastName || "",
        email: counselor.email || "",
        phone: counselor.phone || "",
        schoolId: counselor.schoolId || "",
        department: counselor.department || "",
      });
    }
  }, [counselor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateCounselor(counselor.id, formData);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update counselor");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Counselor</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-firstName">First Name *</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-lastName">Last Name *</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-schoolId">School</Label>
            <Select
              value={formData.schoolId}
              onValueChange={(value) => setFormData({ ...formData, schoolId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a school" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No School (Platform Counselor)</SelectItem>
                {/* TODO: Fetch schools from API */}
                <SelectItem value="school1">Demo School 1</SelectItem>
                <SelectItem value="school2">Demo School 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
