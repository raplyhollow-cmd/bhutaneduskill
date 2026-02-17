"use client";
import { logger } from "@/lib/logger";

/**
 * STUDENT ATTENDANCE PAGE
 *
 * Features:
 * - View attendance history with statistics
 * - Self check-in with geolocation or QR code
 * - Duplicate check-in prevention
 */


import { useState, useEffect, useCallback } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  QrCode,
  Loader2,
} from "lucide-react";

// Types for API responses
interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkInTime: string;
  checkOutTime: string | null;
  notes: string | null;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

interface CheckInStatus {
  hasCheckedIn: boolean;
  canCheckIn: boolean;
  attendance: {
    id: string;
    date: string;
    checkInTime: string;
    status: string;
    entryMethod: string | null;
    notes: string | null;
  } | null;
  message: string;
}

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

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState("");

  // Fetch attendance records
  const fetchAttendance = useCallback(async () => {
    try {
      const response = await fetch("/api/student/attendance");
      if (!response.ok) throw new Error("Failed to fetch attendance");
      const data = await response.json();
      setAttendance(data.attendance || []);
    } catch (error) {
      logger.error("Error loading attendance:", error);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch check-in status
  const fetchCheckInStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/student/attendance/check-in");
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      setCheckInStatus(data.data);
    } catch (error) {
      logger.error("Error loading check-in status:", error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAttendance();
    fetchCheckInStatus();
  }, [fetchAttendance, fetchCheckInStatus]);

  // Handle check-in with geolocation
  const handleGeoCheckIn = async () => {
    setCheckInLoading(true);
    setCheckInMessage(null);

    try {
      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      // Send check-in request
      const response = await fetch("/api/student/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "geolocation",
          latitude,
          longitude,
          accuracy,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCheckInMessage(data.data.message || "Checked in successfully");
        // Refresh status and attendance
        await fetchCheckInStatus();
        await fetchAttendance();
      } else {
        setCheckInMessage(data.error || "Check-in failed");
      }
    } catch (error: unknown) {
      if (error instanceof GeolocationPositionError) {
        setCheckInMessage(`Location error: ${error.message}`);
      } else {
        setCheckInMessage("Failed to check in. Please try again.");
      }
      logger.error("Check-in error:", error);
    } finally {
      setCheckInLoading(false);
    }
  };

  // Handle QR code check-in
  const handleQrCheckIn = async () => {
    if (!qrCode.trim()) {
      setCheckInMessage("Please enter a QR code");
      return;
    }

    setCheckInLoading(true);
    setCheckInMessage(null);

    try {
      const response = await fetch("/api/student/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "qr_code",
          qrCode: qrCode.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCheckInMessage(data.data.message || "Checked in successfully");
        setQrCode("");
        // Refresh status and attendance
        await fetchCheckInStatus();
        await fetchAttendance();
      } else {
        setCheckInMessage(data.error || "Check-in failed");
      }
    } catch (error) {
      logger.error("QR check-in error:", error);
      setCheckInMessage("Failed to check in. Please try again.");
    } finally {
      setCheckInLoading(false);
    }
  };

  // Calculate statistics
  const stats: AttendanceStats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    late: attendance.filter((a) => a.status === "late").length,
    excused: attendance.filter((a) => a.status === "excused").length,
    percentage:
      attendance.length > 0
        ? Math.round(
            (attendance.filter((a) => a.status === "present").length / attendance.length) * 100
          )
        : 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="student" userName="Student" title="My Attendance" />

      <div className="lg:ml-64 p-6">
        {/* Check-In Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Daily Check-In
            </h2>

            {checkInStatus?.hasCheckedIn ? (
              <div className="bg-white/20 rounded-lg p-4 mb-4">
                <p className="text-white font-medium">
                  Already checked in today at {checkInStatus.attendance?.checkInTime}
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Status: {checkInStatus.attendance?.status === "late" ? "Late" : "On time"}
                </p>
              </div>
            ) : (
              <>
                {/* Check-in Message */}
                {checkInMessage && (
                  <div
                    className={`mb-4 p-3 rounded-lg ${
                      checkInMessage.includes("success") || checkInMessage.includes("Checked")
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {checkInMessage}
                  </div>
                )}

                {/* Geolocation Check-in */}
                <div className="mb-4">
                  <p className="text-white/80 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Check in with your location
                  </p>
                  <Button
                    onClick={handleGeoCheckIn}
                    disabled={checkInLoading}
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    {checkInLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking in...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        Check In with Location
                      </>
                    )}
                  </Button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-white/30" />
                  <span className="text-white/70 text-sm">or</span>
                  <div className="flex-1 h-px bg-white/30" />
                </div>

                {/* QR Code Check-in */}
                <div>
                  <p className="text-white/80 mb-3 flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    Enter your check-in code
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      placeholder="Enter 5-digit code"
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      disabled={checkInLoading}
                      maxLength={10}
                    />
                    <Button
                      onClick={handleQrCheckIn}
                      disabled={checkInLoading || !qrCode.trim()}
                      className="bg-white text-blue-600 hover:bg-blue-50"
                    >
                      {checkInLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
        </div>

        {/* Attendance History */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Attendance History</h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-gray-600 ml-2">Loading attendance data...</p>
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No attendance records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Check-in</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => {
                      const config = getStatusConfig(record.status);
                      const Icon = config.icon;
                      return (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{formatDate(record.date)}</td>
                          <td className="py-3 px-4">{record.checkInTime}</td>
                          <td className="py-3 px-4">
                            <Badge className={config.color}>
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm">
                            {record.notes || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
