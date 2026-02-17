/**
 * Announcement Form Component
 * Form for creating and editing announcements
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface AnnouncementFormData {
  title: string;
  content: string;
  excerpt?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  targetAudience: "all" | "students" | "teachers" | "parents" | "staff" | "counselor";
  targetGradeLevel?: string;
  targetClassIds?: string[];
  targetUserIds?: string[];
  category?: string;
  publishDate?: string;
  expiryDate?: string;
  isPublished?: boolean;
  isPinned?: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

interface AnnouncementFormProps {
  onSubmit: (data: AnnouncementFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  initialData?: Partial<AnnouncementFormData>;
  isSubmitting?: boolean;
}

export function AnnouncementForm({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting = false,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">(initialData?.priority || "normal");
  const [targetAudience, setTargetAudience] = useState<"all" | "students" | "teachers" | "parents" | "staff" | "counselor">(initialData?.targetAudience || "all");
  const [category, setCategory] = useState(initialData?.category || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSubmit({
      title,
      content,
      excerpt: excerpt || undefined,
      priority,
      targetAudience,
      category: category || undefined,
    });
    if (result.success) {
      // Reset form on success
      setTitle("");
      setContent("");
      setExcerpt("");
      setPriority("normal");
      setTargetAudience("all");
      setCategory("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter announcement title"
          required
        />
      </div>

      <div>
        <Label htmlFor="excerpt">Excerpt (Optional)</Label>
        <Input
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short summary for announcement list"
        />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter announcement content"
          rows={6}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as "low" | "normal" | "high" | "urgent")}>
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="audience">Target Audience</Label>
          <Select value={targetAudience} onValueChange={(value) => setTargetAudience(value as "all" | "students" | "teachers" | "parents" | "staff" | "counselor")}>
            <SelectTrigger id="audience">
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="students">Students</SelectItem>
              <SelectItem value="teachers">Teachers</SelectItem>
              <SelectItem value="parents">Parents</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="counselor">Counselors</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="category">Category (Optional)</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., Event, Notice, Reminder"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData?.title ? "Update" : "Create"} Announcement
        </Button>
      </div>
    </form>
  );
}