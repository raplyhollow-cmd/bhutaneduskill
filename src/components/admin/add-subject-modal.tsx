"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";

interface AddSubjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSubjectModal({ open, onClose, onSuccess }: AddSubjectModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<"core" | "elective" | "language" | "additional">("core");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState<string>("");

  // Auto-generate subject code from name
  const generateCode = () => {
    if (!name) return "";
    // Generate a 3-5 letter code from the name
    const words = name.toUpperCase().split(" ");
    if (words.length >= 3) {
      return words.slice(0, 3).map(w => w[0]).join("");
    } else if (words.length === 2) {
      return words.map(w => w.substring(0, 2)).join("");
    } else {
      return name.substring(0, 4).toUpperCase();
    }
  };

  // Update code when name changes (if code hasn't been manually set)
  const handleNameChange = (value: string) => {
    setName(value);
    if (!code || code === generateCode()) {
      setCode(generateCode());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        name,
        code: code.toUpperCase(),
        type,
        description,
        grade: grade ? parseInt(grade) : null,
        applicableGrades: grade ? [parseInt(grade)] : undefined,
      };

      const response = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setName("");
        setCode("");
        setType("core");
        setDescription("");
        setGrade("");
        toast({
          title: "Subject created",
          description: `"${name}" has been added to global subjects.`,
          variant: "success",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Failed to create subject",
          description: data.error || "Unknown error",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Failed to create subject:", error);
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
              <h2 className="text-xl font-semibold text-gray-900">Add Global Subject</h2>
              <p className="text-sm text-gray-600">Create a new global subject template</p>
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
            <Label htmlFor="name">Subject Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Mathematics"
              required
            />
          </div>

          <div>
            <Label htmlFor="code">Subject Code *</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., MATH"
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setCode(generateCode())}
                disabled={!name}
              >
                Auto
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Unique code for this subject (3-5 characters recommended)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Subject Type *</Label>
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
              <Label htmlFor="grade">Grade Level (Optional)</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All grades</SelectItem>
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
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this subject..."
              rows={3}
              required
            />
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
            <p className="text-sm text-pink-900">
              <strong>Global Subject:</strong> This subject will be available for all schools to copy to their own catalog.
            </p>
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
              {isLoading ? "Creating..." : "Create Subject"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
