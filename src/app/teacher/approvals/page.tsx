"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Users, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface PendingStudent {
  id: string;
  name: string;
  email: string;
  grade: string;
  section?: string;
  appliedAt: string;
  applicationId: string;
}

export default function TeacherApprovalsPage() {
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingStudents();
  }, []);

  const loadPendingStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/pending-students");
      const data = await res.json();

      if (data.success) {
        setStudents(data.students || []);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load pending students",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Failed to load pending students:", error);
      toast({
        title: "Error",
        description: "Failed to load pending students",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId: string, studentName: string) => {
    setProcessing(studentId);
    try {
      const res = await fetch(`/api/school-admin/applications/${studentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "student" }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Approved!",
          description: `${studentName} has been approved and can now access their portal.`,
          variant: "success",
        });
        // Remove from list
        setStudents(students.filter(s => s.id !== studentId));
      } else {
        toast({
          title: "Approval Failed",
          description: data.error || "Failed to approve student",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        title: "Error",
        description: "Failed to approve student",
        variant: "error",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to reject ${studentName}?`)) return;

    setProcessing(studentId);
    try {
      const res = await fetch(`/api/school-admin/applications/${studentId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "student", reason: "Rejected by teacher" }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Rejected",
          description: `${studentName}'s application has been rejected.`,
          variant: "success",
        });
        // Remove from list
        setStudents(students.filter(s => s.id !== studentId));
      } else {
        toast({
          title: "Rejection Failed",
          description: data.error || "Failed to reject student",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Rejection error:", error);
      toast({
        title: "Error",
        description: "Failed to reject student",
        variant: "error",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pending Student Approvals</h1>
            <p className="text-gray-600 mt-1">
              Review and approve students waiting to join your classes
            </p>
          </div>
          <Button onClick={loadPendingStudents} variant="outline" size="sm">
            Refresh
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-blue-200 bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900">{students.length} students</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Students List */}
        {students.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">All caught up!</h3>
            <p className="text-gray-600 mt-1">No pending student approvals</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {students.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-blue-200 bg-white/80 backdrop-blur hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{student.name}</h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Class {student.grade}
                            </span>
                            {student.section && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                Section {student.section}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(student.appliedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleApprove(student.id, student.name)}
                          disabled={processing === student.id}
                          size="sm"
                          className="gap-2"
                        >
                          {processing === student.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(student.id, student.name)}
                          disabled={processing === student.id}
                          variant="outline"
                          size="sm"
                          className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                        >
                          {processing === student.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
