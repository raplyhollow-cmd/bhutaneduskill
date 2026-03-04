"use client";

import Link from "next/link";
import { ArrowRight, User, ClipboardCheck, Sparkles, GraduationCap, Trophy, GraduationCap as StudentIcon, BookOpen, Users, Building2, CheckCircle2, Target, ChevronDown, } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

// User type selector data
export type UserType = "student" | "teacher" | "parent" | "school";

interface UserTypeInfo {
  id: UserType;
  label: string;
  icon: any;
  color: string;
  headline: string;
  subtext: string;
  benefits: string[];
  ctaText: string;
  gradient: string;
}

const userTypes: UserTypeInfo[] = [
  {
    id: "student",
    label: "Student",
    icon: StudentIcon,
    color: "rgb(249 115 22)",
    headline: "Discover Your Perfect Career Path",
    subtext: "Take free assessments, get matched to RUB colleges, and plan your future with confidence.",
    benefits: [
      "Free RIASEC career assessment",
      "AI-powered college matching",
      "Subject selection guidance for Class 11-12",
    ],
    ctaText: "Start Free Assessment",
    gradient: "from-orange-600 to-red-600",
  },
  {
    id: "teacher",
    label: "Teacher",
    icon: BookOpen,
    color: "rgb(59 130 246)",
    headline: "Teach More, Grade Less",
    subtext: "Auto-grade homework in seconds, track student progress, and identify learning gaps early.",
    benefits: [
      "8 homework question types with auto-grading",
      "Real-time student performance insights",
      "Learning module creation tools",
    ],
    ctaText: "Try as Teacher",
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    id: "parent",
    label: "Parent",
    icon: Users,
    color: "rgb(107 114 128)",
    headline: "Stay Connected to Your Child's Learning",
    subtext: "See homework, attendance, and progress daily. No more surprises at report card time.",
    benefits: [
      "Real-time homework and attendance tracking",
      "Direct messaging with teachers",
      "Pay school fees securely online",
    ],
    ctaText: "Monitor Progress",
    gradient: "from-gray-600 to-gray-700",
  },
  {
    id: "school",
    label: "School",
    icon: Building2,
    color: "rgb(139 92 246)",
    headline: "Complete School Management Platform",
    subtext: "One system for attendance, homework, fees, reports, and career guidance for all students.",
    benefits: [
      "Paperless administration in one dashboard",
      "Integrated career guidance for Classes 9-12",
      "Bulk operations to save teacher time",
    ],
    ctaText: "Request Demo",
    gradient: "from-purple-600 to-violet-600",
  },
];

// Social proof stats
const socialProofStats = [
  { value: "11", label: "RUB Colleges", icon: GraduationCap },
  { value: "50+", label: "Career Paths", icon: Target },
  { value: "50+", label: "Schools", icon: Building2 },
  { value: "10K+", label: "Students", icon: StudentIcon },
];

// Flow step data
const flowSteps = [
  { icon: User, label: "Student", color: "from-blue-500 to-blue-600" },
  { icon: ClipboardCheck, label: "Assessment", color: "from-purple-500 to-purple-600" },
  { icon: Sparkles, label: "Match", color: "from-orange-500 to-orange-600" },
  { icon: GraduationCap, label: "RUB", color: "from-green-500 to-green-600" },
  { icon: Trophy, label: "Success", color: "from-amber-500 to-amber-600" },
];

function FlowStep({
  step,
  index,
  totalSteps,
}: {
  step: typeof flowSteps[0];
  index: number;
  totalSteps: number;
}) {
  const Icon = step.icon;
  const isNotLast = index < totalSteps - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.15, duration: 0.5 }}
      className="relative flex flex-col items-center"
    >
      {/* Icon circle */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2 + index * 0.3,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
          delay: index * 0.2,
        }}
        className="relative"
      >
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>

        {/* Pulsing ring */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
            delay: index * 0.3,
          }}
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color}`}
        />
      </motion.div>

      {/* Label */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 + index * 0.15, duration: 0.4 }}
        className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400"
      >
        {step.label}
      </motion.span>

      {/* Connection line with flowing particle */}
      {isNotLast && (
        <div className="absolute top-7 left-full w-16 h-0.5 -ml-1 hidden sm:block">
          {/* Static line */}
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />

          {/* Animated flowing dot */}
          <motion.div
            animate={{
              left: ["0%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
              delay: index * 0.2,
            }}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
}

export function HeroSection() {
  const [selectedUser, setSelectedUser] = useState<UserType>("student");
  const [showDropdown, setShowDropdown] = useState(false);

  const currentUser = userTypes.find((u) => u.id === selectedUser) || userTypes[0];

  return (
    <section className="relative min-h-[90vh] flex items-center bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-16 w-full">
        {/* User Type Selector - Above everything */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-2 py-1.5 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-2">I am a:</span>
            {userTypes.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  selectedUser === user.id
                    ? "text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                )}
                style={selectedUser === user.id ? { background: `linear-gradient(135deg, ${user.color} 0%, ${user.color} 100%)` } : {}}
              >
                {user.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Social Proof Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 mb-10 text-sm"
        >
          {socialProofStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400"
              >
                <Icon className="w-4 h-4" style={{ color: index === 0 ? "rgb(34 197 94)" : index === 1 ? "rgb(249 115 22)" : index === 2 ? "rgb(139 92 246)" : "rgb(59 130 246)" }} />
                <span className="font-semibold text-gray-900 dark:text-gray-100">{stat.value}</span>
                <span>{stat.label}</span>
                {index < socialProofStats.length - 1 && <span className="text-gray-300 dark:text-gray-700">•</span>}
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left Side - Content (3/5) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={selectedUser}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-3"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-8"
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentUser.color }} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedUser === "school" ? "For Schools & Institutions" : "Free for " + currentUser.label + "s"}
              </span>
            </motion.div>

            {/* Headline - Dynamic based on user type */}
            <AnimatePresence mode="wait">
              <motion.h1
                key={`heading-${selectedUser}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-gray-950 dark:text-white leading-[1.1] mb-6"
              >
                {currentUser.headline}
              </motion.h1>
            </AnimatePresence>

            {/* Supporting text - Dynamic */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`subtext-${selectedUser}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-lg leading-relaxed"
              >
                {currentUser.subtext}
              </motion.p>
            </AnimatePresence>

            {/* Benefits list - Dynamic */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`benefits-${selectedUser}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mb-10 space-y-3"
              >
                {currentUser.benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: currentUser.color }} />
                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* CTA Button - Dynamic */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={`cta-${selectedUser}`}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Link href="/sign-up">
                <button
                  className="group inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium text-base transition-all duration-200 shadow-lg hover:shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${currentUser.color} 0%, ${currentUser.color} 100%)` }}
                >
                  {currentUser.ctaText}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Side - Flow Diagram (2/5) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="lg:col-span-2"
          >
            <div className="relative">
              {/* Background glow */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-3xl blur-3xl"
              />

              {/* Flow diagram container */}
              <div className="relative bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-200 dark:border-gray-800 p-8">
                {/* Title */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-8"
                >
                  Your journey at a glance
                </motion.p>

                {/* Flow steps - horizontal on desktop, vertical on mobile */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-4">
                  {flowSteps.map((step, index) => (
                    <FlowStep
                      key={step.label}
                      step={step}
                      index={index}
                      totalSteps={flowSteps.length}
                    />
                  ))}
                </div>

                {/* Bottom label */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    From assessment to success — all in one place
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
          className="w-5 h-8 border border-gray-300 dark:border-gray-700 rounded-full flex items-start justify-center p-1"
        >
          <div className="w-1 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
