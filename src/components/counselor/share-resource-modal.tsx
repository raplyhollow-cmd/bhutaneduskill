"use client";

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, Copy, Share2, Users, X } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  classGrade?: string | null;
}

interface ShareResourceModalProps {
  open: boolean;
  onClose: () => void;
  resourceId: string;
  resourceTitle: string;
}

export function ShareResourceModal({ open, onClose, resourceId, resourceTitle }: ShareResourceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  // Generate share link when modal opens
  useEffect(() => {
    if (open) {
      const link = `${window.location.origin}/counselor/resources/${resourceId}`;
      setShareLink(link);
    }
  }, [open, resourceId]);

  // Search students via API
  useEffect(() => {
    const searchStudents = async () => {
      if (searchQuery.length < 2) {
        setStudentResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/students/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const results = await response.json();
          setStudentResults(results.students || []);
        }
      } catch (error) {
        logger.error("[SEARCH STUDENTS] Error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchStudents, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error("[COPY LINK] Error:", error);
    }
  };

  const handleShareWithStudents = async () => {
    if (selectedStudents.length === 0) return;

    setIsSharing(true);
    try {
      const response = await fetch("/api/counselor/resources/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          studentIds: selectedStudents,
          message: shareMessage || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to share resource");
      }

      const data = await response.json();
      alert(data.message || `Resource shared with ${selectedStudents.length} student(s)!`);
      setSelectedStudents([]);
      setShareMessage("");
      setSearchQuery("");
      setStudentResults([]);
      onClose();
    } catch (error) {
      logger.error("[SHARE RESOURCE] Error:", error);
      alert(error instanceof Error ? error.message : "Failed to share resource. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleRemoveSelectedStudent = (studentId: string) => {
    setSelectedStudents((prev) => prev.filter((id) => id !== studentId));
  };

  const handleClose = () => {
    setSelectedStudents([]);
    setShareMessage("");
    setSearchQuery("");
    setStudentResults([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Share Resource</h2>
              <p className="text-sm text-gray-600 truncate max-w-[300px]">{resourceTitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share Link Section */}
          <div>
            <Label>Share Link</Label>
            <p className="text-sm text-gray-500 mb-2">
              Anyone with this link can access the resource
            </p>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1 bg-gray-50"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share with Students Section */}
          <div>
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Share with Students
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Send this resource directly to students
            </p>

            {/* Student Search */}
            <div className="relative">
              <Input
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
              {searchQuery.length >= 2 && studentResults.length > 0 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                  {studentResults.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleToggleStudent(student.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                          {student.classGrade && (
                            <p className="text-xs text-gray-400">Class {student.classGrade}</p>
                          )}
                        </div>
                        {selectedStudents.includes(student.id) && (
                          <Check className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && studentResults.length === 0 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                  <p className="text-sm text-gray-500 text-center">No students found</p>
                </div>
              )}
            </div>

            {/* Selected Students */}
            {selectedStudents.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {selectedStudents.length} student{selectedStudents.length > 1 ? "s" : ""} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedStudents.map((studentId) => {
                    const student = studentResults.find((s) => s.id === studentId);
                    // Also check if we have student info from the cached selections
                    const name = student?.name || `Student (${studentId.slice(0, 8)}...)`;
                    return (
                      <span
                        key={studentId}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedStudent(studentId)}
                          className="hover:text-purple-900 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Personal Message */}
          <div>
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Add a personal note to share with the students..."
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Social Share Buttons */}
          <div>
            <Label>Share via</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const url = `https://wa.me/?text=${encodeURIComponent(`Check out this resource: ${shareLink}`)}`;
                  window.open(url, '_blank');
                }}
              >
                WhatsApp
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const url = `mailto:?subject=Resource: ${resourceTitle}&body=${encodeURIComponent(`Check out this resource: ${shareLink}`)}`;
                  window.open(url, '_blank');
                }}
              >
                Email
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSharing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleShareWithStudents}
            disabled={selectedStudents.length === 0 || isSharing}
            className="flex-1"
            style={{ background: "linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))" }}
          >
            {isSharing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              `Share with ${selectedStudents.length} Student${selectedStudents.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
