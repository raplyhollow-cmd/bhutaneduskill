/**
 * STUDENT ATTENDANCE PAGE
 * View attendance history and check in
 */
"use client";

import { PortalHeader } from "@/components/shared/portal-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, Calendar, QrCode } from "lucide-react";

// Mock attendance data
const mockAttendance = [
  { date: "2025-02-08", status: "present", checkIn: "08:45", checkOut: "15:30" },
  { date: "2025-02-07", status: "present", checkIn: "08:50", checkOut: "15:30" },
  { date: "2025-02-06", status: "present", checkIn: "08:55", checkOut: "15:30" },
  { date: "2025-02-05", status: "late", checkIn: "09:15", checkOut: "15:30" },
  { date: "2025-02-04", status: "absent", checkIn: null, checkOut: null },
  { date: "2025-02-03", status: "present", checkIn: "08:40", checkOut: "15:30" },
  { date: "2025-02-02", status: "excused", checkIn: null, checkOut: null },
  { date: "2025-02-01", status: "present", checkIn: "08:45", checkOut: "15:30" },
];

const attendanceStats = {
  total: 30,
  present: 24,
  absent: 2,
  late: 2,
  excused: 2,
  percentage: 85,
};

export default function StudentAttendancePage() {
  const getStatusBadge = (status: string) => {
    const config = {
      present: { label: "Present", color: "bg-green-100 text-green-700", icon: CheckCircle },
      absent: { label: "Absent", color: "bg-red-100 text-red-700", icon: XCircle },
      late: { label: "Late", color: "bg-yellow-100 text-yellow-700", icon: Clock },
      excused: { label: "Excused", color: "bg-blue-100 text-blue-700", icon: Calendar },
    };
    const { label, color, icon: Icon } = config[status as keyof typeof config];
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="student" userName="Student" title="My Attendance" />
      <div className="lg:ml-64 p-6">
        {/* Quick Check-In */}
        <Card className="mb-6 bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Quick Check-In</h2>
                <p className="text-white/80">Scan QR code or enter code to mark your attendance</p>
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                <QrCode className="w-5 h-5 mr-2" />
                Scan QR Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{attendanceStats.percentage}%</p>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                <p className="text-sm text-muted-foreground">Present Days</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                <p className="text-sm text-muted-foreground">Absent Days</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
                <p className="text-sm text-muted-foreground">Late Arrivals</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{attendanceStats.excused}</p>
                <p className="text-sm text-muted-foreground">Excused</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance History */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Attendance History</h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Day</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Check In</th>
                    <th className="text-left py-3 px-4">Check Out</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAttendance.map((record, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(record.date).toLocaleDateString("en-US", { weekday: "long" })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="py-3 px-4">
                        {record.checkIn || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {record.checkOut || <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Calendar View */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">February 2025</h3>
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {/* Empty cells for days before Feb 1 */}
              {[...Array(6)].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days of February */}
              {Array.from({ length: 28 }, (_, i) => {
                const date = `2025-02-${String(i + 1).padStart(2, "0")}`;
                const record = mockAttendance.find((r) => r.date === date);
                const isToday = new Date().toISOString().startsWith("2025-02-") &&
                  new Date().getDate() === i + 1;

                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm relative
                      ${isToday ? "bg-primary text-white font-bold" : "hover:bg-muted"}
                      ${record?.status === "absent" ? "bg-red-50" : ""}
                      ${record?.status === "present" ? "bg-green-50" : ""}
                    `}
                  >
                    {i + 1}
                    {record && (
                      <div className={`absolute bottom-1 w-2 h-2 rounded-full ${
                        record.status === "present" ? "bg-green-500" :
                        record.status === "absent" ? "bg-red-500" :
                        record.status === "late" ? "bg-yellow-500" :
                        "bg-blue-500"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
