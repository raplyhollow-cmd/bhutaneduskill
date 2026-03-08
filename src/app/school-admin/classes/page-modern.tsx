/**
 * SCHOOL ADMIN - CLASSES MANAGEMENT (Google Drive Style)
 *
 * Modern data table with:
 * - Horizontal scroll (no wrap)
 * - Column filters
 * - Sortable columns
 * - Inline editing
 * - Bulk actions
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  BookOpen,
  Users,
  Grid3x3,
  List,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InlineEdit } from "@/components/ui/inline-edit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SlideOverPanel } from "@/components/admin/slide-over-panel";

interface Class {
  id: string;
  name: string;
  grade: number;
  section: string;
  roomNumber: string;
  capacity: number;
  enrolled?: number;
  classTeacherId: string | null;
  classTeacherName: string;
  homeroomTeacherId: string | null;
  homeroomTeacherName: string;
  isActive: boolean;
  status?: "active" | "inactive";
  subjects?: string[];
}

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string;
  employeeId: string | null;
}

type SortField = "name" | "grade" | "section" | "capacity" | "enrolled" | "teacher" | "status";
type SortOrder = "asc" | "desc" | null;

interface ColumnConfig {
  id: string;
  label: string;
  width: string;
  sortable: boolean;
  filterable: boolean;
  visible: boolean;
}

const COLUMNS: ColumnConfig[] = [
  { id: "name", label: "Class Name", width: "200px", sortable: true, filterable: true, visible: true },
  { id: "grade", label: "Grade", width: "100px", sortable: true, filterable: true, visible: true },
  { id: "section", label: "Section", width: "100px", sortable: true, filterable: true, visible: true },
  { id: "room", label: "Room", width: "120px", sortable: true, filterable: true, visible: true },
  { id: "teacher", label: "Class Teacher", width: "180px", sortable: true, filterable: false, visible: true },
  { id: "capacity", label: "Capacity", width: "140px", sortable: true, filterable: false, visible: true },
  { id: "enrolled", label: "Enrolled", width: "120px", sortable: true, filterable: false, visible: true },
  { id: "status", label: "Status", width: "120px", sortable: true, filterable: true, visible: true },
  { id: "actions", label: "", width: "60px", sortable: false, filterable: false, visible: true },
];

export default function SchoolAdminClassesPageModern() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isGridView, setIsGridView] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMNS.filter((c) => c.visible).map((c) => c.id))
  );

  // Fetch data
  useEffect(() => {
    Promise.all([fetchClasses(), fetchTeachers()]);
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/school-admin/classes");
      const json = await res.json();
      if (res.ok) {
        setClasses(json.data?.classes || []);
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/school-admin/teachers");
      const json = await res.json();
      if (res.ok) {
        setTeachers(json.data?.teachers || []);
      }
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    }
  };

  // Filter and sort data
  const filteredAndSortedClasses = useMemo(() => {
    let result = [...classes];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.section.toLowerCase().includes(query) ||
          c.roomNumber?.toLowerCase().includes(query) ||
          c.classTeacherName?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filterGrade !== "all") {
      result = result.filter((c) => c.grade === parseInt(filterGrade));
    }
    if (filterSection !== "all") {
      result = result.filter((c) => c.section === filterSection);
    }
    if (filterStatus !== "all") {
      result = result.filter((c) =>
        filterStatus === "active" ? c.isActive : !c.isActive
      );
    }

    // Apply sort
    if (sortField && sortOrder) {
      result.sort((a, b) => {
        let aVal: any, bVal: any;

        switch (sortField) {
          case "name":
            aVal = a.name;
            bVal = b.name;
            break;
          case "grade":
            aVal = a.grade;
            bVal = b.grade;
            break;
          case "section":
            aVal = a.section;
            bVal = b.section;
            break;
          case "capacity":
            aVal = a.capacity;
            bVal = b.capacity;
            break;
          case "enrolled":
            aVal = a.enrolled || 0;
            bVal = b.enrolled || 0;
            break;
          case "teacher":
            aVal = a.classTeacherName || "";
            bVal = b.classTeacherName || "";
            break;
          case "status":
            aVal = a.isActive ? 1 : 0;
            bVal = b.isActive ? 1 : 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [classes, searchQuery, filterGrade, filterSection, filterStatus, sortField, sortOrder]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : sortOrder === "desc" ? null : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleUpdate = async (id: string, field: string, value: string) => {
    try {
      const res = await fetch(`/api/school-admin/classes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field === "room" ? "roomNumber" : field]: value,
        }),
      });

      if (res.ok) {
        setClasses((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, [field === "room" ? "roomNumber" : field]: value }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const handleAssignTeacher = async (cls: Class) => {
    setSelectedClass(cls);
    // Open teacher assignment modal
  };

  const handleDelete = async (cls: Class) => {
    if (!confirm(`Delete class "${cls.name}"?`)) return;

    try {
      const res = await fetch(`/api/school-admin/classes/${cls.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setClasses((prev) => prev.filter((c) => c.id !== cls.id));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedClasses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedClasses.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Get unique values for filters
  const grades = useMemo(() => {
    const grades = new Set(classes.map((c) => c.grade));
    return Array.from(grades).sort((a, b) => a - b);
  }, [classes]);

  const sections = useMemo(() => {
    const sections = new Set(classes.map((c) => c.section));
    return Array.from(sections).sort();
  }, [classes]);

  const allSelected = selectedIds.size === filteredAndSortedClasses.length && filteredAndSortedClasses.length > 0;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header Toolbar */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">Classes</h1>
            <span className="text-sm text-gray-500">
              {filteredAndSortedClasses.length} classes
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setIsGridView(false)}
                className={cn(
                  "p-2 transition-colors",
                  !isGridView ? "bg-gray-100" : "hover:bg-gray-50"
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsGridView(true)}
                className={cn(
                  "p-2 transition-colors",
                  isGridView ? "bg-gray-100" : "hover:bg-gray-50"
                )}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              asChild
            >
              <a href="/school-admin/classes/create">
                <Plus className="w-4 h-4" />
                Create Class
              </a>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3 px-6 pb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {/* Grade Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Grade
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setFilterGrade("all")}>
                  All Grades
                </DropdownMenuItem>
                {grades.map((grade) => (
                  <DropdownMenuItem
                    key={grade}
                    onClick={() => setFilterGrade(String(grade))}
                  >
                    Grade {grade}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Section Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Filter
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setFilterSection("all")}>
                  All Sections
                </DropdownMenuItem>
                {sections.map((section) => (
                  <DropdownMenuItem
                    key={section}
                    onClick={() => setFilterSection(section)}
                  >
                    Section {section}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Status
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>
                  Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Column Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Columns
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {COLUMNS.map((col) => (
                  <DropdownMenuItem
                    key={col.id}
                    onClick={() => {
                      const newVisible = new Set(visibleColumns);
                      if (newVisible.has(col.id)) {
                        newVisible.delete(col.id);
                      } else {
                        newVisible.add(col.id);
                      }
                      setVisibleColumns(newVisible);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.id)}
                        readOnly
                        className="w-4 h-4"
                      />
                      {col.label}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {(filterGrade !== "all" || filterSection !== "all" || filterStatus !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterGrade("all");
                  setFilterSection("all");
                  setFilterStatus("all");
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table - Google Drive Style */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <div className="h-full overflow-auto">
            {/* Table Header */}
            <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center min-w-max">
                {/* Checkbox */}
                <div className="w-12 h-12 flex items-center justify-center px-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (someSelected && input) {
                        input.indeterminate = true;
                      }
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                  />
                </div>

                {/* Columns */}
                {COLUMNS.filter((c) => visibleColumns.has(c.id)).map((col) => (
                  <div
                    key={col.id}
                    className="h-12 flex items-center px-4 border-l border-gray-200"
                    style={{ width: col.width }}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.id as SortField)}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 transition-colors"
                      >
                        {col.label}
                        {sortField === col.id ? (
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform",
                              sortOrder === "desc" && "rotate-180"
                            )}
                          />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-0 hover:opacity-50" />
                        )}
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-gray-600 uppercase">
                        {col.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Table Body */}
            {filteredAndSortedClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Users className="w-12 h-12 mb-4 opacity-50" />
                <p>No classes found</p>
                {searchQuery || filterGrade !== "all" || filterSection !== "all" || filterStatus !== "all" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterGrade("all");
                      setFilterSection("all");
                      setFilterStatus("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredAndSortedClasses.map((cls, index) => (
                  <div
                    key={cls.id}
                    className={cn(
                      "flex items-center min-w-max group hover:bg-blue-50 transition-colors cursor-pointer",
                      selectedIds.has(cls.id) && "bg-blue-50"
                    )}
                  >
                    {/* Checkbox */}
                    <div className="w-12 flex items-center justify-center px-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(cls.id)}
                        onChange={() => toggleSelect(cls.id)}
                        className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                      />
                    </div>

                    {/* Class Name */}
                    {visibleColumns.has("name") && (
                      <div
                        className="h-14 px-4 border-l border-gray-100 flex items-center"
                        style={{ width: COLUMNS.find((c) => c.id === "name")?.width }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {cls.grade}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                            <p className="text-xs text-gray-500">
                              {cls.enrolled || 0} students
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grade */}
                    {visibleColumns.has("grade") && (
                      <div
                        className="h-14 px-4 border-l border-gray-100 flex items-center"
                        style={{ width: COLUMNS.find((c) => c.id === "grade")?.width }}
                      >
                        <span className="text-sm text-gray-700">{cls.grade}</span>
                      </div>
                    )}

                    {/* Section */}
                    {visibleColumns.has("section") && (
                      <div
                        className="h-14 px-4 border-l border-gray-100 flex items-center"
                        style={{ width: COLUMNS.find((c) => c.id === "section")?.width }}
                      >
                        <span className="text-sm text-gray-700">{cls.section}</span>
                      </div>
                    )}

                    {/* Room */}
                    {visibleColumns.has("room") && (
                      <div
                        className="h-14 px-4 border-l border-gray-100 flex items-center"
                        style={{ width: COLUMNS.find((c) => c.id === "room")?.width }}
                      >
                        <InlineEdit
                          value={cls.roomNumber || ""}
                          onSave={(value) => handleUpdate(cls.id, "room", value)}
                          placeholder="—"
                          className="text-sm"
                        />
                      </div>
                    )}

                    {/* Teacher */}
                    {visibleColumns.has("teacher") && (
                      <div
                        className="h-14 px-4 border-l border-gray-100 flex items-center"
                        style={{ width: COLUMNS.find((c) => c.id === "teacher")?.width }}
                      >
                        {cls.classTeacherName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-medium">
                              {cls.classTeacherName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-700 truncate">
                              {cls.classTeacherName}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAssignTeacher(cls)}
                            className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Assign
                          </button>
                        )}
                      </div>
                    )}

                    {/* Capacity */}
                    {visibleColumns.has("capacity") && (
                      <div
                        className="h-14 px-4 border-l border-gray-100 flex items-center gap-2"
                        style={{ width: COLUMNS.find((c) => c.id === "capacity")?.width }}
                      >
                        <Users className="w-4 h-4 text-gray-400" />
                        <InlineEdit
                          value={String(cls.capacity)}
                          onSave={(value) => handleUpdate(cls.id, "capacity", value)}
                          placeholder="—"
                          className="text-sm w-14"
                        />
                        <div className="flex-1 max-w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              (cls.enrolled || 0) >= cls.capacity
                                ? "bg-red-500"
                                : (cls.enrolled || 0) / cls.capacity >= 0.75
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            )}
                            style={{
                              width: `${Math.min(((cls.enrolled || 0) / cls.capacity) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Enrolled */}
                    {visibleColumns.has("enrolled") && (
                      <div
                        className="h-14 px-4 border-l border-gray-100 flex items-center"
                        style={{ width: COLUMNS.find((c) => c.id === "enrolled")?.width }}
                      >
                        <span
                          className={cn(
                            "text-sm font-medium",
                            (cls.enrolled || 0) >= cls.capacity
                              ? "text-red-600"
                              : (cls.enrolled || 0) / cls.capacity >= 0.75
                                ? "text-yellow-600"
                                : "text-green-600"
                          )}
                        >
                          {cls.enrolled || 0}
                        </span>
                      </div>
                    )}

                    {/* Status */}
                    {visibleColumns.has("status") && (
                      <div
                        className="h-14 px-4 border-l border-gray-100 flex items-center"
                        style={{ width: COLUMNS.find((c) => c.id === "status")?.width }}
                      >
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            cls.isActive
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          )}
                        >
                          {cls.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    )}

                    {/* Actions */}
                    {visibleColumns.has("actions") && (
                      <div
                        className="h-14 px-4 border-l border-gray-100 flex items-center"
                        style={{ width: COLUMNS.find((c) => c.id === "actions")?.width }}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSelectedClass(cls)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignTeacher(cls)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Assign Teacher
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BookOpen className="w-4 h-4 mr-2" />
                              Manage Subjects
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(cls)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-over Panel for Class Details */}
      {selectedClass && (
        <SlideOverPanel
          isOpen={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          title={selectedClass.name}
          subtitle={`Grade ${selectedClass.grade} • Section ${selectedClass.section}`}
          width="lg"
          actions={
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Class
            </Button>
          }
        >
          {/* Overview Tab Content */}
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Capacity</p>
                <p className="text-2xl font-semibold text-blue-700">{selectedClass.capacity}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 font-medium">Enrolled</p>
                <p className="text-2xl font-semibold text-green-700">{selectedClass.enrolled || 0}</p>
              </div>
              <div className="p-4 bg-violet-50 rounded-lg">
                <p className="text-xs text-violet-600 font-medium">Available</p>
                <p className="text-2xl font-semibold text-violet-700">
                  {selectedClass.capacity - (selectedClass.enrolled || 0)}
                </p>
              </div>
            </div>

            {/* Class Information */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Class Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">Grade</span>
                  <span className="text-sm font-medium text-gray-900">{selectedClass.grade}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">Section</span>
                  <span className="text-sm font-medium text-gray-900">{selectedClass.section}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">Room Number</span>
                  <span className="text-sm font-medium text-gray-900">{selectedClass.roomNumber || "—"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge
                    variant={selectedClass.isActive ? "default" : "secondary"}
                    className={cn(
                      selectedClass.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {selectedClass.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Class Teacher */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Class Teacher</h3>
              {selectedClass.classTeacherName ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {selectedClass.classTeacherName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedClass.classTeacherName}</p>
                    <p className="text-xs text-gray-500">Assigned</p>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssignTeacher(selectedClass)}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Teacher
                </Button>
              )}
            </div>

            {/* Subjects */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Assigned Subjects</h3>
                <Button variant="outline" size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>
              {selectedClass.subjects && selectedClass.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedClass.subjects.map((subject) => (
                    <Badge key={subject} variant="outline" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No subjects assigned</p>
              )}
            </div>
          </div>
        </SlideOverPanel>
      )}
    </div>
  );
}
