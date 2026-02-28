/**
 * BEHAVIOR LOG MODAL
 *
 * Quick-entry modal for logging merit/demerit incidents
 * Sends automatic parent notifications for demerits
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";

interface BehaviorLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BehaviorLogData) => Promise<void>;
  studentName?: string;
  studentId?: string;
  classId?: string;
}

export interface BehaviorLogData {
  studentId: string;
  classId?: string;
  type: "merit" | "demerit";
  category: string;
  points: number;
  description: string;
  actionTaken?: string;
  severity: "low" | "medium" | "high";
}

const MERIT_CATEGORIES = [
  { value: "participation", label: "Class Participation", icon: "🙋" },
  { value: "leadership", label: "Leadership", icon: "👑" },
  { value: "homework", label: "Homework Excellence", icon: "📚" },
  { value: "attendance", label: "Perfect Attendance", icon: "✅" },
  { value: "discipline", label: "Good Behavior", icon: "😊" },
  { value: "other", label: "Other", icon: "🌟" },
];

const DEMERIT_CATEGORIES = [
  { value: "discipline", label: "Disruptive Behavior", icon: "⚠️" },
  { value: "attendance", label: "Attendance Issue", icon: "📅" },
  { value: "homework", label: "Missing Homework", icon: "📝" },
  { value: "participation", label: "Lack of Participation", icon: "😴" },
  { value: "other", label: "Other", icon: "📋" },
];

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", color: "bg-blue-100 text-blue-700" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "High", color: "bg-red-100 text-red-700" },
];

const ACTION_TAKEN_OPTIONS = [
  "None",
  "Warning",
  "Counseling",
  "Parent Call",
  "Detention",
];

export function BehaviorLogModal({
  isOpen,
  onClose,
  onSubmit,
  studentName,
  studentId,
  classId,
}: BehaviorLogModalProps) {
  const [type, setType] = useState<"merit" | "demerit">("merit");
  const [category, setCategory] = useState("participation");
  const [points, setPoints] = useState(1);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("low");
  const [actionTaken, setActionTaken] = useState("None");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = type === "merit" ? MERIT_CATEGORIES : DEMERIT_CATEGORIES;

  const handleSubmit = async () => {
    if (!studentId || !description.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        studentId,
        classId,
        type,
        category,
        points: type === "merit" ? Math.abs(points) : -Math.abs(points),
        description,
        actionTaken: type === "demerit" ? actionTaken : undefined,
        severity,
      });

      // Reset form
      setDescription("");
      setPoints(1);
      setSeverity("low");
      setActionTaken("None");
      onClose();
    } catch (error) {
      console.error("Failed to submit behavior log:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "merit" ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            Log Behavior Incident
          </DialogTitle>
          <DialogDescription>
            {studentName ? `For ${studentName}` : "Select a student to log behavior"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "merit" ? "ceramic-success" : "outline"}
              className="flex-1"
              onClick={() => setType("merit")}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Merit
            </Button>
            <Button
              type="button"
              variant={type === "demerit" ? "ceramic-error" : "outline"}
              className="flex-1"
              onClick={() => setType("demerit")}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Demerit
            </Button>
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium text-ceramic-primary mb-2 block">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    category === cat.value
                      ? "border-ceramic-blue-500 bg-ceramic-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg mr-2">{cat.icon}</span>
                  <span className="text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Points */}
          <div>
            <label className="text-sm font-medium text-ceramic-primary mb-2 block">
              Points
            </label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPoints(Math.max(1, points - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                min="1"
                max="10"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPoints(Math.min(10, points + 1))}
              >
                +
              </Button>
              <span className="text-sm text-gray-500">
                {type === "merit" ? "Positive" : "Negative"} impact
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-ceramic-primary mb-2 block">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the incident..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ceramic-blue-500 resize-none"
            />
          </div>

          {/* Severity (for demerits) */}
          {type === "demerit" && (
            <div>
              <label className="text-sm font-medium text-ceramic-primary mb-2 block">
                Severity
              </label>
              <div className="flex gap-2">
                {SEVERITY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setSeverity(level.value as "low" | "medium" | "high")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      severity === level.value
                        ? level.color
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Taken (for demerits) */}
          {type === "demerit" && (
            <div>
              <label className="text-sm font-medium text-ceramic-primary mb-2 block">
                Action Taken
              </label>
              <select
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ceramic-blue-500"
              >
                {ACTION_TAKEN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Parent Notification Warning */}
          {type === "demerit" && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                Parent will be notified automatically for all demerit entries.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ceramic-ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={type === "merit" ? "ceramic-success" : "ceramic-error"}
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
          >
            {isSubmitting ? "Logging..." : "Log Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
