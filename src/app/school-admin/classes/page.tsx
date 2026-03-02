/**
 * SCHOOL ADMIN - CLASSES MANAGEMENT
 *
 * Premium compact table view with full class detail slide-over
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Loader2,
  Check,
  X,
  Square,
  BookOpen,
  MapPin,
  Users,
  UserPlus,
  Settings,
  GraduationCap,
  ClipboardCheck,
  Calendar,
  Clock,
  Mail,
  Download,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BulkCreateClassesDropdown } from "@/components/school-admin/bulk-create-classes-dropdown";
import { ManageSubjectTeachersModal } from "@/components/school-admin/manage-subject-teachers-modal";
import { ClassesGrid } from "./components/classes-grid";

interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
  room: string;
  floor: string;
  capacity: number;
  teacherId: string | null;
  status: string;
  subjects?: string[];
  enrolled?: number;
  classTeacher?: string;
}

interface Teacher {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  employeeId: string | null;
}

interface Student {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  rollNumber?: string;
}

interface SubjectWithTeachers {
  id: string;
  name: string;
  code: string;
  type: string;
  grade: number | null;
  assignedTeachers: Array<{
    id: string;
    teacherId: string;
    teacher: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      employeeId: string | null;
    };
  }>;
}

export default function SchoolAdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
  const [showSubjectTeachersModal, setShowSubjectTeachersModal] = useState(false);
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
        // Fetch enrolled students for this class
        const res = await fetch(`/api/school-admin/classes/${classId}/students`);
        if (res.ok) {
          const data = await res.json();
          setClassStudents(data.data?.students || []);
        }
      } else if (slideOverTab === "subjects") {
        // Fetch subject assignments for this class
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
      // Fetch all students that are not enrolled in this class
      const res = await fetch(`/api/school-admin/students`);
      if (res.ok) {
        const data = await res.json();
        const allStudents = data.data?.students || [];
        // Filter out already enrolled students
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
        // Refresh student list
        await fetchClassDetailData(selectedClass.id);
        setSelectedStudentIds(new Set());
        setShowAddStudents(false);
        // Update enrolled count
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

  const grades = ["All", "PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  const filtered = classes.filter(c => {
    const m = searchQuery === "" ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.room?.toLowerCase().includes(searchQuery.toLowerCase());
    const g = gradeFilter === "All" || c.grade === gradeFilter;
    return m && g;
  });

  const toggle = (id: string) => {
    setSelectedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleAll = () => {
    setSelectedIds(s => s.size === filtered.length ? new Set() : new Set(filtered.map(c => c.id)));
  };

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

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
        if (selectedClass?.id === classId) {
          setSelectedClass(prev => prev ? { ...prev, teacherId } : null);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to assign teacher");
      }
    } catch (err) {
      console.error("Assign teacher error:", err);
      alert("Failed to assign teacher. Please try again.");
    } finally { setAssigningTeacher(null); }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const a = (firstName?.[0] || "") + (lastName?.[0] || "");
    return a.toUpperCase() || "T";
  };

  // Handle inline update from ClassesGrid
  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    // For now, just re-fetch - full implementation would need proper API endpoints
    await fetchClasses();
  };

  // For hierarchical view - map existing Class to expected format
  const classesForGrid = classes.map(c => ({
    ...c,
    roomNumber: c.room,
    classTeacherName: c.classTeacher,
    homeroomTeacherName: c.classTeacher,
    isActive: c.status === "active" || c.status === "Active",
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
      </div>
    );
  }

  const currentClassTeacher = selectedClass?.teacherId ? teachers.find(t => t.id === selectedClass.teacherId) : null;
  const filteredStudents = classStudents.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Classes</h1>
          <p className="text-xs text-gray-500">{classes.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <BulkCreateClassesDropdown />
          <Button size="sm" asChild className="h-8 bg-violet-600 hover:bg-violet-700 text-xs">
            <Link href="/school-admin/classes/create">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Class
            </Link>
          </Button>
        </div>
      </div>

      {/* Bulk Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg mb-3">
          <span className="text-sm font-medium text-violet-900">{selectedIds.size} selected</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs text-violet-700 hover:bg-violet-100" onClick={() => setSelectedIds(new Set())}>
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-violet-700 hover:bg-violet-100">
              <BookOpen className="w-3.5 h-3.5 mr-1" /> Assign Subject
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search classes..." className="pl-8 h-9 text-sm border-gray-200" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-[120px] h-9 text-sm border-gray-200">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            {grades.map(g => <SelectItem key={g} value={g}>{g === "All" ? "All Grades" : `Grade ${g}`}</SelectItem>)}
          </SelectContent>
        </Select>
        {filtered.length > 0 && (
          <button onClick={toggleAll} className="ml-auto flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            {allSelected ? <Check className="w-4 h-4 text-violet-600" /> : <Square className="w-4 h-4 text-gray-400" />}
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        )}
        <span className="text-xs text-gray-400">{filtered.length} of {classes.length}</span>
      </div>

      {/* Table */}
      <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden bg-white">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50/80 border-b border-gray-200 text-xs font-medium text-gray-500">
          <div className="col-span-1"></div>
          <div className="col-span-3">Class</div>
          <div className="col-span-3">Class Teacher</div>
          <div className="col-span-2">Room</div>
          <div className="col-span-2">Students</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              {searchQuery || gradeFilter !== "All" ? "No results found" : "No classes yet"}
            </div>
          ) : (
            filtered.map(cls => {
              const selected = selectedIds.has(cls.id);
              const currentTeacher = teachers.find(t => t.id === cls.teacherId);
              return (
                <div
                  key={cls.id}
                  className={cn(
                    "grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-sm transition-colors cursor-pointer group",
                    selected ? "bg-violet-50" : "hover:bg-gray-50"
                  )}
                  onClick={e => {
                    if (!(e.target as HTMLElement).closest("button") &&
                        !(e.target as HTMLElement).closest("select") &&
                        !(e.target as HTMLElement).closest("[data-stop-propagation]")) {
                      setSelectedClass(cls);
                    }
                  }}
                >
                  <div className="col-span-1" onClick={e => { e.stopPropagation(); toggle(cls.id); }} data-stop-propagation>
                    <div className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                      selected ? "bg-violet-600 border-violet-600" : "border-gray-300 group-hover:border-violet-400"
                    )}>
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{cls.name}</p>
                      <p className="text-xs text-gray-400">{cls.grade} - {cls.section}</p>
                    </div>
                  </div>
                  <div className="col-span-3" onClick={e => e.stopPropagation()}>
                    {assigningTeacher === cls.id ? (
                      <div className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                        <span className="text-xs text-gray-400">Assigning...</span>
                      </div>
                    ) : (
                      <Select
                        value={cls.teacherId || "none"}
                        onValueChange={(v) => assignTeacher(cls.id, v === "none" ? null : v)}
                      >
                        <SelectTrigger className={cn(
                          "h-7 text-xs border-gray-200 hover:border-violet-300 transition-colors",
                          !cls.teacherId && "text-gray-400"
                        )}>
                          <SelectValue>
                            {cls.teacherId && currentTeacher ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-4 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs">
                                  {getInitials(currentTeacher.firstName, currentTeacher.lastName)}
                                </div>
                                <span className="text-gray-700">{currentTeacher.name}</span>
                              </div>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-400">
                                <UserPlus className="w-3 h-3" /> Assign Teacher
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
                                <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs">
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
                  <div className="col-span-2 text-gray-600 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {cls.room || "-"}
                  </div>
                  <div className="col-span-2">
                    <span className={cn(
                      "text-xs font-medium",
                      (cls.enrolled || 0) >= cls.capacity ? "text-red-600" :
                      (cls.enrolled || 0) / cls.capacity >= 0.75 ? "text-yellow-600" : "text-green-600"
                    )}>
                      {cls.enrolled || 0}/{cls.capacity}
                    </span>
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-0.5">
                      <div className={cn(
                        "h-1 rounded-full",
                        (cls.enrolled || 0) >= cls.capacity ? "bg-red-500" :
                        (cls.enrolled || 0) / cls.capacity >= 0.75 ? "bg-yellow-500" : "bg-green-500"
                      )} style={{ width: `${Math.min(((cls.enrolled || 0) / cls.capacity) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      cls.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {cls.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Slide-over Panel */}
      {selectedClass && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setSelectedClass(null)}
          />

          {/* Panel - Wider for content */}
          <div className="fixed inset-y-0 right-0 w-[640px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedClass.name}</h2>
                <p className="text-sm text-gray-500">Grade {selectedClass.grade} - Section {selectedClass.section}</p>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-200 bg-gray-50">
              {[
                { id: "overview", label: "Overview", icon: Settings },
                { id: "students", label: "Students", icon: Users },
                { id: "subjects", label: "Subjects", icon: BookOpen },
                { id: "schedule", label: "Schedule", icon: Calendar },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSlideOverTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    slideOverTab === tab.id
                      ? "bg-violet-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {slideOverTab === "overview" && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{selectedClass.enrolled || 0}</p>
                          <p className="text-xs text-gray-500">Enrolled</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{selectedClass.subjects?.length || 0}</p>
                          <p className="text-xs text-gray-500">Subjects</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-lg font-semibold text-gray-900">-</p>
                          <p className="text-xs text-gray-500">Present Today</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="text-lg font-semibold text-gray-900">0</p>
                          <p className="text-xs text-gray-500">Homework</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Class Information */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Class Information</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Grade</p>
                        <p className="font-medium">{selectedClass.grade}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Section</p>
                        <p className="font-medium">{selectedClass.section}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Room</p>
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {selectedClass.room || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Capacity</p>
                        <p className="font-medium">{selectedClass.capacity}</p>
                      </div>
                    </div>
                  </div>

                  {/* Class Teacher */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Class Teacher</h3>
                      <button
                        onClick={() => setIsChangingTeacher(!isChangingTeacher)}
                        className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                      >
                        {isChangingTeacher ? "Cancel" : "Change"}
                      </button>
                    </div>
                    {isChangingTeacher ? (
                      <div className="space-y-2">
                        <Select
                          value={selectedClass.teacherId || "none"}
                          onValueChange={async (v) => {
                            await assignTeacher(selectedClass.id, v === "none" ? null : v);
                            setIsChangingTeacher(false);
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
                                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs">
                                    {getInitials(t.firstName, t.lastName)}
                                  </div>
                                  <span>{t.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {assigningTeacher === selectedClass.id && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Assigning teacher...
                          </div>
                        )}
                      </div>
                    ) : currentClassTeacher ? (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                          {getInitials(currentClassTeacher.firstName, currentClassTeacher.lastName)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{currentClassTeacher.name}</p>
                          <p className="text-sm text-gray-500">{currentClassTeacher.employeeId || "Teacher"}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No teacher assigned</p>
                        <button
                          onClick={() => setIsChangingTeacher(true)}
                          className="mt-2 text-xs text-violet-600 hover:text-violet-700 font-medium"
                        >
                          + Assign Teacher
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {slideOverTab === "students" && (
                <div className="space-y-4">
                  {/* Add Students Button */}
                  <div className="flex items-center justify-between">
                    <div className="relative flex-1 mr-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search students..."
                        className="pl-9 h-9 text-sm"
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowAddStudents(!showAddStudents);
                        // Fetch available students when opening
                        if (!showAddStudents) {
                          fetchAvailableStudents();
                        }
                      }}
                      className={cn(
                        "h-9 text-xs",
                        showAddStudents ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-violet-600 hover:bg-violet-700"
                      )}
                    >
                      {showAddStudents ? (
                        <>Cancel</>
                      ) : (
                        <><UserPlus className="w-3 h-3 mr-1" /> Add Students</>
                      )}
                    </Button>
                  </div>

                  {/* Bulk Add Panel */}
                  {showAddStudents && (
                    <div className="border-2 border-dashed border-violet-200 rounded-lg p-4 bg-violet-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-900">
                          {selectedStudentIds.size} student{selectedStudentIds.size !== 1 ? "s" : ""} selected
                        </p>
                        <div className="flex items-center gap-2">
                          {selectedStudentIds.size > 0 && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
                              onClick={() => bulkAddStudents()}
                            >
                              Add Selected
                            </Button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedStudentIds(new Set());
                              setShowAddStudents(false);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {availableStudents.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-4">No available students</p>
                        ) : (
                          availableStudents.map((student) => {
                            const isSelected = selectedStudentIds.has(student.id);
                            return (
                              <div
                                key={student.id}
                                onClick={() => {
                                  setSelectedStudentIds(prev => {
                                    const next = new Set(prev);
                                    next.has(student.id) ? next.delete(student.id) : next.add(student.id);
                                    return next;
                                  });
                                }}
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded cursor-pointer transition-colors",
                                  isSelected ? "bg-violet-100" : "hover:bg-gray-100"
                                )}
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded border-2 flex items-center justify-center",
                                  isSelected ? "bg-violet-600 border-violet-600" : "border-gray-300"
                                )}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {getInitials(student.firstName, student.lastName)}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {student.firstName} {student.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{student.email || "No email"}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Student List */}
                  {loadingTabData ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        {studentSearch ? "No students found" : "No students enrolled yet"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredStudents.map((student, idx) => {
                        const isRemoving = removingStudentIds.has(student.id);
                        return (
                          <div key={student.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 group">
                            <span className="text-xs text-gray-400 w-6">{idx + 1}</span>
                            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
                              <span className="text-violet-600 text-sm font-medium">
                                {getInitials(student.firstName, student.lastName)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{student.email || "No email"}</p>
                            </div>
                            {student.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="w-3 h-3" />
                                {student.phone}
                              </div>
                            )}
                            <button
                              onClick={() => removeStudent(student.id)}
                              disabled={isRemoving}
                              className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                            >
                              {isRemoving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {slideOverTab === "subjects" && (
                <div className="space-y-4">
                  {/* Header with action button */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Subject Teachers</h3>
                      <p className="text-xs text-gray-500">
                        {classSubjects.reduce((sum, s) => sum + s.assignedTeachers.length, 0)} teacher
                        {classSubjects.reduce((sum, s) => sum + s.assignedTeachers.length, 0) !== 1 ? "s" : ""} assigned
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowSubjectTeachersModal(true)}
                      className="h-8 text-xs bg-violet-600 hover:bg-violet-700"
                    >
                      <UserPlus className="w-3 h-3 mr-1" /> Manage
                    </Button>
                  </div>

                  {loadingTabData ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : classSubjects.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No subjects configured for this grade</p>
                      <p className="text-xs text-gray-400 mt-2">Add subjects for Grade {selectedClass.grade} first</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {classSubjects.map((subject) => (
                        <div key={subject.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-violet-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500">{subject.code}</span>
                                  <span className="text-xs text-gray-300">•</span>
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{subject.type}</span>
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={subject.assignedTeachers.length > 0 ? "default" : "secondary"}
                              className={cn(
                                "text-xs",
                                subject.assignedTeachers.length > 0
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-gray-100 text-gray-500"
                              )}
                            >
                              {subject.assignedTeachers.length > 0
                                ? `${subject.assignedTeachers.length} assigned`
                                : "Unassigned"}
                            </Badge>
                          </div>
                          {subject.assignedTeachers.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                              {subject.assignedTeachers.map((assignment) => (
                                <div
                                  key={assignment.id}
                                  className="flex items-center gap-1.5 px-2 py-1 bg-violet-50 rounded-md"
                                >
                                  <div className="w-5 h-5 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 text-xs font-medium">
                                    {assignment.teacher.firstName?.[0]}
                                    {assignment.teacher.lastName?.[0]}
                                  </div>
                                  <span className="text-xs text-gray-700">
                                    {assignment.teacher.firstName} {assignment.teacher.lastName}
                                  </span>
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
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Weekly Schedule</h3>
                    <div className="space-y-2">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                        <div key={day} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700 w-24">{day}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>8:00 AM - 2:00 PM</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700">6 Periods</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Homework</h3>
                    <div className="text-center py-6">
                      <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No homework assigned yet</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  <Mail className="w-3 h-3 mr-1" /> Email
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  <Download className="w-3 h-3 mr-1" /> Export
                </Button>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Subject Teachers Modal */}
      {selectedClass && (
        <ManageSubjectTeachersModal
          classId={selectedClass.id}
          classInfo={{
            id: selectedClass.id,
            name: selectedClass.name,
            grade: parseInt(selectedClass.grade) || 0,
            section: selectedClass.section,
            academicYear: null,
          }}
          isOpen={showSubjectTeachersModal}
          onClose={() => {
            setShowSubjectTeachersModal(false);
            fetchClassDetailData(selectedClass.id);
          }}
          onSuccess={() => {
            setShowSubjectTeachersModal(false);
            fetchClassDetailData(selectedClass.id);
          }}
        />
      )}
    </div>
  );
}