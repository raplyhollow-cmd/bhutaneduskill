/**
 * TEACHER ATTENDANCE PAGE
 * Take and manage student attendance
 */
"use client";

import { useState } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { AttendanceTracker } from "@/components/attendance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock } from "lucide-react";

// Mock students
const mockStudents = [
  { id: "s1", name: "Karma Wangchuk", rollNumber: "01", classId: "class10a", section: "A" },
  { id: "s2", name: "Tshering Yangden", rollNumber: "02", classId: "class10a", section: "A" },
  { id: "s3", name: "Dorji Pelmo", rollNumber: "03", classId: "class10a", section: "A" },
  { id: "s4", name: "Sonam Tshewang", rollNumber: "04", classId: "class10a", section: "A" },
  { id: "s5", name: "Chimi Dema", rollNumber: "05", classId: "class10a", section: "A" },
  { id: "s6", name: "Pema Lhamo", rollNumber: "06", classId: "class10a", section: "A" },
  { id: "s7", name: "Jigme Namgyal", rollNumber: "07", classId: "class10a", section: "A" },
  { id: "s8", name: "Dechen Wangmo", rollNumber: "08", classId: "class10a", section: "A" },
];

export default function TeacherAttendancePage() {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const mockClasses = [
    { id: "class10a", name: "Class 10 A", subject: "Mathematics" },
    { id: "class10b", name: "Class 10 B", subject: "Mathematics" },
    { id: "class11a", name: "Class 11 A", subject: "Physics" },
  ];

  const handleSave = async (sessionId: string, records: any) => {
    console.log("Saving attendance:", sessionId, records);
    // In production: await fetch('/api/teacher/attendance/[classId]/[date]', { method: 'POST', body: JSON.stringify(records) })
    alert("Attendance saved successfully!");
  };

  if (selectedClass) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="teacher" userName="Teacher" title={`Attendance - ${selectedClass.name}`} />
        <div className="lg:ml-64 p-6">
          <div className="mb-4">
            <Button variant="outline" onClick={() => setSelectedClass(null)}>
              ← Back to Class Selection
            </Button>
          </div>

          <AttendanceTracker
            classId={selectedClass.id}
            className={selectedClass.name}
            subject={selectedClass.subject}
            students={mockStudents}
            date={selectedDate}
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
          <p className="text-muted-foreground">Select a class to take attendance</p>
        </div>

        {/* Date Selector */}
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

        {/* Class Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {mockClasses.map((cls) => (
            <Card
              key={cls.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedClass(cls)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{cls.name}</h3>
                    <p className="text-sm text-muted-foreground">{cls.subject}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{mockStudents.length} students</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-4">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Take Attendance
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Check-In Kiosk Link */}
        <Card className="mt-6 bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Self Check-In Kiosk</h3>
                <p className="text-white/80 text-sm">
                  Allow students to check in themselves using QR codes or biometric
                </p>
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                <Clock className="w-5 h-5 mr-2" />
                Open Kiosk
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
