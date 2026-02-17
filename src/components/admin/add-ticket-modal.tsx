"use client";

import { logger } from "@/lib/logger";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createSupportTicket } from "@/app/admin/support/actions";
import { X, Plus, Trash2 } from "lucide-react";

interface AddTicketModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTicketModal({ open, onClose, onSuccess }: AddTicketModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<"bug" | "feature_request" | "question" | "billing" | "technical" | "account">("bug");
  const [priority, setPriority] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [schoolId, setSchoolId] = useState("");
  const [createdById, setCreatedById] = useState("");
  const [createdByRole, setCreatedByRole] =
    useState<"student" | "teacher" | "parent" | "school_admin" | "counselor">("school_admin");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        subject,
        description,
        category,
        priority,
        schoolId: schoolId || undefined,
        createdById: createdById || "system-user",
        createdByRole,
        tags,
      };

      const result = await createSupportTicket(payload);

      if (result.error) {
        throw new Error(result.error);
      }

      onSuccess();
      onClose();

      // Reset form
      setSubject("");
      setDescription("");
      setCategory("bug");
      setPriority("medium");
      setSchoolId("");
      setCreatedById("");
      setCreatedByRole("school_admin");
      setTags([]);
      setTagInput("");
    } catch (error) {
      logger.error("[ADD TICKET] Error:", error);
      alert(error instanceof Error ? error.message : "Failed to create ticket. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Support Ticket</DialogTitle>
          <DialogDescription>Create a new support ticket on behalf of a user</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Brief description of the issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the issue or request"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={category} onValueChange={(value: typeof category) => setCategory(value)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">
                  Priority <span className="text-red-500">*</span>
                </Label>
                <Select value={priority} onValueChange={(value: typeof priority) => setPriority(value)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Creator Role and User ID */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="createdByRole">
                  Creator Role <span className="text-red-500">*</span>
                </Label>
                <Select value={createdByRole} onValueChange={(value: typeof createdByRole) => setCreatedByRole(value)}>
                  <SelectTrigger id="createdByRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="school_admin">School Admin</SelectItem>
                    <SelectItem value="counselor">Counselor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="createdById">User ID (Optional)</Label>
                <Input
                  id="createdById"
                  placeholder="user-xxxxx"
                  value={createdById}
                  onChange={(e) => setCreatedById(e.target.value)}
                />
                <p className="text-xs text-gray-500">Leave empty for system-created ticket</p>
              </div>
            </div>

            {/* School ID */}
            <div className="space-y-2">
              <Label htmlFor="schoolId">School ID (Optional)</Label>
              <Input
                id="schoolId"
                placeholder="school-xxxxx"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
              className="text-white"
            >
              {isLoading ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
