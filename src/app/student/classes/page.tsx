/**
 * STUDENT CLASSES PAGE
 * View all classes the student is enrolled in with quick access to classmates, homework, etc.
 */
"use client";

import { useState } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Users,
  Clock,
  MapPin,
  ClipboardList,
  User,
  Search,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// Mock class data with real structure
const mockClasses = [
  {
    id: "cls1",
    name: "Mathematics",
    code: "MATH-10",
    grade: 10,
    section: "A",
    teacher: {
      id: "t1",
      name: "Mrs. Karma Dorji",
      email: "karma.dorji@school.edu.bt",
    },
    schedule: {
      days: ["Monday", "Wednesday", "Friday"],
      time: "08:30 - 09:30",
      room: "Room 101",
    },
    students: 32,
    upcomingHomework: 2,
    nextClass: "2025-02-11T08:30",
  },
  {
    id: "cls2",
    name: "English",
    code: "ENG-10",
    grade: 10,
    section: "A",
    teacher: {
      id: "t2",
      name: "Mr. Tshering Wangyal",
      email: "tshering.w@school.edu.bt",
    },
    schedule: {
      days: ["Tuesday", "Thursday", "Friday"],
      time: "09:45 - 10:45",
      room: "Room 205",
    },
    students: 32,
    upcomingHomework: 1,
    nextClass: "2025-02-11T09:45",
  },
  {
    id: "cls3",
    name: "Physics",
    code: "PHY-10",
    grade: 10,
    section: "A",
    teacher: {
      id: "t3",
      name: "Dr. Chencho Dorji",
      email: "chencho.d@school.edu.bt",
    },
    schedule: {
      days: ["Monday", "Tuesday", "Wednesday"],
      time: "11:00 - 12:00",
      room: "Science Lab 1",
    },
    students: 32,
    upcomingHomework: 3,
    nextClass: "2025-02-11T11:00",
  },
  {
    id: "cls4",
    name: "Chemistry",
    code: "CHM-10",
    grade: 10,
    section: "A",
    teacher: {
      id: "t4",
      name: "Ms. Pema Lhamo",
      email: "pema.l@school.edu.bt",
    },
    schedule: {
      days: ["Tuesday", "Wednesday", "Thursday"],
      time: "13:30 - 14:30",
      room: "Science Lab 2",
    },
    students: 32,
    upcomingHomework: 1,
    nextClass: "2025-02-11T13:30",
  },
  {
    id: "cls5",
    name: "Bhutan History",
    code: "HIS-10",
    grade: 10,
    section: "A",
    teacher: {
      id: "t5",
      name: "Mr. Sangay Thinley",
      email: "sangay.t@school.edu.bt",
    },
    schedule: {
      days: ["Monday", "Thursday", "Friday"],
      time: "14:45 - 15:45",
      room: "Room 302",
    },
    students: 32,
    upcomingHomework: 0,
    nextClass: "2025-02-11T14:45",
  },
  {
    id: "cls6",
    name: "Information Technology",
    code: "IT-10",
    grade: 10,
    section: "A",
    teacher: {
      id: "t6",
      name: "Mrs. Deki Yangzom",
      email: "deki.y@school.edu.bt",
    },
    schedule: {
      days: ["Wednesday", "Thursday", "Friday"],
      time: "08:30 - 09:30",
      room: "Computer Lab 1",
    },
    students: 32,
    upcomingHomework: 1,
    nextClass: "2025-02-12T08:30",
  },
];

// Mock classmates
const mockClassmates = [
  { id: "s1", name: "Tashi Dorji", avatar: "" },
  { id: "s2", name: "Pema Wangmo", avatar: "" },
  { id: "s3", name: "Karma Tshering", avatar: "" },
  { id: "s4", name: "Deki Choden", avatar: "" },
  { id: "s5", name: "Sonam Wangyel", avatar: "" },
];

function StudentClassesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<typeof mockClasses[0] | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>("all");

  // Filter classes based on search and subject filter
  const filteredClasses = mockClasses.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.teacher.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === "all" || cls.name.toLowerCase().includes(filterSubject.toLowerCase());
    return matchesSearch && matchesSubject;
  });

  // Get unique subjects for filter
  const subjects = ["all", ...Array.from(new Set(mockClasses.map((c) => c.name)))];

  // Get next class today
  const today = new Date().toISOString().split("T")[0];
  const nextClassToday = mockClasses
    .filter((c) => c.nextClass.startsWith(today))
    .sort((a, b) => a.nextClass.localeCompare(b.nextClass))[0];

  if (selectedClass) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="student" userName="Student" title={selectedClass.name} subtitle={`${selectedClass.code} - Class ${selectedClass.section}`} />
        <div className="lg:ml-64 p-6">
          <Button variant="outline" onClick={() => setSelectedClass(null)} className="mb-6">
            ← Back to My Classes
          </Button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Class Header Card */}
              <Card>
                <CardHeader>
                  <div style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }} className="rounded-lg p-6 text-white -m-6 mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedClass.name}</h2>
                        <p className="text-orange-100 mt-1">{selectedClass.code}</p>
                        <p className="text-orange-200 text-sm mt-2">Grade {selectedClass.grade} - Section {selectedClass.section}</p>
                      </div>
                      <Badge className="bg-white/20 text-white border-0 text-sm">
                        {selectedClass.students} Students
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Teacher Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-500" />
                      Class Teacher
                    </h3>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <p className="font-medium text-gray-900">{selectedClass.teacher.name}</p>
                      <p className="text-sm text-gray-600">{selectedClass.teacher.email}</p>
                      <Button size="sm" variant="outline" className="mt-3">
                        Contact Teacher
                      </Button>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      Schedule
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Days</p>
                          <p className="font-medium">{selectedClass.schedule.days.join(", ")}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Time</p>
                          <p className="font-medium">{selectedClass.schedule.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedClass.schedule.room}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/student/homework" className="col-span-1">
                        <Button variant="outline" className="w-full justify-start min-h-[44px]">
                          <ClipboardList className="w-4 h-4 mr-2" />
                          View Homework
                          {selectedClass.upcomingHomework > 0 && (
                            <Badge className="ml-auto bg-orange-100 text-orange-700">
                              {selectedClass.upcomingHomework}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full justify-start min-h-[44px]">
                        <BookOpen className="w-4 h-4 mr-2" />
                        View Resources
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Classmates */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    Classmates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockClassmates.map((mate) => (
                      <div key={mate.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold">
                          {mate.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{mate.name}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      View All {selectedClass.students} Classmates
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="font-semibold text-green-600">92%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Present</span>
                      <span className="font-medium">22 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Absent</span>
                      <span className="font-medium text-red-600">1 day</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Late</span>
                      <span className="font-medium text-yellow-600">2 days</span>
                    </div>
                  </div>
                  <Link href="/student/attendance">
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      View Full Attendance
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="student" userName="Student" title="My Classes" />
      <div className="lg:ml-64 p-6">
        {/* Next Class Today Banner */}
        {nextClassToday && (
          <Card className="mb-6" style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Next Class Today</p>
                  <h3 className="text-xl font-bold">{nextClassToday.name}</h3>
                  <p className="text-orange-100 text-sm mt-1">
                    {nextClassToday.schedule.time} • {nextClassToday.schedule.room}
                  </p>
                </div>
                <div className="text-right">
                  <Clock className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search classes, teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 min-h-[44px]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {subjects.map((subject) => (
              <Button
                key={subject}
                variant={filterSubject === subject ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterSubject(subject)}
                className="min-h-[44px]"
                style={filterSubject === subject ? { background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' } : {}}
              >
                {subject === "all" ? "All Subjects" : subject}
              </Button>
            ))}
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <Card
              key={cls.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => setSelectedClass(cls)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="group-hover:text-orange-600 transition-colors">
                        {cls.name}
                      </CardTitle>
                    </div>
                    <p className="text-sm text-gray-500">{cls.code}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    Grade {cls.grade}-{cls.section}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Teacher */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cls.teacher.name}</p>
                    <p className="text-xs text-gray-500 truncate">{cls.teacher.email}</p>
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{cls.schedule.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{cls.schedule.room}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{cls.students} students</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ClipboardList className="w-4 h-4" />
                    <span>{cls.upcomingHomework} pending</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <Card className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No classes found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filter</p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default StudentClassesPage;
