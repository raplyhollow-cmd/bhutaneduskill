/**
 * STUDENT ATTENDANCE PAGE
 *
 * Fetches real attendance data from database API
 */

"use client";

import { useState, useEffect } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Calendar, QrCode } from "lucide-react";

/**
 * Status badge configuration
 */
const getStatusConfig = (status: string) => {
  const statusMap = {
    present: { label: "Present", color: "bg-green-100 text-green-700", icon: CheckCircle },
    absent: { label: "Absent", color: "bg-red-100 text-red-700", icon: XCircle },
    late: { label: "Late", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    excused: { label: "Excused", color: "bg-blue-100 text-blue-700", icon: Calendar },
  };
  return statusMap[status as keyof typeof statusMap] || statusMap.present;
};

/**
 * Date helpers
 */
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getCurrentDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split("T")[0];
};

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch real attendance from database
  useEffect(() => {
    async function loadAttendance() {
      try {
        const response = await fetch("/api/student/attendance");
        if (!response.ok) throw new Error("Failed to fetch attendance");
        const data = await response.json();
        setAttendance(data.attendance || []);
      } catch (error) {
        console.error("Error loading attendance:", error);
        setAttendance([]);
      }
    }

    loadAttendance();
  }, []);

  // Calculate statistics from real data
  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === "present").length,
    absent: attendance.filter(a => a.status === "absent").length,
    late: attendance.filter(a => a.status === "late").length,
    excused: attendance.filter(a => a.status === "excused").length,
    percentage: attendance.length > 0 ? Math.round((attendance.filter(a => a.status === "present").length / attendance.length) * 100) : 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="student" userName="Student" title="My Attendance" />

      <div className="lg:ml-64 p-6">
        {/* Quick Check-In */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4 text-white">Quick Check-In</h2>
            <p className="text-white/80">Enter your check-in code below to mark attendance</p>
            <input
              type="text"
              placeholder="Enter 5-digit code"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <Button
              onClick={() => alert("Check-in feature - QR code coming soon!")}
              className="mt-4 bg-white text-blue-600 hover:bg-blue-50"
            >
              Submit Attendance
            </Button>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600">{stats.percentage}%</div>
                <p className="text-sm text-gray-500">Attendance Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600">{stats.present}</div>
                <p className="text-sm text-gray-500">Present Days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-red-600">{stats.absent}</div>
                <p className="text-sm text-gray-500">Absent Days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-yellow-600">{stats.late}</div>
                <p className="text-sm text-gray-500">Late Arrivals</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600">{stats.excused}</div>
                <p className="text-sm text-gray-500">Excused</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 ml-2">Loading attendance data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
