/**
 * TEACHER ATTENDANCE PAGE
 * Take and manage student attendance
 */
"use client";

import { useState, useEffect } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { AttendanceTracker, Student, AttendanceRecord } from "@/components/attendance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Clock, Users, Loader2, AlertCircle } from "lucide-react";

interface ClassData {
  id: string;
  name: string;
  grade: number;
  section: string;
  students: Student[];
}

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);

  // Fetch teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/teacher/attendance");
        if (!response.ok) {
          throw new Error("Failed to fetch classes");
        }
        const data = await response.json();

        // Transform API data to ClassData format
        const classData: ClassData[] = data.classes.map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          section: cls.section || "",
          students: cls.students?.map((s: any) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName || ""}`.trim(),
            rollNumber: s.rollNumber?.toString() || s.id.slice(-4),
            classId: cls.id,
            section: cls.section || s.section || "",
          })) || [],
        }));

        setClasses(classData);
      } catch (err) {
        console.error("Error fetching classes:", err);
        setError("Failed to load classes. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch existing attendance when class and date are selected
  useEffect(() => {
    if (selectedClass && selectedDate) {
      const fetchAttendance = async () => {
        try {
          const response = await fetch(`/api/teacher/attendance/${selectedClass.id}/${selectedDate}`);
          if (response.ok) {
            const data = await response.json();
            // Transform API data to AttendanceRecord format
            const records: AttendanceRecord[] = data.students
              .filter((s: any) => s.attendance)
              .map((s: any) => ({
                studentId: s.student.id,
                status: s.attendance.status,
                notes: s.attendance.notes || s.attendance.reason || "",
                timeIn: s.attendance.checkInTime || undefined,
                timeOut: s.attendance.checkOutTime || undefined,
              }));
            setExistingAttendance(records);
          } else {
            setExistingAttendance([]);
          }
        } catch (err) {
          console.error("Error fetching attendance:", err);
          setExistingAttendance([]);
        }
      };

      fetchAttendance();
    }
  }, [selectedClass, selectedDate]);

  const handleSave = async (sessionId: string, records: AttendanceRecord[]) => {
    if (!selectedClass) return;

    try {
      const response = await fetch(`/api/teacher/attendance/${selectedClass.id}/${selectedDate}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendance: records.map(r => ({
            studentId: r.studentId,
            status: r.status,
            notes: r.notes,
            reason: r.notes,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save attendance");
      }

      const result = await response.json();
      console.log("Attendance saved:", result);
      return Promise.resolve();
    } catch (err) {
      console.error("Error saving attendance:", err);
      throw err;
    }
  };

  if (selectedClass) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="teacher" userName="Teacher" title={`Attendance - ${selectedClass.name}`} />
        <div className="lg:ml-64 p-6">
          <div className="mb-4 flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedClass(null)}>
              ← Back to Class Selection
            </Button>
            <div className="text-sm text-muted-foreground">
              Date: <span className="font-medium">{selectedDate}</span>
            </div>
            {existingAttendance.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {existingAttendance.length} records loaded
              </Badge>
            )}
          </div>

          <AttendanceTracker
            classId={selectedClass.id}
            className={selectedClass.name}
            subject="Class"
            students={selectedClass.students}
            date={selectedDate}
            existingRecords={existingAttendance}
            onSave={handleSave}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="teacher" userName="Teacher" title="Take Attendance" />
      <div className="lg:ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Take Attendance</h1>
          <p className="text-muted-foreground">Select a class to take attendance</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="pt-6 flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading classes...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-4 py-6">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Error Loading Classes</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Date Selector */}
        {!isLoading && !error && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Select Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border rounded-md px-3 py-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Class Cards */}
        {!isLoading && !error && classes.length === 0 && (
          <Card>
            <CardContent className="pt-6 py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No classes assigned yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Contact your school administrator to get class assignments.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && classes.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <Card
                key={cls.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedClass(cls)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)"
                      }}
                    >
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">Grade {cls.grade} - {cls.section || "No Section"}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{cls.students.length} students</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    style={{
                      background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)"
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Take Attendance
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Check-In Kiosk Link */}
        {!isLoading && !error && (
          <Card
            className="mt-6 text-white"
            style={{
              background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)"
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Self Check-In Kiosk</h3>
                  <p className="text-white/80 text-sm">
                    Allow students to check in themselves using QR codes or biometric
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-white/90"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Open Kiosk
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
