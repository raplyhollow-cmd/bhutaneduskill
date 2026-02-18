"use client";

import { logger } from "@/lib/logger";
import { useToast } from "@/components/ui/toast";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCareer } from "@/app/admin/careers/actions";

interface AddCareerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCareerModal({ open, onClose, onSuccess }: AddCareerModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [riasecCode, setRiasecCode] = useState("");
  const [skills, setSkills] = useState("");
  const [educationLevel, setEducationLevel] = useState("high_school");
  const [subjects, setSubjects] = useState("");
  const [workEnvironment, setWorkEnvironment] = useState("office");
  const [typicalSalary, setTypicalSalary] = useState("");
  const [bhutanDemand, setBhutanDemand] = useState<"high" | "medium" | "low">("medium");
  const [bhutanSpecific, setBhutanSpecific] = useState(false);

  // Auto-generate slug from name
  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        name,
        slug,
        description,
        riasecCode,
        skills: skills ? skills.split(",").map(s => s.trim()) : [],
        educationLevel,
        subjects: subjects ? subjects.split(",").map(s => s.trim()) : [],
        workEnvironment,
        salaryRange: typicalSalary,
        bhutanDemand,
        bhutanSpecific,
      };

      await createCareer(payload);

      onSuccess();
      onClose();

      // Reset form
      setName("");
      setSlug("");
      setDescription("");
      setRiasecCode("");
      setSkills("");
      setEducationLevel("high_school");
      setSubjects("");
      setWorkEnvironment("office");
      setTypicalSalary("");
      setBhutanDemand("medium");
      setBhutanSpecific(false);

      toast({
        title: "Career created",
        description: `"${name}" has been added to the career database.`,
        variant: "success",
      });
    } catch (error) {
      logger.error("[ADD CAREER] Error:", error);
      toast({
        title: "Failed to create career",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Career</h2>
          <p className="text-sm text-gray-600 mt-1">Add a career profile to the database</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Career Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Software Engineer"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., software-engineer"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the career..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="riasecCode">RIASEC Code</Label>
              <Input
                id="riasecCode"
                value={riasecCode}
                onChange={(e) => setRiasecCode(e.target.value.toUpperCase())}
                placeholder="e.g., IRE"
                maxLength={3}
              />
            </div>

            <div>
              <Label htmlFor="educationLevel">Education Level *</Label>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_school">High School</SelectItem>
                  <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                  <SelectItem value="master">Master's Degree</SelectItem>
                  <SelectItem value="doctorate">Doctorate</SelectItem>
                  <SelectItem value="diploma">Diploma/Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g., Problem Solving, Programming, Communication"
            />
          </div>

          <div>
            <Label htmlFor="subjects">Related Subjects (comma-separated)</Label>
            <Input
              id="subjects"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              placeholder="e.g., Mathematics, Computer Science, Physics"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workEnvironment">Work Environment</Label>
              <Select value={workEnvironment} onValueChange={setWorkEnvironment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="field">Field Work</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="typicalSalary">Typical Salary Range</Label>
              <Input
                id="typicalSalary"
                value={typicalSalary}
                onChange={(e) => setTypicalSalary(e.target.value)}
                placeholder="e.g., Nu. 30,000 - 80,000/month"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bhutanDemand">Demand in Bhutan *</Label>
              <Select value={bhutanDemand} onValueChange={(value: "high" | "medium" | "low") => setBhutanDemand(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Demand</SelectItem>
                  <SelectItem value="medium">Medium Demand</SelectItem>
                  <SelectItem value="low">Low Demand</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="bhutanSpecific"
                checked={bhutanSpecific}
                onChange={(e) => setBhutanSpecific(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <Label htmlFor="bhutanSpecific" className="cursor-pointer">
                Bhutan-Specific Career
              </Label>
            </div>
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
              disabled={isLoading || !name || !slug}
              className="flex-1"
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            >
              {isLoading ? "Creating..." : "Create Career"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
