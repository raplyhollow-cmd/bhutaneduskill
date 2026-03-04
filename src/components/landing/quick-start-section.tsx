/**
 * Quick Start Guide Section
 *
 * Shows exactly how each user type gets started in 3 simple steps.
 * Features:
 *
 * - User type selector tabs
 * - Step-by-step visual guide
 * - Time estimates for each step
 * - Clear outcome descriptions
 * - Smooth animations on tab switch
 *
 * @example
 * ```tsx
 * import { QuickStartSection } from "@/components/landing/quick-start-section"
 *
 * export default function HomePage() {
 *   return (
 *     <>
 *       <HeroSection />
 *       <QuickStartSection />
 *     </>
 *   )
 * }
 * ```
 */

"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, CheckCircle2, Clock, User, BookOpen, Users, Building2, Sparkles, Target, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

export type QuickStartUserType = "student" | "teacher" | "parent" | "school"

interface QuickStartStep {
  number: number
  title: string
  description: string
  time: string
  icon: any
  outcome: string
}

interface UserGuide {
  type: QuickStartUserType
  label: string
  icon: any
  color: string
  gradient: string
  steps: QuickStartStep[]
  ctaText: string
}

// ============================================================================
// USER GUIDES DATA
// ============================================================================

const userGuides: UserGuide[] = [
  {
    type: "student",
    label: "Student",
    icon: User,
    color: "rgb(249 115 22)",
    gradient: "from-orange-500 to-red-500",
    steps: [
      {
        number: 1,
        title: "Create Your Account",
        description: "Sign up for free using your email or school code",
        time: "~30 seconds",
        icon: User,
        outcome: "Personalized dashboard ready",
      },
      {
        number: 2,
        title: "Take Assessments",
        description: "Complete the RIASEC career test and discover your strengths",
        time: "~15 minutes",
        icon: Sparkles,
        outcome: "Detailed personality profile",
      },
      {
        number: 3,
        title: "Get Matched",
        description: "See AI-powered career matches and RUB college recommendations",
        time: "Instant",
        icon: Target,
        outcome: "Clear path to your future",
      },
    ],
    ctaText: "Start Your Journey",
  },
  {
    type: "teacher",
    label: "Teacher",
    icon: BookOpen,
    color: "rgb(59 130 246)",
    gradient: "from-blue-500 to-cyan-500",
    steps: [
      {
        number: 1,
        title: "Join Your School",
        description: "Sign up and connect with your school (or create a classroom)",
        time: "~1 minute",
        icon: Building2,
        outcome: "Teacher dashboard ready",
      },
      {
        number: 2,
        title: "Create Content",
        description: "Build homework, assignments, and learning modules with auto-grading",
        time: "~5 minutes",
        icon: BookOpen,
        outcome: "Ready-to-use classroom materials",
      },
      {
        number: 3,
        title: "Track & Support",
        description: "Monitor student progress and identify who needs extra help",
        time: "Ongoing",
        icon: Users,
        outcome: "Data-driven teaching decisions",
      },
    ],
    ctaText: "Start Teaching Smarter",
  },
  {
    type: "parent",
    label: "Parent",
    icon: Users,
    color: "rgb(107 114 128)",
    gradient: "from-gray-500 to-gray-600",
    steps: [
      {
        number: 1,
        title: "Connect with Child",
        description: "Create account and link with your child's student profile",
        time: "~1 minute",
        icon: User,
        outcome: "Family dashboard connected",
      },
      {
        number: 2,
        title: "Stay Informed",
        description: "View daily homework, attendance, and progress updates",
        time: "Real-time",
        icon: Clock,
        outcome: "Never miss an update",
      },
      {
        number: 3,
        title: "Support Learning",
        description: "Message teachers, pay fees, and help with career planning",
        time: "As needed",
        icon: Sparkles,
        outcome: "Active participation in education",
      },
    ],
    ctaText: "Stay Connected",
  },
  {
    type: "school",
    label: "School",
    icon: Building2,
    color: "rgb(139 92 246)",
    gradient: "from-purple-500 to-violet-500",
    steps: [
      {
        number: 1,
        title: "Register School",
        description: "Sign up and add your school details with RUB college codes",
        time: "~5 minutes",
        icon: Building2,
        outcome: "School management portal ready",
      },
      {
        number: 2,
        title: "Onboard Staff",
        description: "Add teachers, create classes, and import student data",
        time: "~15 minutes",
        icon: Users,
        outcome: "Full school system active",
      },
      {
        number: 3,
        title: "Transform Education",
        description: "Enable career guidance, auto-grading, and parent communication",
        time: "Immediate",
        icon: GraduationCap,
        outcome: "Modern education ecosystem",
      },
    ],
    ctaText: "Request School Demo",
  },
]

// ============================================================================
// STEP CARD COMPONENT
// ============================================================================

function StepCard({ step, color, index }: { step: QuickStartStep; color: string; index: number }) {
  const Icon = step.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
      className="relative"
    >
      {/* Connection line (not for last step) */}
      {index < 2 && (
        <div className="hidden sm:block absolute top-12 left-12 w-[calc(100%-3rem)] h-0.5 -z-10">
          <motion.div
            className="h-full bg-gray-200 dark:bg-gray-700"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
            style={{ originX: 0 }}
          />
        </div>
      )}

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow duration-300">
        {/* Step Number Badge */}
        <div
          className="absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
          style={{ background: `linear-gradient(135deg, ${color} 0%, ${color} 100%)` }}
        >
          {step.number}
        </div>

        {/* Icon */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {step.description}
        </p>

        {/* Time estimate */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>{step.time}</span>
        </div>

        {/* Outcome */}
        <div className="flex items-start gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {step.outcome}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuickStartSection() {
  const [selectedType, setSelectedType] = useState<QuickStartUserType>("student")

  const currentGuide = userGuides.find((g) => g.type === selectedType) || userGuides[0]

  return (
    <section className="relative py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-sm font-medium text-orange-700 dark:text-orange-400 mb-6">
            <Sparkles className="w-4 h-4" />
            Get Started in Minutes
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-950 dark:text-white mb-4">
            How to{" "}
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Get Started
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Three simple steps to transform your educational journey. Choose your role below.
          </p>
        </motion.div>

        {/* User Type Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-3 mb-16"
        >
          {userGuides.map((guide) => (
            <button
              key={guide.type}
              onClick={() => setSelectedType(guide.type)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200",
                selectedType === guide.type
                  ? "text-white shadow-lg scale-105"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              )}
              style={selectedType === guide.type ? { background: `linear-gradient(135deg, ${guide.color} 0%, ${guide.color} 100%)` } : {}}
            >
              <guide.icon className="w-4 h-4" />
              {guide.label}
            </button>
          ))}
        </motion.div>

        {/* Steps Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            {currentGuide.steps.map((step, index) => (
              <StepCard key={step.number} step={step} color={currentGuide.color} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          key={`cta-${selectedType}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center"
        >
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200"
            style={{ background: `linear-gradient(135deg, ${currentGuide.color} 0%, ${currentGuide.color} 100%)` }}
          >
            {currentGuide.ctaText}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {selectedType === "school" ? "No credit card required for demo" : "Free forever for students"}
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export default QuickStartSection
