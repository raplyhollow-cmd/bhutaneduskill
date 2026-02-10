"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, X } from "lucide-react";

interface AnnouncementFormProps {
  onSubmit: (data: AnnouncementFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  initialData?: Partial<AnnouncementFormData>;
  isSubmitting?: boolean;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  excerpt?: string;
  targetAudience: "all" | "students" | "teachers" | "parents" | "staff" | "counselor";
  targetGradeLevel?: string;
  targetClassIds?: string[];
  priority: "low" | "normal" | "high" | "urgent";
  category?: string;
  publishDate?: string;
  expiryDate?: string;
  isPublished?: boolean;
  isPinned?: boolean;
}

const categories = [
  { value: "general", label: "General" },
  { value: "academic", label: "Academic" },
  { value: "event", label: "Event" },
  { value: "holiday", label: "Holiday" },
  { value: "exam", label: "Exam" },
  { value: "emergency", label: "Emergency" },
];

const gradeLevels = ["PP", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function AnnouncementForm({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting = false,
}: AnnouncementFormProps) {
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: initialData?.title || "",
    content: initialData?.content || "",
    excerpt: initialData?.excerpt || "",
    targetAudience: initialData?.targetAudience || "all",
    targetGradeLevel: initialData?.targetGradeLevel || "",
    targetClassIds: initialData?.targetClassIds || [],
    priority: initialData?.priority || "normal",
    category: initialData?.category || "general",
    publishDate: initialData?.publishDate || "",
    expiryDate: initialData?.expiryDate || "",
    isPublished: initialData?.isPublished ?? false,
    isPinned: initialData?.isPinned ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    field: keyof AnnouncementFormData,
    value: string | boolean | string[] | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateExcerpt = () => {
    const plainText = formData.content
      .replace(/<[^>]*>/g, "")
      .replace(/\n/g, " ")
      .trim();
    const excerpt = plainText.length > 150 ? plainText.slice(0, 147) + "..." : plainText;
    setFormData((prev) => ({ ...prev, excerpt }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const result = await onSubmit(formData);

    if (!result.success && result.error) {
      setErrors({ general: result.error });
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{initialData?.title ? "Edit Announcement" : "Create Announcement"}</CardTitle>
        <CardDescription>
          Share important information with your school community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter announcement title"
              className={errors.title ? "border-red-500" : ""}
              maxLength={200}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Write your announcement content..."
              rows={6}
              className={errors.content ? "border-red-500" : ""}
            />
            <div className="flex justify-between items-center">
              {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="ml-auto"
                onClick={generateExcerpt}
              >
                Auto-generate excerpt
              </Button>
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt (Optional)</Label>
            <Input
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => handleChange("excerpt", e.target.value)}
              placeholder="Short summary for announcement cards"
              maxLength={300}
            />
            <p className="text-xs text-gray-500">
              {formData.excerpt?.length || 0} / 300 characters
            </p>
          </div>

          {/* Target Audience & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(value) => handleChange("targetAudience", value)}
              >
                <SelectTrigger id="audience">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="counselor">Counselors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => handleChange("priority", value)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category & Grade Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Target Grade Level (Optional)</Label>
              <Select
                value={formData.targetGradeLevel}
                onValueChange={(value) => handleChange("targetGradeLevel", value || "")}
              >
                <SelectTrigger id="gradeLevel">
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Grades</SelectItem>
                  {gradeLevels.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      Class {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Publish Date & Expiry Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publishDate">Publish Date (Optional)</Label>
              <Input
                id="publishDate"
                type="date"
                value={formData.publishDate}
                onChange={(e) => handleChange("publishDate", e.target.value)}
                min={today}
              />
              <p className="text-xs text-gray-500">
                Leave empty to publish immediately
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleChange("expiryDate", e.target.value)}
                min={formData.publishDate || today}
              />
              <p className="text-xs text-gray-500">
                Announcement will be hidden after this date
              </p>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => handleChange("isPublished", checked)}
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                Publish immediately
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPinned"
                checked={formData.isPinned}
                onCheckedChange={(checked) => handleChange("isPinned", checked)}
              />
              <Label htmlFor="isPinned" className="cursor-pointer">
                Pin to top
              </Label>
            </div>
          </div>

          {/* Priority Preview */}
          {formData.priority === "urgent" && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Badge className="bg-red-500 text-white">Urgent</Badge>
              <span className="text-sm text-red-700">
                This announcement will be highlighted as urgent
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {formData.isPublished ? "Publish Announcement" : "Save Draft"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
