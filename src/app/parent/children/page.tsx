"use client";

import { logger } from "@/lib/logger";
/**
 * PARENT CHILDREN PAGE
 *
 * Allows parents to manage multiple children linked to their account, including:
 * - List all children linked to parent account
 * - Child cards with quick stats (attendance, grades, fees)
 * - Switch between children for detailed view
 * - Add child verification
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChildSelector, Child } from "@/components/parent/child-selector";
import {
  Users,
  UserPlus,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Mail,
  Calendar,
  MapPin,
  FileText,
  ArrowRight,
  Plus,
  QrCode,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface ParentChild {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  classGrade?: number;
  section?: string;
  dateOfBirth?: Date | string;
  currentClass?: {
    id: string;
    name: string;
    grade: number;
    section: string;
  };
  attendanceSummary: {
    present: number;
    absent: number;
    percentage: number | null;
    totalRecorded: number;
  };
  homeworkSummary: {
    pending: number;
    submitted: number;
    total: number;
  };
  upcomingHomework?: Array<{
    id: string;
    title: string;
    subject?: string;
    dueDate: Date | string;
    status: string;
    isOverdue: boolean;
  }>;
}

// Child stats for display
interface ChildStats {
  attendanceRate: number;
  averageGrade: number;
  pendingFees: number;
  homeworkPending: number;
  recentActivity: string;
  classRank?: number;
  totalStudents?: number;
}

type ViewMode = "cards" | "list" | "details";
type AddChildDialog = "verify" | "new" | "invite" | null;

export default function ParentChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [childStats, setChildStats] = useState<Record<string, ChildStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [addChildDialog, setAddChildDialog] = useState<AddChildDialog>(null);
  const [verificationCode, setVerificationCode] = useState("");

  // Fetch children from API
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/parent/children");
        if (!response.ok) {
          throw new Error(`Failed to fetch children: ${response.statusText}`);
        }

        const data = await response.json();

        // Process API data to match our display interface
        const processedChildren: Child[] = (data.children || []).map((child: {
          id: string;
          firstName: string;
          lastName: string;
          currentClass?: {
            grade: number;
            section: string;
          };
          profilePicture?: string;
          dateOfBirth?: string;
          attendanceSummary?: {
            percentage?: number;
          };
          homeworkSummary?: {
            pending?: number;
          };
          upcomingHomework?: Array<{
            title?: string;
          }>;
        }) => {
          const attendanceRate = child.attendanceSummary?.percentage ?? 0;
          const pendingHomework = child.homeworkSummary?.pending ?? 0;

          return {
            id: child.id,
            firstName: child.firstName,
            lastName: child.lastName,
            name: `${child.firstName} ${child.lastName || ""}`.trim(),
            grade: child.currentClass ? `Class ${child.currentClass.grade}` : "Not enrolled",
            classGrade: child.currentClass?.grade,
            section: child.currentClass?.section,
            school: child.currentClass ? "Yangchenphug HSS" : "Not enrolled", // Default school name
            profilePicture: child.profilePicture,
            dateOfBirth: (() => {
              const dob = (child as ParentChild & { dateOfBirth?: Date | string | unknown }).dateOfBirth;
              if (!dob) return undefined;
              if (dob instanceof Date) return dob.toISOString();
              if (typeof dob === "string") return dob;
              return undefined;
            })(),
            assessmentCompleted: pendingHomework < 3, // Simple logic for demo
            riasecCode: undefined, // Not in API yet
            engagementLevel: attendanceRate >= 90 ? "high" : attendanceRate >= 75 ? "medium" : "low",
          };
        });

        setChildren(processedChildren);

        // Set first child as selected by default
        if (processedChildren.length > 0 && !selectedChild) {
          setSelectedChild(processedChildren[0]);
        }

        // Calculate stats for each child
        const stats: Record<string, ChildStats> = {};
        (data.children || []).forEach((child: {
          id: string;
          attendanceSummary?: { percentage?: number };
          homeworkSummary?: { pending?: number };
          upcomingHomework?: Array<{ title?: string }>;
        }) => {
          const attendanceRate = child.attendanceSummary?.percentage ?? 0;
          const pendingHomework = child.homeworkSummary?.pending ?? 0;

          stats[child.id] = {
            attendanceRate,
            averageGrade: 75, // Default placeholder - can be calculated from grades
            pendingFees: 0, // Not in API yet
            homeworkPending: pendingHomework,
            recentActivity: child.upcomingHomework?.[0]?.title || "No recent activity",
          };
        });
        setChildStats(stats);
      } catch (err) {
        logger.error("Error fetching children:", err);
        setError(err instanceof Error ? err.message : "Failed to load children");
        setChildren([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, []);

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600 bg-green-100";
    if (rate >= 80) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 80) return "text-green-600 bg-green-100";
    if (grade >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const handleAddChild = () => {
    // Will be implemented with API call
    logger.debug("Adding child with code:", verificationCode);
    setAddChildDialog(null);
    setVerificationCode("");
  };

  const parentPortalGradient = {
    background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)"
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Children
          </h1>
          <p className="text-gray-600">
            Manage and monitor all your children&apos;s progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "cards" ? "list" : "cards")}
          >
            {viewMode === "cards" ? "List View" : "Card View"}
          </Button>
          <Button
            style={parentPortalGradient}
            className="text-white"
            onClick={() => setAddChildDialog("verify")}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Child
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <p className="text-gray-600">Loading children...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">Error Loading Children</p>
                <p className="text-sm text-gray-600 mt-1">{error}</p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "rgb(107 114 128)" }} />
                  <p className="text-2xl font-bold text-gray-900">{children.length}</p>
                  <p className="text-sm text-gray-500">Children</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">
                    {children.filter(c => c.assessmentCompleted).length}
                  </p>
                  <p className="text-sm text-gray-500">Assessments Done</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-600">
                    {children.length > 0
                      ? Math.round(Object.values(childStats).reduce((sum, s) => sum + s.attendanceRate, 0) / children.length)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-500">Avg Attendance</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold text-amber-600">
                    Nu. {Object.values(childStats).reduce((sum, s) => sum + s.pendingFees, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Pending Fees</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Child Selector for Switching */}
          {selectedChild && (
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-2" style={{ borderColor: "rgb(229 231 235)" }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Quick Child Switch</span>
                </div>
                <ChildSelector
                  children={children}
                  selectedChildId={selectedChild.id}
                  onChildChange={(child) => setSelectedChild(child)}
                  variant="tabs"
                  showDetails
                />
              </CardContent>
            </Card>
          )}

          {/* Children Cards/List View */}
          <div className={viewMode === "cards" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {children.map((child) => {
              const stats = childStats[child.id];
              const isSelected = selectedChild?.id === child.id;

              return (
                <Card
                  key={child.id}
                  className={`transition-all hover:shadow-lg cursor-pointer ${
                    isSelected ? "ring-2 ring-gray-400" : ""
                  }`}
                  onClick={() => setSelectedChild(child)}
                >
                  <CardContent className="pt-6">
                    {/* Child Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                        style={parentPortalGradient}
                      >
                        {child.firstName?.[0]}{child.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">
                          {child.firstName} {child.lastName}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {child.grade} {child.section && `· ${child.section}`}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {child.school}
                        </p>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {child.assessmentCompleted ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Assessed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          <Clock className="w-3 h-3 mr-1" />
                          Assessment Pending
                        </Badge>
                      )}
                      {child.riasecCode && (
                        <Badge variant="secondary">{child.riasecCode}</Badge>
                      )}
                      {child.engagementLevel && (
                        <Badge
                          className={
                            child.engagementLevel === "high"
                              ? "bg-green-100 text-green-700"
                              : child.engagementLevel === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {child.engagementLevel === "high" && "High"}
                          {child.engagementLevel === "medium" && "Medium"}
                          {child.engagementLevel === "low" && "Low"} engagement
                        </Badge>
                      )}
                    </div>

                    {/* Quick Stats */}
                    {stats && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className={`text-lg font-bold ${getAttendanceColor(stats.attendanceRate).split(" ")[0]}`}>
                            {stats.attendanceRate}%
                          </p>
                          <p className="text-xs text-gray-500">Attendance</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className={`text-lg font-bold ${getGradeColor(stats.averageGrade).split(" ")[0]}`}>
                            {stats.averageGrade}%
                          </p>
                          <p className="text-xs text-gray-500">Avg Grade</p>
                        </div>
                        {stats.classRank && (
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-lg font-bold text-gray-900">
                              #{stats.classRank}/{stats.totalStudents}
                            </p>
                            <p className="text-xs text-gray-500">Class Rank</p>
                          </div>
                        )}
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className={`text-lg font-bold ${stats.homeworkPending > 0 ? "text-yellow-600" : "text-green-600"}`}>
                            {stats.homeworkPending}
                          </p>
                          <p className="text-xs text-gray-500">Pending HW</p>
                        </div>
                      </div>
                    )}

                    {/* Recent Activity */}
                    {stats && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Recent Activity</p>
                        <p className="text-sm text-gray-700 line-clamp-1">{stats.recentActivity}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/parent/progress?child=${child.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        style={parentPortalGradient}
                        asChild
                      >
                        <Link href={`/parent/dashboard?child=${child.id}`}>
                          Details
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>

                    {/* Pending Fees Alert */}
                    {stats && stats.pendingFees > 0 && (
                      <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded flex items-center gap-2 text-sm text-amber-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Nu. {stats.pendingFees.toLocaleString()} fees pending</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Selected Child Details Panel */}
          {selectedChild && (
            <Card className="border-2" style={{ borderColor: "rgb(107 114 128)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" style={{ color: "rgb(107 114 128)" }} />
                  {selectedChild.firstName} {selectedChild.lastName}&apos;s Overview
                </CardTitle>
                <CardDescription>Quick access to all information for this child</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                    <Link href={`/parent/attendance?child=${selectedChild.id}`}>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <span className="font-medium">Attendance</span>
                      <span className="text-xs text-gray-500">View records</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                    <Link href={`/parent/homework?child=${selectedChild.id}`}>
                      <FileText className="w-6 h-6 text-blue-500" />
                      <span className="font-medium">Homework</span>
                      <span className="text-xs text-gray-500">Track submissions</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                    <Link href={`/parent/careers?child=${selectedChild.id}`}>
                      <GraduationCap className="w-6 h-6 text-purple-500" />
                      <span className="font-medium">Career</span>
                      <span className="text-xs text-gray-500">Explore paths</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                    <Link href={`/parent/assessments?child=${selectedChild.id}`}>
                      <TrendingUp className="w-6 h-6 text-orange-500" />
                      <span className="font-medium">Assessments</span>
                      <span className="text-xs text-gray-500">View results</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Child Dialog */}
      {addChildDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add a Child to Your Account</CardTitle>
              <CardDescription>Link your child by entering their verification code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Verification Method */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Verification Code from School
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="flex-1 border rounded-md px-3 py-2 text-center text-lg tracking-widest"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                  <Button variant="outline" size="icon">
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get this code from your child&apos;s school or the student profile
                </p>
              </div>

              {/* Alternative Methods */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Or add child by:</p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/parent/children/add-cid">
                      <Mail className="w-4 h-4 mr-2" />
                      Enter Student CID
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/parent/children/add-email">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitation Email
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setAddChildDialog(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  style={parentPortalGradient}
                  onClick={handleAddChild}
                  disabled={verificationCode.length !== 6}
                >
                  Verify & Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Back to Dashboard */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/parent">
            Back to Parent Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
