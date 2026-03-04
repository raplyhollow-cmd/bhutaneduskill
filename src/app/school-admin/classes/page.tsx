/**
 * SCHOOL ADMIN - CLASSES MANAGEMENT
 *
 * Using GoogleDataTable for modern, intelligent data management
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Users,
  MapPin,
  BookOpen,
  UserPlus,
  GraduationCap,
  ClipboardCheck,
  Calendar,
  Settings,
  Edit,
  Trash2,
  Eye,
  UserMinus,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { InlineEdit } from "@/components/ui/inline-edit";
import { BulkCreateClassesDropdown } from "@/components/school-admin/bulk-create-classes-dropdown";
import { GoogleDataTable, GoogleColumn, GoogleAction } from "@/components/admin/google-data-table";
import { SlideOverPanel, SlideOverSection } from "@/components/admin/slide-over-panel";

interface Class {
  id: string;
  name: string;
  grade: number;
  section: string;
  roomNumber: string;
  capacity: number;
  classTeacherId: string | null;
  classTeacherName: string;
  academicYear: string;
  isActive: boolean;
  enrolled?: number;
  subjects?: string;
  status?: "active" | "inactive";
}

interface Teacher {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  employeeId: string | null;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
}

interface SubjectWithTeachers {
  id: string;
  name: string;
  code: string;
  teachers: Array<{
    id: string;
    name: string;
    role: string;
    isPrimary: boolean;
  }>;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningTeacher, setAssigningTeacher] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [slideOverTab, setSlideOverTab] = useState<"overview" | "students" | "subjects" | "schedule">("overview");

  // Slide-over data
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [classSubjects, setClassSubjects] = useState<SubjectWithTeachers[]>([]);
  const [loadingTabData, setLoadingTabData] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isChangingTeacher, setIsChangingTeacher] = useState(false);
  const [removingStudentIds, setRemovingStudentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([fetchClasses(), fetchTeachers()]);
  }, []);

  // Fetch class detail data when slide-over opens
  useEffect(() => {
    if (selectedClass) {
      fetchClassDetailData(selectedClass.id);
    }
  }, [selectedClass, slideOverTab]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/school-admin/classes");
      const data = await res.json();
      if (res.ok) {
        setClasses(data.data?.classes || []);
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/school-admin/teachers");
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.data?.teachers || []);
      }
    } catch {}
  };

  const fetchClassDetailData = async (classId: string) => {
    setLoadingTabData(true);
    try {
      if (slideOverTab === "students") {
        const res = await fetch(`/api/school-admin/classes/${classId}/students`);
        if (res.ok) {
          const data = await res.json();
          setClassStudents(data.data?.students || []);
        }
      } else if (slideOverTab === "subjects") {
        const res = await fetch(`/api/school-admin/classes/${classId}/subject-teachers`);
        if (res.ok) {
          const data = await res.json();
          setClassSubjects(data.data?.subjectsWithTeachers || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch class detail data:", err);
    } finally {
      setLoadingTabData(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const res = await fetch(`/api/school-admin/students`);
      if (res.ok) {
        const data = await res.json();
        const allStudents = data.data?.students || [];
        const enrolledIds = classStudents.map(s => s.id);
        setAvailableStudents(allStudents.filter((s: Student) => !enrolledIds.includes(s.id)));
      }
    } catch (err) {
      console.error("Failed to fetch available students:", err);
    }
  };

  const bulkAddStudents = async () => {
    if (selectedStudentIds.size === 0 || !selectedClass) return;
    try {
      const res = await fetch(`/api/school-admin/classes/${selectedClass.id}/students/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(selectedStudentIds) }),
      });
      if (res.ok) {
        await fetchClassDetailData(selectedClass.id);
        setSelectedStudentIds(new Set());
        setShowAddStudents(false);
        await fetchClasses();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add students");
      }
    } catch (err) {
      console.error("Failed to add students:", err);
      alert("Failed to add students. Please try again.");
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!selectedClass) return;
    if (!confirm("Remove this student from the class?")) return;

    setRemovingStudentIds(prev => new Set(prev).add(studentId));
    try {
      const res = await fetch(`/api/school-admin/classes/${selectedClass.id}/students/${studentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchClassDetailData(selectedClass.id);
        await fetchClasses();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove student");
      }
    } catch (err) {
      console.error("Failed to remove student:", err);
      alert("Failed to remove student. Please try again.");
    } finally {
      setRemovingStudentIds(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  const assignTeacher = async (classId: string, teacherId: string | null) => {
    setAssigningTeacher(classId);
    try {
      const res = await fetch(`/api/school-admin/classes/${classId}/assign-teacher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      if (res.ok) {
        await fetchClasses();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to assign teacher");
      }
    } catch (err) {
      console.error("Assign teacher error:", err);
      alert("Failed to assign teacher. Please try again.");
    } finally {
      setAssigningTeacher(null);
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const a = (firstName?.[0] || "") + (lastName?.[0] || "");
    return a.toUpperCase() || "T";
  };

  const handleDeleteClass = async (cls: Class) => {
    if (!confirm(`Delete ${cls.name}? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/school-admin/classes/${cls.id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchClasses();
      } else {
        alert("Failed to delete class");
      }
    } catch {
      alert("Failed to delete class");
    }
  };

  const saveClassName = async (classId: string, newName: string): Promise<void> => {
    try {
      const response = await fetch(`/api/school-admin/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to update class name");
      }

      setClasses((prev) =>
        prev.map((c) => (c.id === classId ? { ...c, name: newName } : c))
      );
    } catch (error) {
      console.error("Failed to update class name:", error);
      throw error;
    }
  };

  const saveCapacity = async (classId: string, newCapacity: string): Promise<void> => {
    try {
      const capacityNum = parseInt(newCapacity);
      if (isNaN(capacityNum) || capacityNum < 1) {
        throw new Error("Capacity must be a valid number");
      }

      const response = await fetch(`/api/school-admin/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity: capacityNum }),
      });

      if (!response.ok) {
        throw new Error("Failed to update class capacity");
      }

      setClasses((prev) =>
        prev.map((c) => (c.id === classId ? { ...c, capacity: capacityNum } : c))
      );
    } catch (error) {
      console.error("Failed to update class capacity:", error);
      throw error;
    }
  };

  // Column definitions for GoogleDataTable
  const columns: GoogleColumn<Class>[] = [
    {
      id: "name",
      label: "Class",
      width: "200px",
      sortable: true,
      filterable: true,
      editable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br from-violet-500 to-purple-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <InlineEdit
              value={row.name}
              onSave={(val) => saveClassName(row.id, val)}
              placeholder="Class name"
              className="font-medium text-gray-900"
            />
            <p className="text-xs text-gray-400">{row.grade} - {row.section}</p>
          </div>
        </div>
      ),
    },
    {
      id: "classTeacherName",
      label: "Class Teacher",
      width: "200px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <div className="flex items-center">
          {assigningTeacher === row.id ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <span className="text-xs text-gray-400">Assigning...</span>
            </div>
          ) : (
            <Select
              value={row.classTeacherId || "none"}
              onValueChange={(v) => assignTeacher(row.id, v === "none" ? null : v)}
            >
              <SelectTrigger className={cn(
                "h-8 text-xs border-gray-200 hover:border-violet-300 transition-colors w-full",
                !row.classTeacherId && "text-gray-400"
              )}>
                <SelectValue>
                  {row.classTeacherId && row.classTeacherName !== "Not Assigned" ? (
                    <div className="flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-violet-600" />
                      <span className="text-gray-700">{row.classTeacherName}</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400">
                      <UserPlus className="w-3.5 h-3.5" /> Assign Teacher
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-gray-400 italic">— No teacher —</span>
                </SelectItem>
                {teachers.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs">
                        {getInitials(t.firstName, t.lastName)}
                      </div>
                      <span>{t.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ),
    },
    {
      id: "roomNumber",
      label: "Room",
      width: "120px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-gray-600 text-sm">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          {row.roomNumber || "—"}
        </div>
      ),
    },
    {
      id: "enrollment",
      label: "Enrollment",
      width: "140px",
      sortable: true,
      render: (row) => {
        const enrolled = row.enrolled || 0;
        const capacity = row.capacity;
        const percentage = capacity > 0 ? (enrolled / capacity) * 100 : 0;
        const isFull = enrolled >= capacity;
        const isNearFull = percentage >= 75;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-600">{enrolled}/</span>
              <InlineEdit
                value={String(capacity)}
                onSave={async (val) => {
                  try {
                    await saveCapacity(row.id, val);
                  } catch (error) {
                    alert((error as Error).message);
                  }
                }}
                placeholder="Cap"
                className="text-xs font-medium w-10"
              />
            </div>
            <div className={cn(
              "w-full bg-gray-100 rounded-full h-1.5",
              isFull ? "bg-red-100" : isNearFull ? "bg-yellow-100" : "bg-green-100"
            )}>
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  isFull ? "bg-red-500" : isNearFull ? "bg-yellow-500" : "bg-green-500"
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: "status",
      label: "Status",
      width: "100px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            row.status === "active" || row.isActive
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-500 border-gray-200"
          )}
        >
          {row.status === "active" || row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  // Row actions
  const actions: GoogleAction<Class>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4 mr-2" />,
      onClick: (row) => setSelectedClass(row),
    },
    {
      label: "Edit",
      icon: <Edit className="w-4 h-4 mr-2" />,
      onClick: (row) => {
        window.location.href = `/school-admin/classes/${row.id}`;
      },
    },
    {
      label: "Manage Students",
      icon: <Users className="w-4 h-4 mr-2" />,
      onClick: (row) => {
        setSelectedClass(row);
        setSlideOverTab("students");
      },
    },
    {
      label: "",
      icon: null,
      onClick: () => {},
      separator: true,
    } as GoogleAction<Class>,
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4 mr-2" />,
      onClick: handleDeleteClass,
      variant: "danger",
    },
  ];

  const currentClassTeacher = selectedClass?.classTeacherId
    ? teachers.find(t => t.id === selectedClass.classTeacherId)
    : null;

  const filteredStudents = classStudents.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* GoogleDataTable */}
      <GoogleDataTable<Class>
        data={classes}
        columns={columns}
        keyField="id"
        isLoading={loading}
        title="Classes"
        subtitle={`${classes.length} total classes`}
        actions={actions}
        onCreate={() => {
          window.location.href = "/school-admin/classes/create";
        }}
        onRowClick={(row) => setSelectedClass(row)}
        onUpdate={async (id, field, value) => {
          try {
            if (field === "name") {
              await saveClassName(id, value);
            } else if (field === "capacity") {
              await saveCapacity(id, value);
            }
          } catch (error) {
            alert((error as Error).message || "Failed to update");
          }
        }}
        emptyState={
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No classes yet</p>
            <Button
              size="sm"
              asChild
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Link href="/school-admin/classes/create">
                <Plus className="w-4 h-4 mr-2" /> Create First Class
              </Link>
            </Button>
          </div>
        }
        toolbar={
          <BulkCreateClassesDropdown />
        }
      />

      {/* Slide-over Panel */}
      <SlideOverPanel
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        title={selectedClass?.name || ""}
        subtitle={`Grade ${selectedClass?.grade} - Section ${selectedClass?.section}`}
        tabs={[
          { id: "overview", label: "Overview", icon: <Settings className="w-4 h-4" /> },
          { id: "students", label: "Students", icon: <Users className="w-4 h-4" /> },
          { id: "subjects", label: "Subjects", icon: <BookOpen className="w-4 h-4" /> },
          { id: "schedule", label: "Schedule", icon: <Calendar className="w-4 h-4" /> },
        ]}
        activeTab={slideOverTab}
        onTabChange={(tab) => setSlideOverTab(tab as any)}
        isLoading={loadingTabData}
        width="xl"
      >
        {slideOverTab === "overview" && (
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{selectedClass?.enrolled || 0}</p>
                    <p className="text-sm text-gray-500">Enrolled Students</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{selectedClass?.subjects?.length || 0}</p>
                    <p className="text-sm text-gray-500">Subjects</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">—</p>
                    <p className="text-sm text-gray-500">Present Today</p>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-500">Homework Assigned</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Class Information */}
            <SlideOverSection title="Class Information">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Grade</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedClass?.grade}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Section</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedClass?.section}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Room Number</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" /> {selectedClass?.roomNumber || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Capacity</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedClass?.capacity} students</p>
                </div>
              </div>
            </SlideOverSection>

            {/* Class Teacher */}
            <SlideOverSection title="Class Teacher">
              {isChangingTeacher ? (
                <div className="space-y-3">
                  <Select
                    value={selectedClass?.classTeacherId || "none"}
                    onValueChange={async (v) => {
                      if (selectedClass) {
                        await assignTeacher(selectedClass.id, v === "none" ? null : v);
                        setIsChangingTeacher(false);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-gray-400 italic">— No teacher —</span>
                      </SelectItem>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs">
                              {getInitials(t.firstName, t.lastName)}
                            </div>
                            <span>{t.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assigningTeacher === selectedClass?.id && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning teacher...
                    </div>
                  )}
                </div>
              ) : currentClassTeacher ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-medium bg-gradient-to-br from-violet-500 to-purple-600">
                    {getInitials(currentClassTeacher.firstName, currentClassTeacher.lastName)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{currentClassTeacher.name}</p>
                    <p className="text-sm text-gray-500">{currentClassTeacher.employeeId || "Teacher"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsChangingTeacher(true)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">No teacher assigned</p>
                  <Button
                    size="sm"
                    onClick={() => setIsChangingTeacher(true)}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Assign Teacher
                  </Button>
                </div>
              )}
            </SlideOverSection>
          </div>
        )}

        {slideOverTab === "students" && (
          <div className="p-6 space-y-4">
            {/* Search and Add */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  setShowAddStudents(!showAddStudents);
                  if (!showAddStudents) {
                    fetchAvailableStudents();
                  }
                }}
                variant={showAddStudents ? "outline" : "default"}
                className={showAddStudents ? "" : "bg-violet-600 hover:bg-violet-700"}
              >
                {showAddStudents ? (
                  <>Cancel</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> Add Students</>
                )}
              </Button>
            </div>

            {/* Bulk Add Panel */}
            {showAddStudents && (
              <div className="border-2 border-dashed border-violet-200 rounded-xl p-4 bg-violet-50/50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedStudentIds.size} student{selectedStudentIds.size !== 1 ? "s" : ""} selected
                  </p>
                  <div className="flex items-center gap-2">
                    {selectedStudentIds.size > 0 && (
                      <Button
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700"
                        onClick={bulkAddStudents}
                      >
                        Add Selected
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {availableStudents.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No available students</p>
                  ) : (
                    availableStudents.map((student) => {
                      const isSelected = selectedStudentIds.has(student.id);
                      return (
                        <div
                          key={student.id}
                          onClick={() => {
                            const newSet = new Set(selectedStudentIds);
                            if (isSelected) {
                              newSet.delete(student.id);
                            } else {
                              newSet.add(student.id);
                            }
                            setSelectedStudentIds(newSet);
                          }}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                            isSelected ? "bg-violet-100" : "hover:bg-gray-50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-violet-600 rounded"
                          />
                          <span className="text-sm">{student.firstName} {student.lastName}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Students List */}
            {loadingTabData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {studentSearch ? "No students found" : "No students enrolled yet"}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredStudents.map((student) => {
                  const isRemoving = removingStudentIds.has(student.id);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-medium">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{student.admissionNumber}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeStudent(student.id)}
                        disabled={isRemoving}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {isRemoving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <><UserMinus className="w-4 h-4 mr-1" /> Remove</>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {slideOverTab === "subjects" && (
          <div className="p-6">
            {loadingTabData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
              </div>
            ) : classSubjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No subjects assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {classSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-violet-200 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{subject.name}</p>
                        <p className="text-xs text-gray-500">{subject.code}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {subject.teachers.length} teacher{subject.teachers.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    {subject.teachers.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        {subject.teachers.map((teacher) => (
                          <div
                            key={teacher.id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-violet-100 text-violet-700 text-xs"
                          >
                            <span>{teacher.name}</span>
                            {teacher.isPrimary && (
                              <span className="text-amber-600">★</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {slideOverTab === "schedule" && (
          <div className="p-6">
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Schedule feature coming soon</p>
            </div>
          </div>
        )}
      </SlideOverPanel>
    </div>
  );
}
