"use client";

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateAssessmentType } from "@/app/admin/assessments/actions";

interface AssessmentType {
  id: string;
  name: string;
  description: string;
  category: string;
  targetAudience: string;
  targetGrade?: number;
  duration?: number;
  totalQuestions?: number;
  passingScore?: number;
  isActive?: boolean;
}

interface EditAssessmentTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assessmentType: AssessmentType | null;
}

export function EditAssessmentTypeModal({ open, onClose, onSuccess, assessmentType }: EditAssessmentTypeModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("aptitude");
  const [targetAudience, setTargetAudience] = useState("all");
  const [targetGrade, setTargetGrade] = useState("");
  const [duration, setDuration] = useState("30");
  const [totalQuestions, setTotalQuestions] = useState("10");
  const [passingScore, setPassingScore] = useState("70");
  const [isActive, setIsActive] = useState(true);

  // Populate form when assessmentType changes
  useEffect(() => {
    if (assessmentType) {
      setName(assessmentType.name || "");
      setDescription(assessmentType.description || "");
      setCategory(assessmentType.category || "aptitude");
      setTargetAudience(assessmentType.targetAudience || "all");
      setTargetGrade(assessmentType.targetGrade ? String(assessmentType.targetGrade) : "");
      setDuration(assessmentType.duration ? String(assessmentType.duration) : "30");
      setTotalQuestions(assessmentType.totalQuestions ? String(assessmentType.totalQuestions) : "10");
      setPassingScore(assessmentType.passingScore ? String(assessmentType.passingScore) : "70");
      setIsActive(!!assessmentType.isActive);
    }
  }, [assessmentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentType?.id) return;

    setIsLoading(true);

    try {
      const payload = {
        name,
        description,
        category,
        targetAudience,
        targetGrade: targetGrade ? parseInt(targetGrade) : undefined,
        duration: duration ? parseInt(duration) : undefined,
        totalQuestions: totalQuestions ? parseInt(totalQuestions) : undefined,
        passingScore: passingScore ? parseInt(passingScore) : undefined,
        isActive,
      };

      await updateAssessmentType(assessmentType.id, payload);

      onSuccess();
      onClose();
    } catch (error) {
      logger.error("[EDIT ASSESSMENT TYPE] Error:", error);
      alert(error instanceof Error ? error.message : "Failed to update assessment type. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!open || !assessmentType) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Assessment Type</h2>
          <p className="text-sm text-gray-600 mt-1">Update assessment type information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="edit-name">Assessment Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., MBTI Personality Test"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description *</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this assessment measures..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aptitude">Aptitude</SelectItem>
                  <SelectItem value="personality">Personality</SelectItem>
                  <SelectItem value="career_interest">Career Interest</SelectItem>
                  <SelectItem value="skill">Skill</SelectItem>
                  <SelectItem value="psychological">Psychological</SelectItem>
                  <SelectItem value="learning_style">Learning Style</SelectItem>
                  <SelectItem value="work_values">Work Values</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-targetAudience">Target Audience *</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                  <SelectItem value="parent">Parents</SelectItem>
                  <SelectItem value="counselor">Counselors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-targetGrade">Target Grade</Label>
              <Input
                id="edit-targetGrade"
                type="number"
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                placeholder="e.g., 10"
                min="6"
                max="12"
              />
            </div>

            <div>
              <Label htmlFor="edit-duration">Duration (min) *</Label>
              <Input
                id="edit-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                min="1"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-totalQuestions">Questions *</Label>
              <Input
                id="edit-totalQuestions"
                type="number"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
                placeholder="10"
                min="1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-passingScore">Passing Score (%) *</Label>
              <Input
                id="edit-passingScore"
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                placeholder="70"
                min="0"
                max="100"
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <Label htmlFor="edit-isActive" className="cursor-pointer">
                Active (visible to users)
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
              disabled={isLoading || !name || !description}
              className="flex-1"
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            >
              {isLoading ? "Updating..." : "Update Assessment Type"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
