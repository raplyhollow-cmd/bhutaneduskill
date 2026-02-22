/**
 * School Profile View
 *
 * Slide-over panel showing school information.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Users, Building2, Award } from "lucide-react";

interface SchoolProfileViewProps {
  schoolId: string;
  onClose: () => void;
}

interface SchoolData {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  city?: string;
  district?: string;
  studentsCount?: number;
  teachersCount?: number;
  type?: string;
  level?: string;
}

// Mock data fetch
async function fetchSchoolProfile(id: string): Promise<SchoolData> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    id,
    name: "Motithang Higher Secondary School",
    code: "MHSS-001",
    email: "info@motithang.edu.bt",
    phone: "+975 2 322 345",
    city: "Thimphu",
    district: "Thimphu",
    studentsCount: 850,
    teachersCount: 45,
    type: "Public",
    level: "Higher Secondary",
  };
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

export function SchoolProfileView({ schoolId, onClose }: SchoolProfileViewProps) {
  const { data: school, isLoading } = useQuery({
    queryKey: ["school-profile", schoolId],
    queryFn: () => fetchSchoolProfile(schoolId),
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

  if (!school) {
    return (
      <div className="p-6 text-center">
        <p className="text-ceramic-dimmed">School not found</p>
      </div>
    );
  }

  const initials = school.name
    .split(" ")
    .map((n) => n?.[0] || '')
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        className="p-8 border-b border-ceramic-border"
        style={{
          background: "linear-gradient(180deg, rgb(139 92 246 / 0.1) 0%, transparent 100%)",
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between mb-4">
          <motion.div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
            style={{ background: "linear-gradient(180deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            whileHover={{ scale: 1.05 }}
          >
            {initials}
          </motion.div>
          <button onClick={onClose} className="text-ceramic-dimmed hover:text-ceramic-primary">
            ✕
          </button>
        </div>

        <h2 className="text-xl font-bold text-ceramic-primary mb-1">{school.name}</h2>
        {school.code && (
          <p className="text-sm text-purple-600 font-mono">{school.code}</p>
        )}
        <p className="text-sm text-ceramic-dimmed mt-2 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {school.city}, {school.district}
        </p>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Type & Level */}
        {(school.type || school.level) && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-wrap gap-2">
              {school.type && (
                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                  {school.type}
                </span>
              )}
              {school.level && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {school.level}
                </span>
              )}
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
          <StatCard icon={Users} label="Students" value={school.studentsCount || 0} />
          <StatCard icon={Building2} label="Teachers" value={school.teachersCount || 0} />
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
          {school.email && (
            <div className="flex items-center gap-3 p-3 bg-ceramic-gray-50 rounded-lg">
              <Mail className="w-4 h-4 text-ceramic-dimmed" />
              <a
                href={`mailto:${school.email}`}
                className="text-sm text-ceramic-primary hover:underline"
              >
                {school.email}
              </a>
            </div>
          )}
          {school.phone && (
            <div className="flex items-center gap-3 p-3 bg-ceramic-gray-50 rounded-lg">
              <Phone className="w-4 h-4 text-ceramic-dimmed" />
              <a
                href={`tel:${school.phone}`}
                className="text-sm text-ceramic-primary hover:underline"
              >
                {school.phone}
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
