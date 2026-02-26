/**
 * ASSIGN TEACHER MODAL
 *
 * Modal for assigning a class teacher to a class
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, UserPlus, CheckCircle } from "lucide-react";

interface Teacher {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
}

interface AssignTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (teacherId: string) => Promise<void>;
  classId: string;
  className: string;
  currentTeacherId?: string | null;
}

export function AssignTeacherModal({
  isOpen,
  onClose,
  onAssign,
  classId,
  className,
  currentTeacherId,
}: AssignTeacherModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch available teachers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
      setSearchQuery("");
      setSelectedTeacherId(null);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const fetchTeachers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/school-admin/teachers?status=active");
      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }
      const data = await response.json();
      // Handle both old format and new API format
      setTeachers(data.teachers || data.data?.teachers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teachers");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      !currentTeacherId || teacher.id !== currentTeacherId
  ).filter((teacher) => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${teacher.firstName || ""} ${teacher.lastName || ""}`.toLowerCase();
    const email = (teacher.email || "").toLowerCase();
    const employeeId = (teacher.employeeId || "").toLowerCase();
    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      employeeId.includes(searchLower)
    );
  });

  const handleAssign = async () => {
    if (!selectedTeacherId) {
      setError("Please select a teacher");
      return;
    }

    setIsAssigning(true);
    setError(null);
    try {
      await onAssign(selectedTeacherId);
      setSuccess(true);
      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign teacher");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Class Teacher</DialogTitle>
          <DialogDescription>
            Assign a teacher as the class teacher for <strong>{className}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700">Teacher assigned successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Teachers List */}
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading teachers...</span>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  {searchQuery ? "No teachers match your search" : "No teachers available"}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTeachers.map((teacher) => {
                  const isSelected = selectedTeacherId === teacher.id;
                  return (
                    <button
                      key={teacher.id}
                      onClick={() => setSelectedTeacherId(teacher.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-violet-50 border-l-4 border-violet-600" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {teacher.firstName} {teacher.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{teacher.email}</p>
                          {teacher.employeeId && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {teacher.employeeId}
                            </Badge>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-violet-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Teacher Summary */}
          {selectedTeacherId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Selected:{" "}
                <strong>
                  {filteredTeachers.find((t) => t.id === selectedTeacherId)?.firstName}{" "}
                  {filteredTeachers.find((t) => t.id === selectedTeacherId)?.lastName}
                </strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isAssigning || success}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={!selectedTeacherId || isAssigning || success}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Teacher
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
