"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { X, BookOpen } from "lucide-react";
import { portal } from "@/styles/design-tokens";

interface Subject {
  id: string;
  name: string;
  code: string;
  type: "core" | "elective" | "language" | "additional";
  description: string;
  grade?: number;
  applicableGrades?: string;
  isActive: boolean;
}

interface EditSubjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subject: Subject;
}

export function EditSubjectModal({ open, onClose, onSuccess, subject }: EditSubjectModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form fields - initialize with subject data
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<"core" | "elective" | "language" | "additional">("core");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  // Reset form when subject changes
  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setCode(subject.code);
      setType(subject.type);
      setDescription(subject.description);
      setGrade(subject.grade ? subject.grade.toString() : "");
      setIsActive(subject.isActive);
    }
  }, [subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: {
        name: string;
        code: string;
        type: "core" | "elective" | "language" | "additional";
        description: string;
        isActive: boolean;
        grade?: number;
        applicableGrades?: number[];
      } = {
        name,
        code: code.toUpperCase(),
        type,
        description,
        isActive,
      };

      if (grade) {
        payload.grade = parseInt(grade);
        payload.applicableGrades = [parseInt(grade)];
      }

      const response = await fetch(`/api/admin/subjects/${subject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        toast({
          title: "Subject updated",
          description: `"${name}" has been updated successfully.`,
          variant: "success",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Failed to update subject",
          description: data.error || "Unknown error",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Failed to update subject:", error);
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
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: portal.admin.gradient }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Global Subject</h2>
              <p className="text-sm text-gray-600">Update subject template</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="edit-name">Subject Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mathematics"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-code">Subject Code *</Label>
            <Input
              id="edit-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., MATH"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique code for this subject
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-type">Subject Type *</Label>
              <Select value={type} onValueChange={(value: "core" | "elective" | "language" | "additional") => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="elective">Elective</SelectItem>
                  <SelectItem value="language">Language</SelectItem>
                  <SelectItem value="additional">Additional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-grade">Grade Level</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All grades</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                    <SelectItem key={g} value={g.toString()}>
                      Grade {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">Description *</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this subject..."
              rows={3}
              required
            />
          </div>

          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <input
              type="checkbox"
              id="edit-isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
            <label htmlFor="edit-isActive" className="text-sm text-gray-700 cursor-pointer">
              This subject is active and available for schools to copy
            </label>
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
              disabled={isLoading || !name || !code || !description}
              className="flex-1"
              style={{ background: portal.admin.gradient }}
            >
              {isLoading ? "Updating..." : "Update Subject"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
