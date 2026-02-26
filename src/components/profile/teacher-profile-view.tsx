/**
 * Teacher Profile View
 *
 * Slide-over panel showing teacher information.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mail, Phone, BookOpen, Users, Calendar, Award } from "lucide-react";

interface TeacherProfileViewProps {
  teacherId: string;
  onClose: () => void;
}

interface TeacherData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  subjects?: string[];
  schoolName?: string;
  classesCount?: number;
  studentsCount?: number;
  experience?: number;
  rating?: number;
}

// Fetch teacher profile from API
async function fetchTeacherProfile(id: string): Promise<TeacherData> {
  const response = await fetch(`/api/teachers/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch teacher profile");
  }
  return await response.json();
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
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

export function TeacherProfileView({ teacherId, onClose }: TeacherProfileViewProps) {
  const { data: teacher, isLoading } = useQuery({
    queryKey: ["teacher-profile", teacherId],
    queryFn: () => fetchTeacherProfile(teacherId),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-3">
          <div className="w-20 h-20 bg-ceramic-gray-100 rounded-2xl" />
          <div className="h-6 bg-ceramic-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-6 text-center">
        <p className="text-ceramic-dimmed">Teacher not found</p>
      </div>
    );
  }

  const initials = `${teacher.firstName?.[0] || ''}${teacher.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        className="p-8 border-b border-ceramic-border"
        style={{
          background: "linear-gradient(180deg, rgb(59 130 246 / 0.1) 0%, transparent 100%)",
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between mb-4">
          <motion.div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg"
            style={{ background: "linear-gradient(180deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
            whileHover={{ scale: 1.05 }}
          >
            {initials}
          </motion.div>
          <button onClick={onClose} className="text-ceramic-dimmed hover:text-ceramic-primary">
            ✕
          </button>
        </div>

        <h2 className="text-2xl font-bold text-ceramic-primary mb-1">{teacher.name}</h2>
        <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide">
          Teacher
        </p>
        <p className="text-sm text-ceramic-dimmed mt-1">{teacher.schoolName}</p>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Subjects */}
        {teacher.subjects && teacher.subjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-sm font-semibold text-ceramic-dimmed uppercase tracking-wider mb-3">
              Subjects
            </h3>
            <div className="flex flex-wrap gap-2">
              {teacher.subjects.map((subject) => (
                <span
                  key={subject}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                >
                  {subject}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard icon={Users} label="Students" value={teacher.studentsCount || 0} />
          <StatCard icon={BookOpen} label="Classes" value={teacher.classesCount || 0} />
          <StatCard icon={Calendar} label="Experience" value={`${teacher.experience || 0} yrs`} />
          <StatCard icon={Award} label="Rating" value={teacher.rating?.toFixed(1) || "N/A"} />
        </motion.div>

        {/* Contact */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-ceramic-dimmed uppercase tracking-wider">
            Contact Information
          </h3>
          {teacher.email && (
            <div className="flex items-center gap-3 p-3 bg-ceramic-gray-50 rounded-lg">
              <Mail className="w-4 h-4 text-ceramic-dimmed" />
              <a
                href={`mailto:${teacher.email}`}
                className="text-sm text-ceramic-primary hover:underline"
              >
                {teacher.email}
              </a>
            </div>
          )}
          {teacher.phone && (
            <div className="flex items-center gap-3 p-3 bg-ceramic-gray-50 rounded-lg">
              <Phone className="w-4 h-4 text-ceramic-dimmed" />
              <a
                href={`tel:${teacher.phone}`}
                className="text-sm text-ceramic-primary hover:underline"
              >
                {teacher.phone}
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
