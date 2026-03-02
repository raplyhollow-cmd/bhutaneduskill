/**
 * TEACHER - MY CLASSES & SUBJECTS PAGE
 *
 * Phase 7: Shows teachers all their assigned classes and subjects
 * - Homeroom classes (where they are the class teacher)
 * - Subject assignments (where they teach specific subjects)
 *
 * SMART UX FEATURES:
 * - QuickActionMenu for each class (View Students, View Homework, Take Attendance)
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  Users,
  GraduationCap,
  Loader2,
  AlertCircle,
  School,
  Clock,
  ChevronRight,
  FileText,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TableQuickActions, ActionIcons } from "@/components/shared/table-quick-actions";

interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  isPrimary: boolean;
}

interface ClassWithSubjects {
  id: string;
  name: string;
  grade: number;
  section: string;
  academicYear: string;
  roomNumber: string | null;
  capacity: number | null;
  subjects: Subject[];
  isHomeroom: boolean;
  studentCount: number;
}

interface MyAssignmentsData {
  classes: ClassWithSubjects[];
  totalClasses: number;
  totalSubjects: number;
}

export default function TeacherMyClassesPage() {
  const router = useRouter();
  const [data, setData] = useState<MyAssignmentsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/teacher/my-assignments");
      const result = await res.json();

      if (!res.ok || !result.data) {
        throw new Error(result.error || "Failed to load assignments");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assignments");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-red-600">Error Loading Assignments</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!data || data.classes.length === 0) {
    return (
      <div className="text-center py-20">
        <School className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-gray-700">No Classes Assigned Yet</h2>
        <p className="text-gray-500 mb-6">
          You haven't been assigned to any classes or subjects yet.
          <br />
          Please contact your school administrator.
        </p>
        <Button variant="outline" asChild>
          <Link href="/teacher/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Classes & Subjects</h1>
            <p className="text-gray-500">
              {data.totalClasses} class{data.totalClasses !== 1 ? "es" : ""} • {data.totalSubjects} subject
              {data.totalSubjects !== 1 ? "s" : ""} assigned
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <School className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.totalClasses}</p>
                <p className="text-sm text-gray-500">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.totalSubjects}</p>
                <p className="text-sm text-gray-500">Subjects Teaching</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.classes.reduce((sum, cls) => sum + cls.studentCount, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.classes.map((cls) => (
          <Card
            key={cls.id}
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => router.push(`/teacher/classes/${cls.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      Grade {cls.grade} - Section {cls.section}
                    </CardTitle>
                    {cls.isHomeroom && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                        Homeroom
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {cls.studentCount} student{cls.studentCount !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {/* Quick Action Menu */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <TableQuickActions
                      actions={[
                        {
                          label: "View Students",
                          icon: <Users className="w-4 h-4" />,
                          onClick: () => router.push(`/teacher/students?classId=${cls.id}`),
                        },
                        {
                          label: "View Homework",
                          icon: <FileText className="w-4 h-4" />,
                          onClick: () => router.push(`/teacher/homework?classId=${cls.id}`),
                        },
                        {
                          label: "Take Attendance",
                          icon: <CheckCircle className="w-4 h-4" />,
                          onClick: () => router.push(`/teacher/attendance?classId=${cls.id}`),
                        },
                      ]}
                    />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Subjects */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <p className="text-xs font-medium text-gray-600">Subjects Teaching:</p>
                  </div>
                  {cls.subjects.length > 0 ? (
                    <div className="space-y-2">
                      {cls.subjects.map((subject) => (
                        <div
                          key={subject.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{subject.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {subject.code}
                            </Badge>
                            {subject.isPrimary && (
                              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No subjects assigned</p>
                  )}
                </div>

                {/* Class Info */}
                <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    <span>Room {cls.roomNumber || "TBD"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{cls.academicYear}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
