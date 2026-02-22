"use client";

import { motion } from "framer-motion";
import { Calendar, Rocket, CheckCircle2, ChevronRight, Terminal, GitCommit, Code2, Server, Bug } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Phase {
  id: string;
  name: string;
  period: string;
  gradient: string;
  icon: React.ReactNode;
  description: string;
  achievements: string[];
  files: number;
  color: string;
}

const phases: Phase[] = [
  {
    id: "phase1",
    name: "Phase 1: Foundation",
    period: "January 2026",
    gradient: "from-purple-500 to-violet-600",
    icon: <Terminal className="w-6 h-6" />,
    description: "Core platform architecture with authentication, multi-tenant support, and foundational portals.",
    achievements: [
      "6 Core Portals (Student, Teacher, Parent, Counselor, School Admin, Admin)",
      "Authentication & User Management with Clerk",
      "Multi-tenant Architecture",
      "Core Academic Modules (Homework, Attendance, Fees)",
      "RBAC System Implementation"
    ],
    files: 50,
    color: "rgb(139 92 246)"
  },
  {
    id: "phase2",
    name: "Phase 2: AI & Assessments",
    period: "Early February 2026",
    gradient: "from-blue-500 to-cyan-600",
    icon: <Code2 className="w-6 h-6" />,
    description: "AI-powered career guidance, assessment systems, and Clerk-style UI components.",
    achievements: [
      "5 Assessment Types (MBTI, RIASEC, DISC, Learning Styles, Work Values)",
      "AI Integration with Gemini API",
      "Clerk-Style UI Components (Toasts, Modals, User Button)",
      "Career Matching Engine",
      "Journal with AI Insights"
    ],
    files: 75,
    color: "rgb(59 130 246)"
  },
  {
    id: "phase3",
    name: "Phase 3: Infrastructure",
    period: "February 18, 2026",
    gradient: "from-orange-500 to-red-600",
    icon: <Server className="w-6 h-6" />,
    description: "9 parallel batches creating 94 files. Complete school management infrastructure.",
    achievements: [
      "Batch 23: Gate Pass System (QR codes, approvals)",
      "Batch 24: Library Management (catalog, circulation)",
      "Batch 25: Alumni Portal - 8th Portal (green theme)",
      "Batch 26: Payroll System (Bhutan tax slabs, PDF)",
      "Batch 27: Medical Records (vaccinations, inventory)",
      "Batch 28: Transport Management (routes, tracking)",
      "Batch 29: Leave Management (7 types, substitutes)",
      "Batch 30: Inventory Management (items, procurement)",
      "Batch 31: Events Calendar (registration, check-in)"
    ],
    files: 94,
    color: "rgb(249 115 22)"
  },
  {
    id: "phase4",
    name: "Current: Refinement",
    period: "February 19, 2026",
    gradient: "from-green-500 to-emerald-600",
    icon: <Bug className="w-6 h-6" />,
    description: "Bug fixes, navigation updates, and refinements. 98% of vision complete.",
    achievements: [
      "Fixed Journal AI Insights API (dynamic import pattern)",
      "Fixed Assessment Result Tables (added assessmentId)",
      "Fixed Student Plan page status updates",
      "Seeded 41 Bhutan schools to database",
      "Fixed AI Insights timeout (removed 10s wrapper)",
      "Updated 12 navigation routes (/dashboard → /student)"
    ],
    files: 20,
    color: "rgb(34 197 94)"
  }
];

function PhaseCard({ phase, index, isExpanded, onToggle }: { phase: Phase; index: number; isExpanded: boolean; onToggle: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="relative"
    >
      {/* Timeline dot */}
      <div className="absolute left-0 top-8 w-4 h-4 rounded-full border-4 border-ceramic-bg-dark z-10" style={{ backgroundColor: phase.color }} />

      {/* Connector line */}
      {index < phases.length - 1 && (
        <div className="absolute left-1.5 top-12 w-0.5 h-full bg-gradient-to-b from-ceramic-gray-700 to-transparent" />
      )}

      {/* Card */}
      <div className="relative ml-10">
        <motion.div
          className={cn(
            "relative bg-ceramic-white/5 dark:bg-ceramic-white/5 backdrop-blur-sm rounded-2xl border overflow-hidden transition-all duration-300",
            isExpanded ? 'border-ceramic-border' : 'border-ceramic-border hover:border-ceramic-brand/30'
          )}
          style={{
            boxShadow: isExpanded ? `0 0 40px -10px ${phase.color}40` : 'none'
          }}
        >
          {/* Gradient glow effect */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              className="absolute inset-0 bg-gradient-to-r opacity-20"
              style={{ background: `linear-gradient(135deg, ${phase.color}, transparent)` }}
            />
          )}

          {/* Header */}
          <button
            onClick={onToggle}
            className="relative w-full text-left p-6 hover:bg-ceramic-gray-50/50 dark:hover:bg-ceramic-gray-800/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className="p-3 rounded-xl text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${phase.color} 0%, ${phase.color} 100%)` }}
              >
                {phase.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-ceramic-primary dark:text-white">{phase.name}</h3>
                  {isExpanded && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-2 py-0.5 rounded-full text-xs font-semibold bg-ceramic-positive/20 text-ceramic-positive border border-ceramic-positive/30"
                    >
                      Active
                    </motion.span>
                  )}
                </div>
                <p className="text-ceramic-secondary dark:text-ceramic-gray-400 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {phase.period}
                </p>
              </div>

              {/* Chevron */}
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-ceramic-dimmed"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.div>
            </div>
          </button>

          {/* Expanded content */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-6 pb-6"
            >
              <p className="text-ceramic-secondary dark:text-ceramic-gray-400 mb-4">{phase.description}</p>

              {/* Files created badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ceramic-gray-50 dark:bg-ceramic-gray-800 border border-ceramic-border mb-4">
                <Code2 className="w-4 h-4 text-ceramic-secondary" />
                <span className="text-sm text-ceramic-primary dark:text-ceramic-gray-200">{phase.files} files created</span>
              </div>

              {/* Achievements list */}
              <div className="space-y-2">
                {phase.achievements.map((achievement, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-ceramic-positive flex-shrink-0 mt-0.5" />
                    <span className="text-ceramic-primary dark:text-ceramic-gray-200 text-sm">{achievement}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function TimelineSection() {
  const [expandedPhase, setExpandedPhase] = useState("phase3");

  return (
    <section id="timeline" className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-ceramic-bg-dark via-ceramic-gray-900 to-ceramic-bg-dark" />

      {/* Gradient accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-ceramic-brand/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ceramic-white/5 dark:bg-ceramic-white/5 backdrop-blur-sm border border-ceramic-border mb-6">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-ceramic-secondary dark:text-ceramic-gray-300">Development Timeline</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            From <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(135deg, rgb(168 85 247) 0%, rgb(236 72 153) 100%)' }}>Idea</span> to{" "}
            <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>Impact</span>
          </h2>

          <p className="text-lg text-ceramic-gray-400 max-w-2xl mx-auto">
            Track our progress through four distinct phases of development, from foundational architecture
            to a comprehensive education platform serving all of Bhutan.
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-16"
        >
          <div className="h-2 bg-ceramic-gray-800 rounded-full overflow-hidden">
            <div className="h-full w-full" style={{ background: 'linear-gradient(90deg, rgb(139 92 246) 0%, rgb(59 130 246) 33%, rgb(249 115 22) 66%, rgb(34 197 94) 100%)' }} />
          </div>
          <div className="flex justify-between mt-2 text-sm text-ceramic-dimmed font-mono">
            <span>Jan 2026</span>
            <span className="text-ceramic-positive">98% Complete</span>
            <span>Feb 2026</span>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-1.5 top-0 bottom-0 w-0.5 opacity-30" style={{ background: 'linear-gradient(180deg, rgb(139 92 246) 0%, rgb(59 130 246) 33%, rgb(249 115 22) 66%, rgb(34 197 94) 100%)' }} />

          <div className="space-y-6">
            {phases.map((phase, index) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                index={index}
                isExpanded={expandedPhase === phase.id}
                onToggle={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-ceramic-white/5 dark:bg-ceramic-white/5 backdrop-blur-sm border border-ceramic-border">
            <Rocket className="w-5 h-5 text-ceramic-brand" />
            <span className="text-ceramic-gray-300 font-medium">
              {phases.reduce((sum, p) => sum + p.files, 0)}+ files created across all phases
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
