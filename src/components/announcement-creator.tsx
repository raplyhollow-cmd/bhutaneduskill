"use client";

/**
 * Announcement Creator Component
 *
 * Simplified UI for creating announcements with:
 * - Quick create form
 * - Target audience selection
 * - Priority and category options
 * - Pin toggle
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Send, X } from "lucide-react";
import { useToast } from "@/components/ui/toaster";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  targetAudience: string;
  category: string;
  isPinned: boolean;
  schoolId?: string;
}

interface AnnouncementCreatorProps {
  onCreate?: (announcement: Announcement) => void;
  onCancel?: () => void;
  schoolId?: string;
  userType?: string;
}

export function AnnouncementCreator({
  onCreate,
  onCancel,
  schoolId,
  userType = "school-admin",
}: AnnouncementCreatorProps) {
  const { success, error } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [targetAudience, setTargetAudience] = useState<string>("all");
  const [category, setCategory] = useState<string>("general");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      error({ title: "Please fill in all required fields" });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          targetAudience,
          priority,
          category,
          isPinned,
          schoolId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        success({ title: "Announcement created successfully!" });
        onCreate?.(data.announcement);

        // Reset form
        setTitle("");
        setContent("");
        setPriority("normal");
        setTargetAudience("all");
        setCategory("general");
        setIsPinned(false);
      } else {
        error({ title: data.error || "Failed to create announcement" });
      }
    } catch (err) {
      console.error("Failed to create announcement:", err);
      error({ title: "Failed to create announcement" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setPriority("normal");
    setTargetAudience("all");
    setCategory("general");
    setIsPinned(false);
    onCancel?.();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Create Announcement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
              required
              disabled={submitting}
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter announcement content"
              rows={5}
              required
              disabled={submitting}
            />
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) =>
                  setPriority(value as "low" | "normal" | "high" | "urgent")
                }
                disabled={submitting}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                        Low
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        Normal
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        High
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        Urgent
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={submitting}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Audience */}
            <div>
              <Label htmlFor="audience">Target Audience</Label>
              <Select
                value={targetAudience}
                onValueChange={setTargetAudience}
                disabled={submitting}
              >
                <SelectTrigger id="audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pin Toggle */}
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div className="space-y-0.5">
                <Label htmlFor="pin" className="cursor-pointer">
                  Pin Announcement
                </Label>
                <p className="text-xs text-gray-500">
                  Show at top of notice board
                </p>
              </div>
              <Switch
                id="pin"
                checked={isPinned}
                onCheckedChange={setIsPinned}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={submitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish Announcement
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
