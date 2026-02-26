"use client";

import { logger } from "@/lib/logger";
import { useToast } from "@/components/ui/toaster";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { portal } from "@/styles/design-tokens";

export interface ResourceFormData {
  title: string;
  description: string;
  resourceType: string;
  format: string;
  category: string;
  tags: string[];
  accessUrl: string;
  thumbnailUrl: string;
  isFeatured: boolean;
  fileId?: string;
}

interface AddResourceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RESOURCE_TYPES = [
  { value: "document", label: "Document" },
  { value: "video", label: "Video" },
  { value: "ebook", label: "E-Book" },
  { value: "audiobook", label: "Audiobook" },
  { value: "journal", label: "Journal" },
  { value: "article", label: "Article" },
  { value: "database", label: "Database" },
];

const FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "epub", label: "EPUB" },
  { value: "mp4", label: "MP4 Video" },
  { value: "mp3", label: "MP3 Audio" },
  { value: "doc", label: "Word Document" },
  { value: "docx", label: "Word Document (DOCX)" },
  { value: "ppt", label: "PowerPoint" },
  { value: "pptx", label: "PowerPoint (PPTX)" },
  { value: "link", label: "External Link" },
];

const CATEGORIES = [
  { value: "career", label: "Career Guidance" },
  { value: "college", label: "College Resources" },
  { value: "scholarship", label: "Scholarship Info" },
  { value: "mental", label: "Mental Health" },
  { value: "study", label: "Study Skills" },
  { value: "tools", label: "Tools & Templates" },
];

const PREDEFINED_TAGS = [
  "featured", "beginner", "intermediate", "advanced",
  "class-10", "class-11", "class-12", "rub", "scholarship",
  "exam-prep", "career-planning", "mental-health"
];

export function AddResourceModal({ open, onClose, onSuccess }: AddResourceModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("document");
  const [format, setFormat] = useState("pdf");
  const [category, setCategory] = useState("career");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [accessUrl, setAccessUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: ResourceFormData = {
        title,
        description,
        resourceType,
        format,
        category,
        tags: isFeatured ? [...tags, "featured"] : tags,
        accessUrl,
        thumbnailUrl,
        isFeatured,
      };

      const response = await fetch("/api/counselor/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create resource");
      }

      toast({
        title: "Resource created",
        description: `${title} has been added to the library.`,
        variant: "success",
      });
      onSuccess();
      handleClose();
    } catch (error) {
      logger.error("[ADD RESOURCE] Error:", error);
      toast({
        title: "Failed to create resource",
        description: error instanceof Error ? error instanceof Error ? error.message : String(error) : "Please try again.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "resource");

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      setAccessUrl(data.file.url);
      toast({
        title: "File uploaded successfully",
        description: "Your file has been uploaded.",
        variant: "success",
      });
    } catch (error) {
      logger.error("[FILE UPLOAD] Error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTogglePredefinedTag = (tag: string) => {
    if (tags.includes(tag)) {
      handleRemoveTag(tag);
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setResourceType("document");
    setFormat("pdf");
    setCategory("career");
    setTags([]);
    setTagInput("");
    setAccessUrl("");
    setThumbnailUrl("");
    setIsFeatured(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Resource</h2>
          <p className="text-sm text-gray-600 mt-1">Add a counseling resource to the library</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Guide to RUB College Applications"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the resource..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="resourceType">Resource Type *</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger id="resourceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="format">Format *</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((fmt) => (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file">Upload File</Label>
            <div className="flex gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.epub"
                className="flex-1"
              />
              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
            {accessUrl && (
              <p className="text-sm text-green-600 mt-1">File uploaded successfully</p>
            )}
          </div>

          <div>
            <Label htmlFor="accessUrl">Or External URL</Label>
            <Input
              id="accessUrl"
              value={accessUrl}
              onChange={(e) => setAccessUrl(e.target.value)}
              placeholder="https://example.com/resource"
              type="url"
            />
          </div>

          <div>
            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
            <Input
              id="thumbnailUrl"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
              type="url"
            />
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add custom tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-purple-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Quick Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTogglePredefinedTag(tag)}
                  className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                    tags.includes(tag)
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <Label htmlFor="isFeatured" className="cursor-pointer">
              Mark as Featured Resource
            </Label>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title || !description}
              className="flex-1"
              style={{ background: portal.counselor.gradient }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Resource"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
