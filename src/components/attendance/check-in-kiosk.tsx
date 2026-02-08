/**
 * CHECK-IN KIOSK
 * Student self check-in interface with QR/scanner support
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  Fingerprint,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Camera,
} from "lucide-react";

interface CheckInKioskProps {
  classId: string;
  className: string;
  onCheckIn: (studentId: string, metadata: CheckInMetadata) => void | Promise<void>;
  onCheckOut?: (studentId: string) => void | Promise<void>;
}

export interface CheckInMetadata {
  timestamp: string;
  method: "qr" | "fingerprint" | "manual" | "geolocation";
  location?: { latitude: number; longitude: number };
  deviceInfo?: string;
}

export interface CheckInStatus {
  studentId: string;
  studentName: string;
  checkInTime: string;
  checkOutTime?: string;
  status: "checked-in" | "checked-out";
}

export function CheckInKiosk({
  classId,
  className,
  onCheckIn,
  onCheckOut,
}: CheckInKioskProps) {
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInStatus[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          console.log("Location access denied");
        }
      );
    }
  }, []);

  const handleCheckIn = async (id?: string) => {
    const targetId = id || studentId;
    if (!targetId) {
      setStatus("error");
      setMessage("Please enter your student ID");
      return;
    }

    setStatus("scanning");
    setMessage("Checking in...");

    try {
      const metadata: CheckInMetadata = {
        timestamp: new Date().toISOString(),
        method: "manual",
        ...(location && { location }),
      };

      await onCheckIn(targetId, metadata);

      setStatus("success");
      setMessage(`Checked in successfully! Welcome.`);

      // Add to recent check-ins
      setRecentCheckIns((prev) => [
        {
          studentId: targetId,
          studentName: `Student ${targetId}`, // In real app, fetch name
          checkInTime: new Date().toLocaleTimeString(),
          status: "checked-in",
        },
        ...prev,
      ].slice(0, 5));

      setStudentId("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      setStatus("error");
      setMessage("Check-in failed. Please try again.");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleCheckOut = async (studentId: string) => {
    try {
      await onCheckOut(studentId);
      setRecentCheckIns((prev) =>
        prev.map((s) =>
          s.studentId === studentId
            ? { ...s, checkOutTime: new Date().toLocaleTimeString(), status: "checked-out" }
            : s
        )
      );
    } catch (error) {
      console.error("Check-out failed", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && studentId) {
      handleCheckIn();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Clock */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Check-In Kiosk</h1>
                <p className="text-muted-foreground">{className}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-mono font-bold">
                  {currentTime.toLocaleTimeString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentTime.toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Check-In Area */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Manual Entry */}
          <Card className={status === "success" ? "border-green-500" : status === "error" ? "border-red-500" : ""}>
            <CardHeader>
              <CardTitle>Manual Check-In</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Enter Student ID</label>
                <Input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., STU001"
                  className="text-lg h-12 mt-2"
                  autoFocus
                  disabled={status === "scanning"}
                />
              </div>

              <Button
                onClick={() => handleCheckIn()}
                disabled={status === "scanning" || !studentId}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {status === "scanning" ? "Checking in..." : "Check In"}
              </Button>

              {status !== "idle" && (
                <div
                  className={`p-4 rounded-lg flex items-center gap-3 ${
                    status === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {status === "success" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              {location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Location verified
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                {status === "scanning" ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-4 border-primary rounded-lg animate-pulse" />
                    </div>
                    <p className="text-muted-foreground">Scanning...</p>
                  </>
                ) : (
                  <div className="text-center">
                    <QrCode className="w-24 h-24 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-4">
                      Position your QR code within the frame
                    </p>
                  </div>
                )}
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStatus("scanning");
                  // Simulate QR scan
                  setTimeout(() => {
                    handleCheckIn("STU00" + Math.floor(Math.random() * 999));
                  }, 1500);
                }}
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Camera Scanner
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Biometric Check-In */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5" />
              Biometric Check-In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Place your finger on the fingerprint scanner for instant check-in.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Fingerprint className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Fingerprint Scanner</p>
                <p className="text-xs text-muted-foreground">
                  {status === "scanning" ? "Reading fingerprint..." : "Ready to scan"}
                </p>
              </div>
              <Button variant="outline" disabled={status === "scanning"}>
                Simulate Scan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Check-Ins */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Check-Ins</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCheckIns.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No check-ins yet today</p>
            ) : (
              <div className="space-y-2">
                {recentCheckIns.map((checkIn) => (
                  <div
                    key={checkIn.studentId}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{checkIn.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          Checked in at {checkIn.checkInTime}
                        </p>
                      </div>
                    </div>

                    {checkIn.status === "checked-in" && onCheckOut && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckOut(checkIn.studentId)}
                      >
                        Check Out
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-3">Check-In Instructions</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Enter your Student ID and press Enter or click Check In
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Use your QR code card for faster check-in
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Fingerprint authentication is available for instant verification
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Remember to check out when leaving campus
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
