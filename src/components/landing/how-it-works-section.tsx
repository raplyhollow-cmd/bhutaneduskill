"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, School, BookOpen, ClipboardCheck, Brain, Target, TrendingUp, GraduationCap, Award, Users, BarChart3 } from "lucide-react";
import React, { useState } from "react";

// The complete ecosystem flow - showing how everything connects
const ecosystemFlow = [
  {
    id: 1,
    phase: "School Management",
    title: "Your School, Organized",
    description: "Schools register, set up classes, and manage everything in one place.",
    icon: School,
    color: "from-blue-500 to-cyan-500",
    features: [
      { label: "Register school & create classes", icon: Check },
      { label: "Student & teacher management", icon: Check },
      { label: "Attendance tracking", icon: Check },
      { label: "Fee management", icon: Check },
    ],
    stats: { value: "100%", label: "Paperless Administration" },
  },
  {
    id: 2,
    phase: "Daily Learning",
    title: "Study Patterns That Work",
    description: "Teachers assign homework, track progress, and identify learning gaps.",
    icon: BookOpen,
    color: "from-emerald-500 to-green-500",
    features: [
      { label: "Homework assignment & auto-grading", icon: Check },
      { label: "Learning module creation", icon: Check },
      { label: "Progress tracking", icon: Check },
      { label: "Performance insights", icon: Check },
    ],
    stats: { value: "8+", label: "Question Types" },
  },
  {
    id: 3,
    phase: "Smart Assessments",
    title: "Discover Your Potential",
    description: "Take AI-powered assessments to understand your personality, strengths, and career interests.",
    icon: ClipboardCheck,
    color: "from-purple-500 to-violet-500",
    features: [
      { label: "RIASEC career test", icon: Check },
      { label: "Personality analysis", icon: Check },
      { label: "Strengths assessment", icon: Check },
      { label: "Interest discovery", icon: Check },
    ],
    stats: { value: "3", label: "Assessment Types" },
  },
  {
    id: 4,
    phase: "AI Analysis",
    title: "Intelligent Matching",
    description: "Our AI analyzes your assessment results, academic performance, and interests to find your ideal career path.",
    icon: Brain,
    color: "from-orange-500 to-amber-500",
    features: [
      { label: "Career-to-student matching", icon: Check },
      { label: "RUB college recommendations", icon: Check },
      { label: "Subject suggestions", icon: Check },
      { label: "Scholarship matching", icon: Check },
    ],
    stats: { value: "50+", label: "Career Paths" },
  },
  {
    id: 5,
    phase: "Career Planning",
    title: "Your Roadmap to Success",
    description: "Create a personalized plan with subject choices, goals, and milestones for Class 11-12 and beyond.",
    icon: Target,
    color: "from-rose-500 to-pink-500",
    features: [
      { label: "Subject selection guidance", icon: Check },
      { label: "Goal setting & tracking", icon: Check },
      { label: "Academic roadmap", icon: Check },
      { label: "BCSE preparation", icon: Check },
    ],
    stats: { value: "11", label: "RUB Colleges" },
  },
  {
    id: 6,
    phase: "Achievement",
    title: "Reach Your Dreams",
    description: "Track everything in one dashboard — homework, attendance, grades, and career progress.",
    icon: GraduationCap,
    color: "from-red-500 to-orange-500",
    features: [
      { label: "Unified progress dashboard", icon: Check },
      { label: "Achievement badges", icon: Check },
      { label: "College application support", icon: Check },
      { label: "Study abroad guidance", icon: Check },
    ],
    stats: { value: "5+", label: "Countries Covered" },
  },
];

// Stakeholder benefits - who benefits from each part
const stakeholders = [
  {
    title: "For Schools",
    description: "Complete management system",
    items: ["Attendance", "Homework", "Fees", "Reports"],
    color: "from-blue-500 to-cyan-500",
    icon: School,
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    title: "For Teachers",
    description: "Powerful classroom tools",
    items: ["Create Homework", "Auto-Grade", "Track Progress", "Identify Gaps"],
    color: "from-emerald-500 to-green-500",
    icon: BarChart3,
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    title: "For Students",
    description: "Career discovery & planning",
    items: ["Free Assessments", "AI Matches", "Career Plans", "RUB Guide"],
    color: "from-orange-500 to-amber-500",
    icon: GraduationCap,
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    title: "For Parents",
    description: "Stay connected to learning",
    items: ["Monitor Progress", "View Homework", "Pay Fees", "Communicate"],
    color: "from-purple-500 to-violet-500",
    icon: Users,
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
];

function EcosystemStep({ step, index, isActive, setActive }: { step: typeof ecosystemFlow[0]; index: number; isActive: boolean; setActive: (index: number) => void }) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`relative transition-all duration-500 ${isActive ? "scale-105" : "scale-100"}`}
      onMouseEnter={() => setActive(index)}
    >
      {/* Card */}
      <div
        className={`relative p-6 rounded-2xl border-2 transition-all duration-300 h-full ${
          isActive
            ? `bg-gradient-to-br ${step.color.replace('from-', 'from-').replace('to-', 'to-')} bg-opacity-10 dark:bg-opacity-5 border-current shadow-xl`
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
        }`}
        style={isActive ? {
          borderColor: `rgb(${step.color.includes('blue') ? '59,130,246' : step.color.includes('emerald') ? '16,185,129' : step.color.includes('purple') ? '168,85,247' : step.color.includes('orange') ? '249,115,22' : step.color.includes('rose') ? '244,63,94' : '239,68,68'})`,
          background: `linear-gradient(135deg, ${step.color.includes('blue') ? 'rgba(59,130,246,0.05)' : step.color.includes('emerald') ? 'rgba(16,185,129,0.05)' : step.color.includes('purple') ? 'rgba(168,85,247,0.05)' : step.color.includes('orange') ? 'rgba(249,115,22,0.05)' : step.color.includes('rose') ? 'rgba(244,63,94,0.05)' : 'rgba(239,68,68,0.05)'} 0%, transparent 100%)`
        } : {}}
      >
        {/* Phase badge */}
        <div className="absolute -top-3 left-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${step.color} shadow-lg`}>
            {step.phase}
          </span>
        </div>

        {/* Content */}
        <div className="pt-4">
          {/* Icon + Stats */}
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${step.color} text-white`}>
              <Icon className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                {step.stats.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{step.stats.label}</div>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {step.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            {step.description}
          </p>

          {/* Features */}
          <div className="space-y-2">
            {step.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <feature.icon className={`w-4 h-4 text-${step.color.includes('blue') ? 'blue' : step.color.includes('emerald') ? 'emerald' : step.color.includes('purple') ? 'purple' : step.color.includes('orange') ? 'orange' : step.color.includes('rose') ? 'rose' : 'red'}-500 flex-shrink-0`} strokeWidth={3} />
                <span className="text-gray-700 dark:text-gray-300">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connection arrow (except last) */}
      {index < ecosystemFlow.length - 1 && (
        <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 z-10">
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-lg"
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function StakeholderCard({ stakeholder, index }: { stakeholder: typeof stakeholders[0]; index: number }) {
  const Icon = stakeholder.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group"
    >
      <div className={`${stakeholder.bgColor} rounded-2xl p-6 border border-gray-200 dark:border-gray-800 h-full transition-all duration-300 hover:shadow-lg`}>
        {/* Icon */}
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stakeholder.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-950 dark:text-white mb-1">
          {stakeholder.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {stakeholder.description}
        </p>

        {/* Items */}
        <div className="flex flex-wrap gap-2">
          {stakeholder.items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const [active, setActive] = useState(0);

  return (
    <section className="relative py-32 bg-white dark:bg-gray-950 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-0 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-950 dark:text-white mb-4">
            One Connected{" "}
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Ecosystem
            </span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            From school administration to career success — everything works together seamlessly.
          </p>
        </motion.div>

        {/* Ecosystem Flow - The Main Story */}
        <div className="mb-20">
          {/* Flow indicator */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-8 overflow-x-auto pb-2"
          >
            {ecosystemFlow.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setActive(index)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    active === index
                      ? `bg-gradient-to-r ${step.color} text-white shadow-lg`
                      : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  {index + 1}. {step.phase}
                </button>
                {index < ecosystemFlow.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-700 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </motion.div>

          {/* Cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ecosystemFlow.map((step, index) => (
              <EcosystemStep
                key={step.id}
                step={step}
                index={index}
                isActive={active === index}
                setActive={setActive}
              />
            ))}
          </div>
        </div>

        {/* How Everything Connects - Visual Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 rounded-3xl p-8 md:p-12 mb-20 border border-gray-200 dark:border-gray-800"
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              The Power of Integration
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              When school data connects with career guidance, magic happens. Here's how data flows through our ecosystem:
            </p>
          </div>

          {/* Flow visualization */}
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left side - Data collection */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <School className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">School Data</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Attendance, homework, grades</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Assessment Results</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Personality, interests, strengths</div>
                  </div>
                </div>
              </div>

              {/* Right side - Outcomes */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">AI Analysis</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Matches patterns to careers</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Personalized Plan</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Subjects, goals, roadmap</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Central connection arrow */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-2">
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold shadow-lg"
              >
                AI Processing
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stakeholder Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Everyone Benefits
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              One platform, multiple stakeholders — all connected
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stakeholders.map((stakeholder, index) => (
              <StakeholderCard key={stakeholder.title} stakeholder={stakeholder} index={index} />
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 hover:shadow-xl transition-all"
          >
            Join the Ecosystem
            <ArrowRight className="w-5 h-5" strokeWidth={2} />
          </Link>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Free for schools • No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}
