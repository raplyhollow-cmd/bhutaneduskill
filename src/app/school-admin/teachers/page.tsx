/**
 * SCHOOL ADMIN - TEACHERS MANAGEMENT
 *
 * Modern UX with:
 * - GoogleDataTable component
 * - SlideOverPanel for teacher details
 * - Inline editing for key fields
 * - Avatar display with gradients
 * - Status badges
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Sparkles,
  Mail,
  Phone,
  User,
  BookOpen,
  Calendar,
  GraduationCap,
  Edit,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { AddTeacherModal } from "@/components/school-admin/add-teacher-modal";
import { ExpressAddModal, useExpressAdd } from "@/components/ui/express-add-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  GoogleDataTable,
  GoogleColumn,
  GoogleAction,
} from "@/components/admin/google-data-table";
import {
  SlideOverPanel,
  SlideOverSection,
} from "@/components/admin/slide-over-panel";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// ============================================================================
// Types
// ============================================================================

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  employeeId: string | null;
  subjects: string[] | null;
  department?: string;
  isActive: boolean;
  onLeave?: boolean;
  classGrade?: string | null;
  section?: string | null;
  qualification?: string | null;
  experience?: number | null;
  joinedDate?: string | null;
  address?: string | null;
  bio?: string | null;
}

interface TeacherDetail extends Teacher {
  assignedClasses?: ClassAssignment[];
  schedule?: ScheduleItem[];
}

interface ClassAssignment {
  id: string;
  classId: string;
  className: string;
  subject: string;
  isPrimary: boolean;
}

interface ScheduleItem {
  id: string;
  day: string;
  period: number;
  subject: string;
  class: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getInitials = (firstName: string | null, lastName: string | null): string => {
  const first = firstName?.[0] || "";
  const last = lastName?.[0] || "";
  return (first + last).toUpperCase() || "T";
};

const getAvatarGradient = (firstName: string | null, lastName: string | null): string => {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-indigo-500 to-blue-600",
  ];
  const index = (firstName?.[0]?.charCodeAt(0) || 0) % colors.length;
  return colors[index];
};

const getDepartmentColor = (dept: string | undefined): string => {
  const colors: Record<string, string> = {
    Science: "bg-blue-100 text-blue-700",
    Mathematics: "bg-emerald-100 text-emerald-700",
    English: "bg-amber-100 text-amber-700",
    Dzongkha: "bg-rose-100 text-rose-700",
    "Social Studies": "bg-orange-100 text-orange-700",
    ICT: "bg-purple-100 text-purple-700",
    General: "bg-gray-100 text-gray-700",
  };
  return colors[dept || ""] || "bg-gray-100 text-gray-700";
};

// ============================================================================
// Main Page Component
// ============================================================================

export default function SchoolAdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherDetail | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editValue, setEditValue] = useState("");

  const quickAdd = useExpressAdd();

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Fetch teachers from API
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/school-admin/teachers");
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.data?.teachers || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick add teacher
  const handleQuickAdd = async (name: string): Promise<{ success: true } | { success: false; error: string }> => {
    const [first, ...rest] = name.trim().split(" ");
    const last = rest.join(" ") || "";
    const res = await fetch("/api/school-admin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: first,
        lastName: last || "Teacher",
        email: `${first.toLowerCase()}${last ? "." + last.toLowerCase() : ""}@school.edu`,
        phone: "",
        employeeId: `TCH${Date.now().toString().slice(-4)}`,
        department: "General",
        subjects: [],
      }),
    });
    if (res.ok) {
      await fetchTeachers();
      return { success: true };
    }
    const d = await res.json();
    return { success: false, error: d.error || "Failed to add teacher" };
  };

  // Get unique departments
  const departments = useMemo(() => {
    return Array.from(new Set(teachers.map((t) => t.department).filter(Boolean)));
  }, [teachers]);

  // Update teacher field
  const updateTeacherField = async (
    teacherId: string,
    field: string,
    value: string
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/school-admin/teachers/${teacherId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) throw new Error("Failed to update");

      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, [field]: value } : t))
      );

      if (selectedTeacher?.id === teacherId) {
        setSelectedTeacher((prev) => (prev ? { ...prev, [field]: value } : null));
      }
    } catch (error) {
      console.error("Failed to update teacher:", error);
      throw error;
    }
  };

  // Toggle teacher active status
  const toggleTeacherStatus = async (teacher: Teacher, active: boolean) => {
    await updateTeacherField(teacher.id, "isActive", active.toString());
  };

  // Delete teacher
  const deleteTeacher = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/school-admin/teachers/${teacherId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
        setSlideOverOpen(false);
      }
    } catch (error) {
      console.error("Failed to delete teacher:", error);
    }
  };

  // ============================================================================
  // Data Grid Columns
  // ============================================================================

  const columns: GoogleColumn<Teacher>[] = [
    {
      id: "name",
      label: "Teacher",
      width: "200px",
      sortable: true,
      filterable: true,
      render: (teacher) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm bg-gradient-to-br",
              getAvatarGradient(teacher.firstName, teacher.lastName)
            )}
          >
            {getInitials(teacher.firstName, teacher.lastName)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{teacher.name}</p>
            <p className="text-xs text-gray-500 font-mono">{teacher.employeeId || "-"}</p>
          </div>
        </div>
      ),
    },
    {
      id: "email",
      label: "Email",
      width: "220px",
      sortable: true,
      filterable: true,
      render: (teacher) => (
        <div className="flex items-center gap-1.5 text-gray-600 text-sm">
          <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="truncate">{teacher.email || "-"}</span>
        </div>
      ),
    },
    {
      id: "phone",
      label: "Phone",
      width: "160px",
      filterable: true,
      render: (teacher) => (
        <div className="flex items-center gap-1.5 text-gray-600 text-sm">
          <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          {teacher.phone ? (
            <span className="truncate">{teacher.phone}</span>
          ) : (
            <InlineEdit
              value=""
              onSave={(value) => updateTeacherField(teacher.id, "phone", value)}
              placeholder="Add phone"
              className="text-gray-400"
            />
          )}
        </div>
      ),
    },
    {
      id: "department",
      label: "Department",
      width: "130px",
      sortable: true,
      filterable: true,
      render: (teacher) => (
        <Badge
          variant="outline"
          className={cn("font-normal", getDepartmentColor(teacher.department))}
        >
          {teacher.department || "General"}
        </Badge>
      ),
    },
    {
      id: "subjects",
      label: "Subjects",
      width: "160px",
      filterable: true,
      render: (teacher) => (
        <div className="flex flex-wrap gap-1">
          {teacher.subjects && teacher.subjects.length > 0 ? (
            teacher.subjects.slice(0, 2).map((subject, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {subject}
              </Badge>
            ))
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
          {teacher.subjects && teacher.subjects.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{teacher.subjects.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "status",
      label: "Status",
      width: "110px",
      sortable: true,
      filterable: true,
      render: (teacher) => (
        <Badge
          variant="outline"
          className={cn(
            "font-normal",
            teacher.isActive && !teacher.onLeave
              ? "bg-green-50 text-green-700 border-green-200"
              : teacher.onLeave
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-gray-100 text-gray-500"
          )}
        >
          {teacher.onLeave ? "On Leave" : teacher.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  // ============================================================================
  // Data Grid Actions
  // ============================================================================

  const actions: GoogleAction<Teacher>[] = [
    {
      label: "View Details",
      icon: <User className="w-4 h-4 mr-2" />,
      onClick: (teacher) => {
        setSelectedTeacher(teacher as TeacherDetail);
        setActiveTab("overview");
        setSlideOverOpen(true);
      },
    },
    {
      label: "Edit Profile",
      icon: <Edit className="w-4 h-4 mr-2" />,
      onClick: (teacher) => {
        setSelectedTeacher(teacher as TeacherDetail);
        setActiveTab("overview");
        setSlideOverOpen(true);
      },
    },
    {
      label: "",
      icon: null,
      onClick: () => {},
      separator: true,
    } as GoogleAction<Teacher>,
    {
      label: "Mark Active",
      icon: <UserCheck className="w-4 h-4 mr-2" />,
      onClick: (teacher: Teacher) => toggleTeacherStatus(teacher, true),
    },
    {
      label: "Mark Inactive",
      icon: <UserX className="w-4 h-4 mr-2" />,
      onClick: (teacher: Teacher) => toggleTeacherStatus(teacher, false),
    },
    {
      label: "",
      icon: null,
      onClick: () => {},
      separator: true,
    } as GoogleAction<Teacher>,
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4 mr-2" />,
      onClick: (teacher) => {
        setSelectedTeacher(teacher as TeacherDetail);
        setDeleteDialog(true);
      },
      variant: "danger",
    },
  ];

  // ============================================================================
  // Tabs for Slide-over Panel
  // ============================================================================

  const tabs = [
    { id: "overview", label: "Overview", icon: <User className="w-4 h-4" /> },
    { id: "subjects", label: "Subjects", icon: <BookOpen className="w-4 h-4" /> },
    { id: "schedule", label: "Schedule", icon: <Calendar className="w-4 h-4" /> },
    { id: "classes", label: "Classes", icon: <GraduationCap className="w-4 h-4" /> },
  ];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Teachers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {teachers.length} {teachers.length === 1 ? "teacher" : "teachers"} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={quickAdd.open}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Quick Add
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Google Data Table */}
      <GoogleDataTable
        data={teachers}
        columns={columns}
        keyField="id"
        isLoading={loading}
        actions={actions}
        onUpdate={updateTeacherField}
        emptyState={
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No teachers yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Add your first teacher to get started
            </p>
            <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Teacher
            </Button>
          </div>
        }
      />

      {/* Slide-over Panel for Teacher Details */}
      <SlideOverPanel
        isOpen={slideOverOpen}
        onClose={() => {
          setSlideOverOpen(false);
          setSelectedTeacher(null);
        }}
        title={selectedTeacher?.name || "Teacher Details"}
        subtitle={selectedTeacher?.employeeId || ""}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        width="lg"
        actions={
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        }
      >
        {selectedTeacher && (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Profile Section */}
                <SlideOverSection title="Profile Information">
                  <div className="flex items-start gap-6 mb-6">
                    <div
                      className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg bg-gradient-to-br",
                        getAvatarGradient(selectedTeacher.firstName, selectedTeacher.lastName)
                      )}
                    >
                      {getInitials(selectedTeacher.firstName, selectedTeacher.lastName)}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">First Name</Label>
                          <InlineEdit
                            value={selectedTeacher.firstName || ""}
                            onSave={(value) =>
                              updateTeacherField(selectedTeacher.id, "firstName", value)
                            }
                            placeholder="First name"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Last Name</Label>
                          <InlineEdit
                            value={selectedTeacher.lastName || ""}
                            onSave={(value) =>
                              updateTeacherField(selectedTeacher.id, "lastName", value)
                            }
                            placeholder="Last name"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Email</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {selectedTeacher.email || "-"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Phone</Label>
                      <InlineEdit
                        value={selectedTeacher.phone || ""}
                        onSave={(value) =>
                          updateTeacherField(selectedTeacher.id, "phone", value)
                        }
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Employee ID</Label>
                      <InlineEdit
                        value={selectedTeacher.employeeId || ""}
                        onSave={(value) =>
                          updateTeacherField(selectedTeacher.id, "employeeId", value)
                        }
                        placeholder="Employee ID"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Department</Label>
                      <Select
                        value={selectedTeacher.department || "General"}
                        onValueChange={(value) =>
                          updateTeacherField(selectedTeacher.id, "department", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Dzongkha">Dzongkha</SelectItem>
                          <SelectItem value="Social Studies">Social Studies</SelectItem>
                          <SelectItem value="ICT">ICT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SlideOverSection>

                {/* Employment Details */}
                <SlideOverSection
                  title="Employment Details"
                  description="Work-related information"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Qualification</Label>
                      <InlineEdit
                        value={selectedTeacher.qualification || ""}
                        onSave={(value) =>
                          updateTeacherField(selectedTeacher.id, "qualification", value)
                        }
                        placeholder="Highest qualification"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Experience (years)</Label>
                      <InlineEdit
                        type="number"
                        value={String(selectedTeacher.experience || "")}
                        onSave={(value) =>
                          updateTeacherField(selectedTeacher.id, "experience", value)
                        }
                        placeholder="Years of experience"
                      />
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div>
                    <Label className="text-xs text-gray-500">Bio / Notes</Label>
                    <Textarea
                      value={selectedTeacher.bio || ""}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => {
                        if (editValue !== (selectedTeacher.bio || "")) {
                          updateTeacherField(selectedTeacher.id, "bio", editValue);
                        }
                      }}
                      placeholder="Add notes about this teacher..."
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                </SlideOverSection>

                {/* Status */}
                <SlideOverSection title="Status">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Account Status</p>
                      <p className="text-xs text-gray-500">
                        Control teacher access to the system
                      </p>
                    </div>
                    <Select
                      value={selectedTeacher.isActive ? "active" : "inactive"}
                      onValueChange={(value) =>
                        updateTeacherField(
                          selectedTeacher.id,
                          "isActive",
                          value === "active" ? "true" : "false"
                        )
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Active
                          </span>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            Inactive
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </SlideOverSection>
              </div>
            )}

            {/* Subjects Tab */}
            {activeTab === "subjects" && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Assigned Subjects
                    </h3>
                    <p className="text-sm text-gray-500">
                      Manage subjects taught by this teacher
                    </p>
                  </div>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subject
                  </Button>
                </div>

                {selectedTeacher.subjects && selectedTeacher.subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.subjects.map((subject, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-1">No subjects assigned</p>
                    <p className="text-sm text-gray-400">
                      Add subjects to track teacher workload
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === "schedule" && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    View and manage class schedule
                  </p>
                </div>

                {/* Week schedule grid */}
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-1">No schedule configured</p>
                  <p className="text-sm text-gray-400">
                    Schedule will be managed through the timetable module
                  </p>
                </div>
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === "classes" && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Class Assignments
                    </h3>
                    <p className="text-sm text-gray-500">
                      Classes this teacher is assigned to
                    </p>
                  </div>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Class
                  </Button>
                </div>

                {selectedTeacher.classGrade ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Class {selectedTeacher.classGrade}
                          {selectedTeacher.section && ` - ${selectedTeacher.section}`}
                        </p>
                        <p className="text-sm text-gray-500">Homeroom Teacher</p>
                      </div>
                      <Badge variant="outline">Primary</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-1">No classes assigned</p>
                    <p className="text-sm text-gray-400">
                      Assign this teacher to a class as homeroom or subject teacher
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </SlideOverPanel>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedTeacher ? `Delete ${selectedTeacher.name}?` : "Delete this teacher?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All associated data will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedTeacher) {
                  deleteTeacher(selectedTeacher.id);
                }
                setDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Teacher Modal */}
      <AddTeacherModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchTeachers();
          setIsAddModalOpen(false);
        }}
      />

      {/* Quick Add Modal */}
      <ExpressAddModal
        isOpen={quickAdd.isOpen}
        onClose={quickAdd.close}
        onSubmit={handleQuickAdd}
        title="Quick Add Teacher"
        placeholder="John Doe"
        successMessage="Teacher added successfully!"
        icon={Plus}
        minLength={2}
      />
    </div>
  );
}
