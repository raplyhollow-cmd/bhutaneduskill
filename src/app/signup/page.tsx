"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Users,
  UserPlus,
  School,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardDescription, PremiumCardContent } from "@/components/admin/premium-card";
import { Button } from "@/components/ui/button";

// Role definitions matching the unified setup wizard
const INSTITUTIONAL_ROLES = [
  {
    id: "school-admin",
    name: "School Admin",
    description: "Manage school, students, teachers, and operations",
    icon: School,
    color: "rgb(139 92 246)",
    colorTo: "rgb(124 58 237)",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    badge: "Institutional",
  },
  {
    id: "counselor",
    name: "Counselor",
    description: "Guide students through career and personal development",
    icon: UserPlus,
    color: "rgb(168 85 247)",
    colorTo: "rgb(147 51 234)",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    badge: "Institutional",
  },
];

const GENERAL_ROLES = [
  {
    id: "student",
    name: "Student",
    description: "Take assessments, explore careers, track your progress",
    icon: GraduationCap,
    color: "rgb(249 115 22)",
    colorTo: "rgb(194 65 12)",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    badge: undefined,
  },
  {
    id: "teacher",
    name: "Teacher",
    description: "Manage classes, homework, track student progress",
    icon: BookOpen,
    color: "rgb(59 130 246)",
    colorTo: "rgb(37 99 235)",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    badge: undefined,
  },
  {
    id: "parent",
    name: "Parent",
    description: "Monitor your child's progress and communicate",
    icon: Users,
    color: "rgb(107 114 128)",
    colorTo: "rgb(75 85 99)",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    badge: undefined,
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  const handleRoleSelect = (roleId: string, isInstitutional: boolean) => {
    if (isInstitutional) {
      router.push(`/signup/institutional?role=${roleId}`);
    } else {
      router.push(`/signup/general?role=${roleId}`);
    }
  };

  const renderRoleCard = (role: typeof INSTITUTIONAL_ROLES[0] | typeof GENERAL_ROLES[0], isInstitutional: boolean, index: number) => {
    const Icon = role.icon;
    return (
      <motion.button
        key={role.id}
        type="button"
        onClick={() => handleRoleSelect(role.id, isInstitutional)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        onMouseEnter={() => setHoveredRole(role.id)}
        onMouseLeave={() => setHoveredRole(null)}
        className="group relative w-full text-left"
      >
        <PremiumCard
          className={`
            h-full transition-all duration-300 cursor-pointer
            ${hoveredRole === role.id ? "-translate-y-1" : ""}
            ${role.borderColor}
          `}
          hover={false}
        >
          <div className="flex items-start gap-4">
            {/* Icon container with gradient */}
            <div
              className={`
                w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
                transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
              `}
              style={{ background: `linear-gradient(135deg, ${role.color} 0%, ${role.colorTo} 100%)` }}
            >
              <Icon className="w-7 h-7 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900 text-lg">{role.name}</h3>
                {role.badge && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                    {role.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                {role.description}
              </p>
            </div>

            {/* Arrow indicator - shown on hover */}
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                transition-all duration-300
                ${hoveredRole === role.id ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}
              `}
              style={{ backgroundColor: `${role.color}15` }}
            >
              <ArrowRight className="w-4 h-4" style={{ color: role.color }} />
            </div>
          </div>

          {/* Hover overlay with subtle gradient */}
          <div
            className={`
              absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300
              ${hoveredRole === role.id ? "opacity-100" : "opacity-0"}
            `}
            style={{
              background: `linear-gradient(135deg, ${role.color}08 0%, ${role.colorTo}08 100%)`,
              margin: "1px",
            }}
          />
        </PremiumCard>
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">Bhutan EduSkill</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">Join Bhutan's Education Platform</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-slate-900"
          >
            Choose Your Role
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Select how you'll participate in the education ecosystem to get started with your personalized experience.
          </motion.p>
        </div>

        {/* Institutional Roles Section */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <School className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Institutional Roles</h2>
              <p className="text-sm text-slate-500">For school administrators and counselors - requires school code</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INSTITUTIONAL_ROLES.map((role, index) => renderRoleCard(role, true, index))}
          </div>
        </section>

        {/* General Users Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">General Users</h2>
              <p className="text-sm text-slate-500">For students, teachers, and parents - sign up first, then join your school</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GENERAL_ROLES.map((role, index) => renderRoleCard(role, false, index))}
          </div>
        </section>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 text-sm">How signup works</h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>&bull; <strong>Institutional roles:</strong> Enter your school code first, then create your account. Your application will be reviewed.</li>
              <li>&bull; <strong>General users:</strong> Create your account first, then enter your school code to join your school.</li>
            </ul>
          </div>
        </motion.div>

        {/* Sign In Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-sm text-slate-600"
        >
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-purple-600 hover:text-purple-700">
            Sign in
          </Link>
        </motion.p>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Bhutan EduSkill. Multi-tenant education management platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
