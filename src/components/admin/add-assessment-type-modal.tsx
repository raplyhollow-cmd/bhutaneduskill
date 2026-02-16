"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAssessmentType } from "@/app/admin/assessments/actions";

interface AddAssessmentTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAssessmentTypeModal({ open, onClose, onSuccess }: AddAssessmentTypeModalProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      };

      await createAssessmentType(payload);

      onSuccess();
      onClose();

      // Reset form
      setName("");
      setDescription("");
      setCategory("aptitude");
      setTargetAudience("all");
      setTargetGrade("");
      setDuration("30");
      setTotalQuestions("10");
      setPassingScore("70");
    } catch (error) {
      console.error("[ADD ASSESSMENT TYPE] Error:", error);
      alert(error instanceof Error ? error.message : "Failed to create assessment type. Please try again.");
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
          <h2 className="text-xl font-semibold text-gray-900">Add Assessment Type</h2>
          <p className="text-sm text-gray-600 mt-1">Create a new assessment type for students</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name">Assessment Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., MBTI Personality Test"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this assessment measures..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
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
              <Label htmlFor="targetAudience">Target Audience *</Label>
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
              <Label htmlFor="targetGrade">Target Grade</Label>
              <Input
                id="targetGrade"
                type="number"
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                placeholder="e.g., 10"
                min="6"
                max="12"
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (min) *</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                min="1"
                required
              />
            </div>

            <div>
              <Label htmlFor="totalQuestions">Questions *</Label>
              <Input
                id="totalQuestions"
                type="number"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
                placeholder="10"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="passingScore">Passing Score (%) *</Label>
            <Input
              id="passingScore"
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              placeholder="70"
              min="0"
              max="100"
              required
            />
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
              {isLoading ? "Creating..." : "Create Assessment Type"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
