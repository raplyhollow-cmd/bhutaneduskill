/**
 * Student Profile View
 *
 * Slide-over panel showing student information with AI insights.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Phone, Calendar, MapPin, TrendingUp, Award, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ceramicColors, ceramicSpacing } from "@/lib/design-system";
import type { ReactNode } from "react";

interface StudentProfileViewProps {
  studentId: string;
  onClose: () => void;
}

interface StudentData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  classGrade?: string;
  schoolName?: string;
  attendance?: number;
  feeStatus?: "clear" | "pending" | "overdue";
  gpa?: number;
  careerMatch?: string;
  aiInsight?: string;
}

// Fetch student profile from API
async function fetchStudentProfile(id: string): Promise<StudentData> {
  const response = await fetch(`/api/students/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch student profile");
  }
  return await response.json();
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "ceramic-gray",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="p-4 bg-white border border-ceramic-border rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-ceramic-dimmed" />
        <p className="text-[10px] text-ceramic-dimmed uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className="text-xl font-bold text-ceramic-primary">{value}</p>
    </div>
  );
}

export function StudentProfileView({ studentId, onClose }: StudentProfileViewProps) {
  const { data: student, isLoading } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: () => fetchStudentProfile(studentId),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-3">
          <div className="w-20 h-20 bg-ceramic-gray-100 rounded-2xl" />
          <div className="h-6 bg-ceramic-gray-100 rounded w-1/2" />
          <div className="h-4 bg-ceramic-gray-100 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p className="text-ceramic-dimmed">Student not found</p>
      </div>
    );
  }

  const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Header with gradient background */}
      <motion.div
        className="p-8 border-b border-ceramic-border"
        style={{
          background: "linear-gradient(180deg, rgb(249 115 22 / 0.1) 0%, transparent 100%)",
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Avatar */}
        <div className="flex items-start justify-between mb-4">
          <motion.div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg"
            style={{ background: "linear-gradient(180deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {initials}
          </motion.div>
          <button
            onClick={onClose}
            className="text-ceramic-dimmed hover:text-ceramic-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Name and info */}
        <h2 className="text-2xl font-bold text-ceramic-primary mb-1">{student.name}</h2>
        <p className="text-sm text-orange-600 font-semibold uppercase tracking-wide mb-3">
          {student.classGrade}
        </p>
        <p className="text-sm text-ceramic-dimmed flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {student.schoolName}
        </p>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* AI Insights Card */}
        <motion.div
          className="p-4 bg-orange-50 border border-orange-100 rounded-xl relative overflow-hidden"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
              AI Smart Insights
            </p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed italic">"{student.aiInsight}"</p>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard icon={Calendar} label="Attendance" value={`${student.attendance}%`} />
          <StatCard
            icon={Award}
            label="Fee Status"
            value={student.feeStatus === "clear" ? "Clear" : student.feeStatus}
            color={student.feeStatus === "clear" ? "green" : "orange"}
          />
          <StatCard icon={BookOpen} label="GPA" value={student.gpa?.toFixed(2) || "N/A"} />
          <StatCard icon={GraduationCap} label="Career Match" value={student.careerMatch || "Exploring"} />
        </motion.div>

        {/* Contact Information */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-ceramic-dimmed uppercase tracking-wider">
            Contact Information
          </h3>
          {student.email && (
            <div className="flex items-center gap-3 p-3 bg-ceramic-gray-50 rounded-lg">
              <Mail className="w-4 h-4 text-ceramic-dimmed" />
              <a
                href={`mailto:${student.email}`}
                className="text-sm text-ceramic-primary hover:underline"
              >
                {student.email}
              </a>
            </div>
          )}
          {student.phone && (
            <div className="flex items-center gap-3 p-3 bg-ceramic-gray-50 rounded-lg">
              <Phone className="w-4 h-4 text-ceramic-dimmed" />
              <a
                href={`tel:${student.phone}`}
                className="text-sm text-ceramic-primary hover:underline"
              >
                {student.phone}
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
