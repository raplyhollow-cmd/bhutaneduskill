"use client";

/**
 * SCHOOL ADMIN - TIMETABLE MANAGEMENT
 *
 * Features:
 * - View class timetables
 * - Automatic timetable generation with conflict detection
 * - Create/edit/delete timetable entries
 * - Teacher availability display
 * - Room allocation
 * - Manual override with conflict resolution
 * - Export to PDF/Excel
 * - Week/day view
 * - Print timetables
 */


import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Printer,
  Download,
  Filter,
  Grid3x3,
  List,
  BookOpen,
  GraduationCap,
  Check,
  Loader2,
  AlertTriangle,
  User,
  MapPin,
  Sparkles,
  FileText,
  X,
  RefreshCw,
  Eye,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface ClassData {
  id: string;
  name: string;
  grade: number;
  section: string;
}

interface SubjectData {
  id: string;
  name: string;
  code: string;
  color: string | null;
}

interface TeacherData {
  id: string;
  name: string;
  subjects: string[];
}

interface TimeSlotData {
  id: string;
  name: string;
  type: string;
  order: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

interface RoomData {
  id: string;
  name: string;
  roomNumber: string | null;
  type: string;
  capacity: number | null;
}

interface TimetableEntryData {
  id: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  roomId: string;
  roomName: string;
  dayOfWeek: string;
  periodId: string;
  periodName: string;
  startTime: string;
  endTime: string;
}

interface TimetableData {
  classId: string;
  className: string;
  entries: TimetableEntryData[];
}

interface ConflictData {
  type: "teacher" | "room" | "class";
  message: string;
  existingEntry: TimetableEntryData;
}

interface GenerationResult {
  entries: TimetableEntryData[];
  summary: {
    totalEntries: number;
    classesProcessed: number;
    conflictsAvoided: number;
    warnings: string[];
  };
}

// Week days for timetable
const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function TimetablePage() {
  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Data state
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotData[]>([]);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);

  // UI state
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showTeacherAvailability, setShowTeacherAvailability] = useState(false);
  const [showRoomAllocation, setShowRoomAllocation] = useState(false);
  const [editingCell, setEditingCell] = useState<{ periodId: string; day: string; entry?: TimetableEntryData } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    subjectId: "",
    teacherId: "",
    roomId: "",
    notes: "",
  });

  // Generation options
  const [generateOptions, setGenerateOptions] = useState({
    skipConflicts: false,
    generateForAllClasses: false,
    academicYear: new Date().getFullYear().toString(),
  });

  // Component refs
  const timetableRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetableForClass(selectedClass.id);
    }
  }, [selectedClass]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/school-admin/timetable");
      if (!response.ok) throw new Error("Failed to fetch timetable");

      const result = await response.json();
      const data = result.data;

      setClasses(data.classes || []);
      setSubjects(data.subjects || []);
      setTeachers(data.teachers || []);
      setTimeSlots(data.timeSlots || []);
      setRooms(data.rooms || []);

      if (data.classes && data.classes.length > 0) {
        setSelectedClass(data.classes[0]);
      }
    } catch (err) {
      console.error("Error fetching timetable data:", err);
      setError("Failed to load timetable data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetableForClass = async (classId: string) => {
    try {
      const response = await fetch(`/api/school-admin/timetable?classId=${classId}`);
      if (!response.ok) return;

      const result = await response.json();
      const data = result.data;

      if (data.timetable) {
        setTimetable(data.timetable);
        detectConflicts(data.timetable.entries);
      } else {
        setTimetable({
          classId,
          className: classes.find((c) => c.id === classId)?.name || "",
          entries: [],
        });
        setConflicts([]);
      }
    } catch (err) {
      console.error("Error fetching timetable for class:", err);
    }
  };

  // ============================================================================
  // CONFLICT DETECTION
  // ============================================================================

  const detectConflicts = (entries: TimetableEntryData[]) => {
    const detectedConflicts: ConflictData[] = [];

    for (const entry of entries) {
      // Check for teacher conflicts
      const teacherConflicts = entries.filter(
        (e) =>
          e.id !== entry.id &&
          e.teacherId === entry.teacherId &&
          e.dayOfWeek === entry.dayOfWeek &&
          e.periodId === entry.periodId
      );

      for (const conflict of teacherConflicts) {
        detectedConflicts.push({
          type: "teacher",
          message: `${getTeacherName(entry.teacherId)} is already assigned at this time`,
          existingEntry: conflict,
        });
      }

      // Check for room conflicts
      if (entry.roomId) {
        const roomConflicts = entries.filter(
          (e) =>
            e.id !== entry.id &&
            e.roomId === entry.roomId &&
            e.dayOfWeek === entry.dayOfWeek &&
            e.periodId === entry.periodId
        );

        for (const conflict of roomConflicts) {
          detectedConflicts.push({
            type: "room",
            message: `${getRoomName(entry.roomId)} is already booked at this time`,
            existingEntry: conflict,
          });
        }
      }
    }

    setConflicts(detectedConflicts);
  };

  // ============================================================================
  // GETTERS
  // ============================================================================

  const getSubjectById = (id: string): SubjectData | undefined =>
    subjects.find((s) => s.id === id);

  const getTeacherById = (id: string): TeacherData | undefined =>
    teachers.find((t) => t.id === id);

  const getRoomById = (id: string): RoomData | undefined =>
    rooms.find((r) => r.id === id);

  const getSubjectName = (id: string): string => getSubjectById(id)?.name || "Unknown";
  const getTeacherName = (id: string): string => getTeacherById(id)?.name || "Unknown";
  const getRoomName = (id: string): string => getRoomById(id)?.name || "Unknown";

  const getCellContent = (periodId: string, day: string): {
    subject: SubjectData | undefined;
    teacher: TeacherData | undefined;
    entry: TimetableEntryData | undefined;
  } | null => {
    if (!timetable) return null;

    const entry = timetable.entries.find(
      (e) => e.periodId === periodId && e.dayOfWeek === day
    );

    if (!entry) return null;

    return {
      subject: getSubjectById(entry.subjectId),
      teacher: getTeacherById(entry.teacherId),
      entry,
    };
  };

  const getTeacherSchedule = (teacherId: string): TimetableEntryData[] => {
    if (!timetable) return [];
    return timetable.entries.filter((e) => e.teacherId === teacherId);
  };

  const getRoomSchedule = (roomId: string): TimetableEntryData[] => {
    if (!timetable) return [];
    return timetable.entries.filter((e) => e.roomId === roomId);
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCellClick = (periodId: string, day: string) => {
    const existingEntry = timetable?.entries.find(
      (e) => e.periodId === periodId && e.dayOfWeek === day
    );

    setEditingCell({ periodId, day, entry: existingEntry });

    if (existingEntry) {
      setFormData({
        subjectId: existingEntry.subjectId,
        teacherId: existingEntry.teacherId,
        roomId: existingEntry.roomId,
        notes: "",
      });
    } else {
      setFormData({
        subjectId: "",
        teacherId: "",
        roomId: "",
        notes: "",
      });
    }

    setShowCreateModal(true);
  };

  const handleSaveEntry = async () => {
    if (!selectedClass || !editingCell) return;

    try {
      setIsSaving(true);
      setError(null);

      const period = timeSlots.find((s) => s.id === editingCell.periodId);
      const subject = getSubjectById(formData.subjectId);
      const teacher = getTeacherById(formData.teacherId);
      const room = getRoomById(formData.roomId);

      if (!subject || !teacher || !period) {
        setError("Please select valid subject, teacher, and time slot");
        setIsSaving(false);
        return;
      }

      const payload = {
        classId: selectedClass.id,
        subjectId: formData.subjectId,
        teacherId: formData.teacherId,
        roomId: formData.roomId || null,
        dayOfWeek: editingCell.day,
        periodId: editingCell.periodId,
        startTime: period.startTime,
        endTime: period.endTime,
        notes: formData.notes,
      };

      let response;
      if (editingCell.entry) {
        // Update existing entry
        response = await fetch(`/api/school-admin/timetable/${editingCell.entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new entry
        response = await fetch("/api/school-admin/timetable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        if (data.error) {
          setError(data.error);
          setIsSaving(false);
          return;
        }
        throw new Error("Failed to save entry");
      }

      // Refresh timetable
      await fetchTimetableForClass(selectedClass.id);
      setShowCreateModal(false);
      setEditingCell(null);
    } catch (err) {
      console.error("Error saving entry:", err);
      setError("Failed to save entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!selectedClass) return;

    try {
      setIsSaving(true);

      const response = await fetch(`/api/school-admin/timetable/${entryId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete entry");

      await fetchTimetableForClass(selectedClass.id);
      setShowCreateModal(false);
      setEditingCell(null);
    } catch (err) {
      console.error("Error deleting entry:", err);
      setError("Failed to delete entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateTimetable = async () => {
    if (!selectedClass) return;

    try {
      setIsGenerating(true);
      setError(null);
      setPreviewMode(false);

      const payload = {
        schoolId: localStorage.getItem("schoolId"),
        classId: generateOptions.generateForAllClasses ? undefined : selectedClass.id,
        academicYear: generateOptions.academicYear,
        skipConflicts: generateOptions.skipConflicts,
      };

      // Generate actual timetable
      const generateResponse = await fetch("/api/timetable/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || "Failed to generate timetable");
      }

      const result = await generateResponse.json();
      const data = result.data as GenerationResult;

      // Refresh timetable data
      await fetchData();
      if (selectedClass) {
        await fetchTimetableForClass(selectedClass.id);
      }

      setShowGenerateModal(false);

      // Store generation result for display
      setGenerationResult(data);

      // Show success summary
      console.log("Timetable generated successfully:", data.summary);

      // Display any warnings as error message (temporary)
      if (data.summary.warnings.length > 0) {
        console.warn("Generation warnings:", data.summary.warnings);
        setError(`Generated with ${data.summary.warnings.length} warning(s). Check console for details.`);
        setTimeout(() => setError(null), 5000);
      } else {
        setError(`Successfully generated ${data.summary.totalEntries} entries for ${data.summary.classesProcessed} class(es).`);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error("Error generating timetable:", err);
      setError("Failed to generate timetable. Please try again.");
    } finally {
      setIsGenerating(false);
      setPreviewMode(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async (format: "pdf" | "excel") => {
    if (!selectedClass || !timetable) return;

    try {
      // For PDF, use the browser's print functionality with PDF export
      if (format === "pdf") {
        const printContent = timetableRef.current;
        if (!printContent) return;

        const originalContents = document.body.innerHTML;
        const printContents = printContent.innerHTML;

        document.body.innerHTML = `
          <div style="padding: 20px;">
            <h1>Timetable - ${selectedClass.name}</h1>
            ${printContents}
          </div>
        `;

        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
        return;
      }

      // For Excel, generate CSV
      const headers = ["Day", "Period", "Time", "Subject", "Teacher", "Room"];
      const rows = weekDays.flatMap((day) =>
        timeSlots.map((slot) => {
          const cell = getCellContent(slot.id, day);
          return [
            day,
            slot.name,
            `${slot.startTime} - ${slot.endTime}`,
            cell?.subject?.name || "Free",
            cell?.teacher?.name || "",
            cell?.entry?.roomId ? getRoomName(cell.entry.roomId) : "",
          ];
        })
      );

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timetable-${selectedClass.name}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting:", err);
      setError("Failed to export timetable. Please try again.");
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading timetable data...</p>
        </div>
      </div>
    );
  }

  if (error && !timetable) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Timetable</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Found</h3>
          <p className="text-gray-500 mb-4">
            Create classes first before setting up timetables.
          </p>
          <Button
            className="text-white"
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            onClick={() => (window.location.href = "/school-admin/classes")}
          >
            Manage Classes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
          <p className="text-gray-600 mt-1">Create and manage class timetables</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowTeacherAvailability(true)}>
            <User className="w-4 h-4 mr-2" />
            Teacher Availability
          </Button>
          <Button variant="outline" onClick={() => setShowRoomAllocation(true)}>
            <MapPin className="w-4 h-4 mr-2" />
            Room Allocation
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport("excel")}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            className="text-white"
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            onClick={() => setShowGenerateModal(true)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Auto Generate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <Grid3x3 className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
                <p className="text-sm text-gray-500">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
                <p className="text-sm text-gray-500">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
                <p className="text-sm text-gray-500">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
                <p className="text-sm text-gray-500">Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  conflicts.length > 0 ? "bg-red-100" : "bg-green-100"
                }`}
              >
                {conflicts.length > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                ) : (
                  <Check className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{conflicts.length}</p>
                <p className="text-sm text-gray-500">Conflicts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conflicts Warning */}
      {conflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Conflicts Detected</h3>
                <p className="text-sm text-red-700 mt-1">
                  {conflicts.length} conflict(s) found in the timetable.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => setShowConflictModal(true)}
                >
                  View Conflicts
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success/Error Message Display */}
      {error && !error.includes("Failed") && !error.includes("Error") && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Success</h3>
                <p className="text-sm text-green-700 mt-1">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Class Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Select Class:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedClass?.id === cls.id
                      ? "text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  style={
                    selectedClass?.id === cls.id
                      ? { background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }
                      : {}
                  }
                >
                  {cls.name}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      {selectedClass && (
        <Card ref={timetableRef}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-600" />
                  Weekly Timetable - {selectedClass.name}
                </CardTitle>
                <CardDescription>
                  {selectedClass.grade} {selectedClass.section ? `- ${selectedClass.section}` : ""} • Academic Year {new Date().getFullYear()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isGenerating && (
                  <div className="flex items-center gap-2 text-sm text-violet-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
              {subjects.slice(0, 8).map((subject) => (
                <Badge
                  key={subject.id}
                  className="bg-gray-100 text-gray-700 border-gray-300"
                  variant="outline"
                >
                  {subject.code || subject.name}
                </Badge>
              ))}
              {subjects.length > 8 && (
                <Badge className="bg-gray-100 text-gray-700 border-gray-300" variant="outline">
                  +{subjects.length - 8} more
                </Badge>
              )}
            </div>

            {/* Timetable Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 bg-gray-50 min-w-[100px]">
                      Time
                    </th>
                    {weekDays.map((day) => (
                      <th key={day} className="text-center py-3 px-4 font-medium text-gray-600 bg-gray-50 min-w-[140px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => {
                    return (
                      <tr key={slot.id} className="border-b border-gray-100">
                        <td className="py-2 px-4 bg-gray-50">
                          <div className="text-center">
                            <p className="font-medium text-gray-900">{slot.name}</p>
                            <p className="text-xs text-gray-500">
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>
                        </td>
                        {weekDays.map((day) => {
                          const cellContent = getCellContent(slot.id, day);
                          const isBreak = slot.isBreak;
                          const hasConflict = cellContent?.entry
                            ? conflicts.some(
                                (c) =>
                                  c.existingEntry.id === cellContent.entry?.id ||
                                  (c.type === "teacher" && c.existingEntry.teacherId === cellContent.entry?.teacherId && c.existingEntry.dayOfWeek === day && c.existingEntry.periodId === slot.id) ||
                                  (c.type === "room" && c.existingEntry.roomId === cellContent.entry?.roomId && c.existingEntry.dayOfWeek === day && c.existingEntry.periodId === slot.id)
                              )
                            : false;

                          return (
                            <td key={day} className="py-2 px-2">
                              {isBreak ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                                  <p className="text-sm font-medium text-yellow-700">Break</p>
                                </div>
                              ) : cellContent ? (
                                <button
                                  onClick={() => handleCellClick(slot.id, day)}
                                  className={`w-full text-left rounded-lg p-2 border transition-all hover:shadow-md ${
                                    hasConflict
                                      ? "border-red-300 bg-red-50 hover:border-red-400"
                                      : "border-gray-200 bg-white hover:border-violet-300"
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-gray-900 truncate">
                                        {cellContent.subject?.name || "Free Period"}
                                      </p>
                                      {cellContent.teacher && (
                                        <p className="text-xs text-gray-500 truncate">{cellContent.teacher.name}</p>
                                      )}
                                      {cellContent.entry?.roomId && (
                                        <p className="text-xs text-gray-400">{getRoomName(cellContent.entry.roomId)}</p>
                                      )}
                                    </div>
                                    {hasConflict && (
                                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 ml-1" />
                                    )}
                                  </div>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCellClick(slot.id, day)}
                                  className="w-full h-full min-h-[60px] rounded-lg border-2 border-dashed border-gray-300 hover:border-violet-400 hover:bg-violet-50 transition-all flex items-center justify-center"
                                >
                                  <Plus className="w-5 h-5 text-gray-400" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common timetable management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => setShowGenerateModal(true)}>
              <Sparkles className="w-5 h-5" />
              <span>Auto Generate</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => setShowTeacherAvailability(true)}>
              <User className="w-5 h-5" />
              <span>Teacher Availability</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => setShowRoomAllocation(true)}>
              <MapPin className="w-5 h-5" />
              <span>Room Allocation</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => handleExport("excel")}>
              <Download className="w-5 h-5" />
              <span>Export CSV</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={handlePrint}>
              <Printer className="w-5 h-5" />
              <span>Print</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Entry Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCell?.entry ? "Edit Period" : "Add Period"}
            </DialogTitle>
            <DialogDescription>
              {editingCell && (
                <span>
                  {editingCell.day} at {timeSlots.find((s) => s.id === editingCell.periodId)?.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code || "N/A"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Select a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} {teacher.subjects.length > 0 ? `(${teacher.subjects.join(", ")})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
              <select
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Select a room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} {room.roomNumber ? `(${room.roomNumber})` : ""} - {room.type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingCell(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
            {editingCell?.entry && (
              <Button
                variant="destructive"
                onClick={() => handleDeleteEntry(editingCell.entry!.id)}
                disabled={isSaving}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              className="text-white"
              style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
              onClick={handleSaveEntry}
              disabled={isSaving || !formData.subjectId || !formData.teacherId}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto Generate Modal */}
      <Dialog open={showGenerateModal} onOpenChange={(open) => {
        setShowGenerateModal(open);
        if (!open) setGenerationResult(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              Auto Generate Timetable
            </DialogTitle>
            <DialogDescription>
              Automatically generate a conflict-free timetable using AI-powered scheduling
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Generation Result Display */}
            {generationResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Timetable Generated Successfully!</p>
                    <div className="mt-2 text-sm text-green-700 space-y-1">
                      <p>Entries created: {generationResult.summary.totalEntries}</p>
                      <p>Classes processed: {generationResult.summary.classesProcessed}</p>
                      <p>Conflicts avoided: {generationResult.summary.conflictsAvoided}</p>
                      {generationResult.summary.warnings.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-medium">
                            {generationResult.summary.warnings.length} warning(s)
                          </summary>
                          <ul className="mt-1 ml-4 list-disc space-y-1">
                            {generationResult.summary.warnings.slice(0, 5).map((warning, i) => (
                              <li key={i} className="text-xs">{warning}</li>
                            ))}
                            {generationResult.summary.warnings.length > 5 && (
                              <li className="text-xs">...and {generationResult.summary.warnings.length - 5} more</li>
                            )}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                  <div>
                    <p className="font-medium text-violet-900">Generating timetable...</p>
                    <p className="text-sm text-violet-700">This may take a moment</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <Input
                value={generateOptions.academicYear}
                onChange={(e) => setGenerateOptions({ ...generateOptions, academicYear: e.target.value })}
                placeholder="2024-2025"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Generate for all classes</p>
                <p className="text-sm text-gray-500">Generate timetables for all classes at once</p>
              </div>
              <input
                type="checkbox"
                checked={generateOptions.generateForAllClasses}
                onChange={(e) => setGenerateOptions({ ...generateOptions, generateForAllClasses: e.target.checked })}
                className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Skip conflict detection</p>
                <p className="text-sm text-gray-500">Allow scheduling even with conflicts (not recommended)</p>
              </div>
              <input
                type="checkbox"
                checked={generateOptions.skipConflicts}
                onChange={(e) => setGenerateOptions({ ...generateOptions, skipConflicts: e.target.checked })}
                className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGenerateModal(false);
                setGenerationResult(null);
              }}
              disabled={isGenerating}
            >
              {generationResult ? "Close" : "Cancel"}
            </Button>
            {!generationResult && (
              <Button
                className="text-white"
                style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
                onClick={handleGenerateTimetable}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teacher Availability Modal */}
      <Dialog open={showTeacherAvailability} onOpenChange={setShowTeacherAvailability}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-violet-600" />
              Teacher Availability
            </DialogTitle>
            <DialogDescription>
              View and manage teacher schedules across all classes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {teachers.map((teacher) => {
              const schedule = getTeacherSchedule(teacher.id);
              const bookedSlots = schedule.length;
              const totalSlots = timeSlots.filter((s) => !s.isBreak).length * weekDays.length;
              const availabilityPercent = totalSlots > 0 ? Math.round(((totalSlots - bookedSlots) / totalSlots) * 100) : 100;

              return (
                <details key={teacher.id} className="border border-gray-200 rounded-lg">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{teacher.name}</p>
                        <p className="text-sm text-gray-500">{teacher.subjects.join(", ") || "No subjects assigned"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        className={
                          availabilityPercent > 50
                            ? "bg-green-100 text-green-700 border-green-300"
                            : availabilityPercent > 20
                            ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                            : "bg-red-100 text-red-700 border-red-300"
                        }
                      >
                        {availabilityPercent}% available
                      </Badge>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </summary>
                  <div className="p-4 pt-0 border-t">
                    {schedule.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">No scheduled periods</p>
                    ) : (
                      <div className="grid gap-2 mt-2">
                        {schedule.map((entry, index) => (
                          <div
                            key={entry.id || index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {entry.subjectName} - {entry.dayOfWeek}
                              </p>
                              <p className="text-xs text-gray-500">
                                {entry.periodName} ({entry.startTime} - {entry.endTime})
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getRoomName(entry.roomId) || "No room"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowTeacherAvailability(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Allocation Modal */}
      <Dialog open={showRoomAllocation} onOpenChange={setShowRoomAllocation}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-violet-600" />
              Room Allocation
            </DialogTitle>
            <DialogDescription>
              View and manage room schedules across all classes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {rooms.map((room) => {
              const schedule = getRoomSchedule(room.id);
              const bookedSlots = schedule.length;
              const totalSlots = timeSlots.filter((s) => !s.isBreak).length * weekDays.length;
              const utilizationPercent = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

              return (
                <details key={room.id} className="border border-gray-200 rounded-lg">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{room.name}</p>
                        <p className="text-sm text-gray-500">
                          {room.roomNumber ? `Room ${room.roomNumber}` : ""} • {room.type}
                          {room.capacity ? ` • Capacity: ${room.capacity}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        className={
                          utilizationPercent < 50
                            ? "bg-green-100 text-green-700 border-green-300"
                            : utilizationPercent < 80
                            ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                            : "bg-red-100 text-red-700 border-red-300"
                        }
                      >
                        {utilizationPercent}% utilized
                      </Badge>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </summary>
                  <div className="p-4 pt-0 border-t">
                    {schedule.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">No scheduled periods</p>
                    ) : (
                      <div className="grid gap-2 mt-2">
                        {schedule.map((entry, index) => (
                          <div
                            key={entry.id || index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {entry.subjectName} - {entry.dayOfWeek}
                              </p>
                              <p className="text-xs text-gray-500">
                                {classes.find((c) => c.id === entry.classId)?.name || "Unknown Class"} • {entry.periodName} ({entry.startTime} - {entry.endTime})
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getTeacherName(entry.teacherId)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowRoomAllocation(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflicts Modal */}
      <Dialog open={showConflictModal} onOpenChange={setShowConflictModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Timetable Conflicts
            </DialogTitle>
            <DialogDescription>
              The following conflicts were detected in the timetable
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {conflicts.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No conflicts found</p>
            ) : (
              conflicts.map((conflict, index) => (
                <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900 capitalize">
                        {conflict.type} Conflict
                      </p>
                      <p className="text-sm text-red-700 mt-1">{conflict.message}</p>
                      <div className="mt-2 text-xs text-red-600">
                        <p>
                          {conflict.existingEntry.dayOfWeek} at {conflict.existingEntry.periodName}{" "}
                          ({conflict.existingEntry.startTime} - {conflict.existingEntry.endTime})
                        </p>
                        <p>
                          Class: {classes.find((c) => c.id === conflict.existingEntry.classId)?.name || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowConflictModal(false);
                        setEditingCell({
                          periodId: conflict.existingEntry.periodId,
                          day: conflict.existingEntry.dayOfWeek,
                          entry: conflict.existingEntry,
                        });
                        setFormData({
                          subjectId: conflict.existingEntry.subjectId,
                          teacherId: conflict.existingEntry.teacherId,
                          roomId: conflict.existingEntry.roomId,
                          notes: "",
                        });
                        setShowCreateModal(true);
                      }}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowConflictModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
