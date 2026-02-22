/**
 * PARENT DASHBOARD - Government School Style
 *
 * A mobile-first "Peace-of-Mind" dashboard for Bhutanese parents.
 *
 * Focus areas:
 * 1. Daily attendance/safety (the most important daily check)
 * 2. Annual SDF status (once-a-year action)
 * 3. Teacher feedback (behavior logs)
 * 4. Quick actions for other features
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MessageSquare,
  FileText,
  GraduationCap,
  Settings,
  Bell,
  User,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Bento grid card components
interface BentoCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  action?: string;
  actionHref?: string;
  gradient?: string;
  onClick?: () => void;
}

function BentoCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  badgeColor,
  action,
  actionHref,
  gradient,
  onClick,
}: BentoCardProps) {
  const cardContent = (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4",
        "hover:shadow-md transition-all duration-200",
        "min-h-[120px] flex flex-col justify-between",
        onClick && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={onClick}
      style={gradient ? { background: gradient } : undefined}
    >
      {badge && (
        <span
          className={cn(
            "absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium rounded-full",
            badgeColor
          )}
        >
          {badge}
        </span>
      )}

      <div className="flex items-start justify-between">
        <div className={cn("flex items-center gap-3", gradient ? "text-white" : "")}>
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              gradient ? "bg-white/20" : "bg-gray-100"
            )}
          >
            {icon}
          </div>
          <div>
            <p className={cn("text-xs font-medium uppercase tracking-wider", gradient ? "text-white/80" : "text-gray-500")}>
              {title}
            </p>
            {value && (
              <p className={cn("text-xl font-bold mt-1", gradient ? "text-white" : "text-gray-900")}>
                {value}
              </p>
            )}
          </div>
        </div>

        {actionHref && (
          <ChevronRight className={cn("w-5 h-5", gradient ? "text-white/60" : "text-gray-400")} />
        )}
      </div>

      {subtitle && (
        <p className={cn("text-sm mt-2", gradient ? "text-white/90" : "text-gray-600")}>
          {subtitle}
        </p>
      )}

      {action && (
        <div className="mt-3">
          <span
            className={cn(
              "text-xs font-semibold",
              gradient ? "text-white" : "text-gray-700"
            )}
          >
            {action}
          </span>
        </div>
      )}
    </div>
  );

  if (actionHref && !onClick) {
    return <Link href={actionHref}>{cardContent}</Link>;
  }

  return cardContent;
}

interface Child {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  classGrade?: string;
  section?: string;
  schoolId?: string;
}

interface AttendanceData {
  status: "present" | "absent" | "late" | "excused";
  checkInTime?: string;
  date: string;
  teacher?: string;
}

interface FeeData {
  isPaid: boolean;
  amountPaid?: number;
  amountPending?: number;
  totalAmount?: number;
  sessionYear?: string;
}

export default function ParentDashboardPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [feeStatus, setFeeStatus] = useState<FeeData | null>(null);
  const [latestFeedback, setLatestFeedback] = useState<{
    message: string;
    teacher: string;
    date: string;
    type: "merit" | "demerit";
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch children
      const childrenRes = await fetch("/api/parent/children");
      if (childrenRes.ok) {
        const childrenData = await childrenRes.json();
        if (childrenData.children && childrenData.children.length > 0) {
          setChildren(childrenData.children);
          setSelectedChild(childrenData.children[0]);
          await fetchChildData(childrenData.children[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (childId: string) => {
    try {
      // Fetch attendance
      const attRes = await fetch(`/api/parent/attendance?childId=${childId}&limit=1`);
      if (attRes.ok) {
        const attData = await attRes.json();
        if (attData.attendance && attData.attendance.length > 0) {
          setAttendance({
            status: attData.attendance[0].status,
            checkInTime: attData.attendance[0].checkInTime,
            date: attData.attendance[0].date,
          });
        }
      }

      // Fetch fees
      const feeRes = await fetch("/api/parent/fees");
      if (feeRes.ok) {
        const feeData = await feeRes.json();
        if (feeData.data && feeData.data.children && feeData.data.children.length > 0) {
          const childFees = feeData.data.children[0];
          setFeeStatus({
            isPaid: childFees.totalPending === 0,
            amountPaid: childFees.totalPaid,
            amountPending: childFees.totalPending,
            totalAmount: childFees.totalFees,
          });
        }
      }

      // Fetch behavior logs (teacher feedback)
      // This would be a new API endpoint
    } catch (error) {
      console.error("Error fetching child data:", error);
    }
  };

  const handleChildChange = (child: Child) => {
    setSelectedChild(child);
    fetchChildData(child.id);
  };

  // Get attendance display
  const getAttendanceDisplay = () => {
    if (!attendance) {
      return {
        icon: <Clock className="w-6 h-6" />,
        status: "No Data",
        statusColor: "text-gray-600",
        bgColor: "bg-gray-50",
        message: "No attendance recorded yet",
      };
    }

    switch (attendance.status) {
      case "present":
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          status: "PRESENT",
          statusColor: "text-green-600",
          bgColor: "bg-green-50 border-green-200",
          message: attendance.checkInTime ? `Arrived at ${attendance.checkInTime}` : "In Class",
        };
      case "absent":
        return {
          icon: <XCircle className="w-6 h-6 text-red-600" />,
          status: "ABSENT",
          statusColor: "text-red-600",
          bgColor: "bg-red-50 border-red-200",
          message: "Not marked present today",
        };
      case "late":
        return {
          icon: <Clock className="w-6 h-6 text-yellow-600" />,
          status: "LATE",
          statusColor: "text-yellow-600",
          bgColor: "bg-yellow-50 border-yellow-200",
          message: attendance.checkInTime ? `Arrived at ${attendance.checkInTime}` : "Arrived late",
        };
      default:
        return {
          icon: <Clock className="w-6 h-6 text-blue-600" />,
          status: "EXCUSED",
          statusColor: "text-blue-600",
          bgColor: "bg-blue-50 border-blue-200",
          message: "Excused absence",
        };
    }
  };

  const attendanceDisplay = getAttendanceDisplay();
  const isGovernmentFee = feeStatus?.totalAmount && feeStatus.totalAmount < 5000; // Rough heuristic

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">No Children Linked</h2>
            <p className="text-gray-600 mb-4">
              Please link your children to view their dashboard
            </p>
            <Button asChild>
              <Link href="/parent/link-child">Link Child</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{selectedChild ? `, ${selectedChild.firstName || selectedChild.name.split(" ")[0]}'s parent` : ""}
        </h1>
        <p className="text-gray-600">Here's what's happening today</p>
      </div>

      {/* Child Selector (if multiple children) */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => handleChildChange(child)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all",
                selectedChild?.id === child.id
                  ? "border-gray-600 bg-gray-600 text-white"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              {child.firstName || child.name}
            </button>
          ))}
        </div>
      )}

      {/* Primary Bento Grid - Focus on Peace of Mind */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Safe Arrival - Most Important! */}
        <div className={cn(
          "col-span-1 md:col-span-1 rounded-xl p-4 border-2",
          attendanceDisplay.bgColor
        )}>
          <div className="flex items-center gap-2 mb-3">
            {attendanceDisplay.icon}
            <span className={cn("text-xs font-bold uppercase", attendanceDisplay.statusColor)}>
              {attendanceDisplay.status}
            </span>
          </div>
          <p className="text-sm text-gray-700 font-medium">{attendanceDisplay.message}</p>
          {selectedChild && (
            <p className="text-xs text-gray-500 mt-2">
              {selectedChild.classGrade && `Class ${selectedChild.classGrade}`}
              {selectedChild.section && `-${selectedChild.section}`}
            </p>
          )}
        </div>

        {/* Annual Session Fees */}
        <Link href="/parent/fees/pay" className="col-span-1">
          <BentoCard
            title={`${new Date().getFullYear()} Session`}
            value={feeStatus?.isPaid ? "CLEARED" : "PENDING"}
            subtitle={
              feeStatus?.isPaid
                ? "All fees paid for this session"
                : `Nu. ${feeStatus?.amountPending?.toLocaleString() || 0} pending`
            }
            icon={<span className="text-2xl">💰</span>}
            badge={feeStatus?.isPaid ? "✓" : "!"}
            badgeColor={feeStatus?.isPaid ? "bg-green-500 text-white" : "bg-orange-500 text-white"}
            action="View Details"
            gradient={feeStatus?.isPaid
              ? "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)"
              : "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)"
            }
          />
        </Link>

        {/* Latest Teacher Feedback */}
        <div className="col-span-2 md:col-span-1">
          <BentoCard
            title="Latest Feedback"
            subtitle={latestFeedback?.message || "No recent feedback from teachers"}
            icon={<MessageSquare className="w-6 h-6 text-purple-600" />}
            badge={latestFeedback?.type === "merit" ? "⭐" : undefined}
            badgeColor="bg-yellow-100 text-yellow-700"
          />
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BentoCard
            title="Attendance"
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            action="View Full"
            actionHref="/parent/attendance"
          />

          <BentoCard
            title="Progress"
            icon={<GraduationCap className="w-5 h-5 text-blue-600" />}
            action="View Grades"
            actionHref="/parent/progress"
          />

          <BentoCard
            title="Messages"
            icon={<MessageSquare className="w-5 h-5 text-purple-600" />}
            action="Communicate"
            actionHref="/parent/messages"
          />

          <BentoCard
            title="Homework"
            icon={<FileText className="w-5 h-5 text-orange-600" />}
            action="View Tasks"
            actionHref="/parent/homework"
          />
        </div>
      </div>

      {/* Fee Breakdown Card (if not paid) */}
      {feeStatus && !feeStatus.isPaid && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Session Fees Pending</h3>
                <p className="text-sm text-gray-600">
                  Nu. {feeStatus.amountPending?.toLocaleString() || 0} of {feeStatus.totalAmount?.toLocaleString() || 0} remaining
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/parent/fees/pay">Pay Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
