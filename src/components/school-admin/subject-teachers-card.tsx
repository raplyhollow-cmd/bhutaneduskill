/**
 * SUBJECT TEACHERS CARD
 *
 * Shows subjects for a class with assigned teachers
 * Includes button to manage assignments
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  Settings,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ManageSubjectTeachersModal } from "./manage-subject-teachers-modal";
import Link from "next/link";

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  employeeId: string | null;
}

interface SubjectTeacherAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  role: string;
  isPrimary: boolean;
  teacher: Teacher;
  subject: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  grade: number | null;
}

interface SubjectTeachersCardProps {
  classId: string;
  grade: number;
  initialSubjects: Subject[];
}

export function SubjectTeachersCard({
  classId,
  grade,
  initialSubjects,
}: SubjectTeachersCardProps) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [assignments, setAssignments] = useState<SubjectTeacherAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadAssignessments();
  }, [classId]);

  const loadAssignessments = async () => {
    try {
      const res = await fetch(`/api/school-admin/classes/${classId}/subject-teachers`);
      const result = await res.json();

      if (res.ok && result.data) {
        setSubjects(result.data.subjectsWithTeachers);
        // Flatten assignments
        const allAssignments: SubjectTeacherAssignment[] = [];
        result.data.subjectsWithTeachers.forEach((s: { id: string; name: string; assignedTeachers: SubjectTeacherAssignment[] }) => {
          s.assignedTeachers.forEach((a: SubjectTeacherAssignment) => {
            allAssignments.push(a);
          });
        });
        setAssignments(allAssignments);
      }
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Build a map of subject -> teachers
  const subjectTeacherMap = new Map<string, SubjectTeacherAssignment[]>();
  assignments.forEach((a) => {
    if (!subjectTeacherMap.has(a.subjectId)) {
      subjectTeacherMap.set(a.subjectId, []);
    }
    subjectTeacherMap.get(a.subjectId)!.push(a);
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Subjects & Teachers
              </CardTitle>
              <CardDescription>Grade {grade} curriculum</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="text-violet-600 border-violet-200 hover:bg-violet-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 mb-4">No subjects configured for this grade</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                  Add Subjects
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/school-admin/subjects">Manage Subjects</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((subject) => {
                const teachers = subjectTeacherMap.get(subject.id) || [];
                return (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{subject.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {subject.code}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {subject.type}
                        </Badge>
                      </div>
                      {teachers.length > 0 ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {teachers.map((t) => `${t.teacher.firstName} ${t.teacher.lastName}`).join(", ")}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">No teacher assigned</p>
                      )}
                    </div>
                    {teachers.length > 0 && (
                      <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                        {teachers.length} {teachers.length === 1 ? "teacher" : "teachers"}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ManageSubjectTeachersModal
        classId={classId}
        classInfo={{
          id: classId,
          name: null,
          grade,
          section: "",
          academicYear: null,
        }}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          loadAssignessments();
        }}
      />
    </>
  );
}
